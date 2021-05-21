const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { activityService } = require('../services');
const { roomService } = require('../services');
var moment = require('moment');
const { ConsoleTransportOptions } = require('winston/lib/winston/transports');
const { Activity } = require('../models');
const { Room } = require('../models');
const { response } = require('express');
const { data } = require('../config/logger');
const { ObjectId } = require('mongodb');

const createActivity = catchAsync(async (req, res) => {
  const activity = await activityService.createActivity(req.body, req.user._id);
  res.status(httpStatus.CREATED).send(activity);
});

const getActivities = catchAsync(async (req, res) => {
  const filter = { userId: req.user._id };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await activityService.queryActivities(filter, options);
  res.send(result);
});

const getRoomDevices = async (userId, roomArray) => {
  let aggregate = Room.aggregate();
  aggregate.match({ userId: userId, _id: { $in: roomArray } });
  const options = {
    pagination: false,
  };
  const result = await roomService.queryAggregateRooms(aggregate, options);
  let deviceArray = [];
  result.docs.map((value) => {
    deviceArray.push(value.devices);
  });
  deviceArray = [deviceArray.join()];
  return deviceArray;
};

// const getActivitiesByToday = catchAsync(async (req, res) => {
//   var inputDate = Date();
//   var today = moment().startOf('day');
//   console.log(today);
//   const filter = { userId: req.user._id, startDate: { $gte: new Date(2021, 2, 3), $lt: new Date(2021, 2, 4) } };
//   const options = pick(req.query, ['sortBy', 'limit', 'page']);
//   const result = await activityService.queryActivities(filter, options);
//   res.send(result);
// });

const getActivitiesByOneDay = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let today2 = '';
  let lastDate = '';
  if (req.params.day == 'today') {
    if (req.query.startDate != null) {
    }
    lastDate = moment(today).add(24, 'hours');
    today2 = moment(today).format('Do MMMM');
  } else if (req.params.day == 'yesterday') {
    lastDate = today;
    today = moment(today).subtract(24, 'hours');
    today2 = moment(today).format('Do MMMM');
  }
  //  else {
  // return res.status(500).json({ message: 'No route found' });
  // }
  //
  let aggregate = Activity.aggregate();
  console.log('deviceArray');
  let deviceArray = Object.values(req.query);
  console.log(deviceArray, 'kk');
  deviceArray = deviceArray.map((value) => {
    if (ObjectId.isValid(value)) return ObjectId(value);
  });
  console.log(deviceArray);
  if (deviceArray.length < 1) {
    aggregate.match({ userId: req.user._id, startDate: { $gte: new Date(today), $lt: new Date(lastDate) } });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gte: new Date(today), $lt: new Date(lastDate) },
    });
  }
  aggregate.unwind({ path: '$activity' });
  aggregate.group({
    _id: {
      month1: { $month: '$activity.timestamp' },
      day1: { $dayOfMonth: '$activity.timestamp' },
      year1: { $year: '$activity.timestamp' },
      hour1: { $hour: '$activity.timestamp' },
      deviceId: '$deviceId',
    },
    min: { $min: '$activity.overall' },
    max: { $max: '$activity.overall' },
  });
  aggregate.project({
    difference: { $subtract: ['$max', '$min'] },
  });
  aggregate.lookup({
    from: 'devices',
    localField: '_id.deviceId',
    foreignField: '_id',
    as: 'devices',
  });
  aggregate.group({
    _id: {
      month: '$_id.month1',
      day: '$_id.day1',
      year: '$_id.year1',
      hour: '$_id.hour1',
    },
    total: { $sum: '$difference' },
  });
  aggregate.sort({ '_id.day': -1, '_id.hour': 1 });
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let resultOneDay = { labels: [], datasets: { data: [] } };
  if (result.docs[0]?.total) {
    resultOneDay = getActivitiesByOneDayHelper(result, resultOneDay);
  } else {
    return res.status(404).send({ message: 'No data found' });
  }
  res.json({ resultOneDay, startDate: today2 });
});

const getActivitiesByOneDayHelper = (resultArray, inputArray) => {
  labels = [];
  datas = [];
  labels.push(' ');
  datas.push((resultArray.docs[0].total / 1000).toFixed(2));
  resultArray.docs.map((value) => {
    if (value._id.hour >= 12) {
      if (Math.abs(value._id.hour - 12) == 0) {
        labels.push('12pm');
      } else {
        labels.push(Math.abs(value._id.hour - 12) + 'pm');
      }
    } else {
      if (value._id.hour == 0) {
        value._id.hour = 12;
      }
      labels.push(value._id.hour + 'am');
    }

    datas.push((value.total / 1000).toFixed(2));
  });
  labels.push(' ');
  datas.push((resultArray.docs[resultArray.docs.length - 1].total / 1000).toFixed(2));
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total / 1000)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  return { inputArray, overallConsumption };
};

const getActivitiesBy7Days = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let today2 = moment(today).format('Do MMMM');
  let lastDate = moment(today).subtract(7, 'days');
  let lastDate2 = moment(lastDate).format('Do MMMM');
  let aggregate = Activity.aggregate();
  let deviceArray = Object.values(req.query);
  deviceArray = deviceArray.map((value) => {
    return ObjectId(value);
  });
  if (deviceArray.length < 1) {
    aggregate.match({ userId: req.user._id, startDate: { $gte: new Date(lastDate), $lt: new Date(today) } });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gte: new Date(lastDate), $lt: new Date(today) },
    });
  }
  aggregate.group({
    _id: {
      month: { $month: '$startDate' },
      day: { $dayOfMonth: '$startDate' },
      year: { $year: '$startDate' },
    },
    total: { $sum: '$overallConsumption' },
  });
  aggregate.sort({ '_id.month': 1, '_id.day': 1 });
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result7Days = { labels: [], datasets: { data: [] } };
  if (result.docs[0]?.total) {
    result7Days = getActivitiesBy7DayHelper(result, result7Days);
  } else {
    return res.status(404).send({ message: 'No data found' });
  }

  res.json({ result7Days, startDate: today2, endDate: lastDate2 });
});

const getActivitiesBy7DayHelper = (resultArray, inputArray) => {
  labels = [];
  datas = [];
  labels.push(' ');
  datas.push((resultArray.docs[0].total / 1000).toFixed(2));
  resultArray.docs.map((value) => {
    date = new Date(value._id.year, value._id.month - 1, value._id.day);

    labels.push(`${moment(date).format('dd')}/${moment(date).format('D')}`);
    datas.push((value.total / 1000).toFixed(2));
  });
  labels.push(' ');
  datas.push((resultArray.docs[resultArray.docs.length - 1].total / 1000).toFixed(2));
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total / 1000)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  return { inputArray, overallConsumption };
};

const getActivitiesBy1Month = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let today2 = moment(today).format('Do MMMM');
  var lastDate = moment(today).subtract(1, 'month');
  let lastDate2 = moment(lastDate).format('Do MMMM');
  let aggregate = Activity.aggregate();
  let deviceArray = Object.values(req.query);
  deviceArray = deviceArray.map((value) => {
    return ObjectId(value);
  });
  if (deviceArray.length < 1) {
    aggregate.match({ userId: req.user._id, startDate: { $gte: new Date(lastDate), $lt: new Date(today) } });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gte: new Date(lastDate), $lt: new Date(today) },
    });
  }
  aggregate.group({
    _id: {
      week: { $week: '$startDate' },
      year: { $year: '$startDate' },
    },
    total: { $sum: '$overallConsumption' },
  });
  aggregate.sort({ '_id.week': 1, '_id.month': 1 });
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result1Month = { labels: [], datasets: { data: [] } };
  if (result.docs[0]?.total) {
    result1Month = getActivitiesBy1MonthHelper(result, result1Month);
    res.json({ result1Month, startDate: today2, endDate: lastDate2 });
  } else {
    res.json({ message: 'No data found' });
  }
});

const getActivitiesBy1MonthHelper = (resultArray, inputArray) => {
  console.log(inputArray);
  labels = [];
  datas = [];
  labels.push(' ');
  datas.push((resultArray.docs[0].total / 1000).toFixed(2));
  resultArray.docs.map((value) => {
    // console.log(value.total);
    labels.push('Week ' + value._id.week);
    datas.push((value.total / 1000).toFixed(2));
  });
  labels.push(' ');
  // console.log(resultArray.docs);
  datas.push((resultArray.docs[resultArray.docs.length - 1].total / 1000).toFixed(2));
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total / 1000)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  console.log(inputArray);
  return { inputArray, overallConsumption };
};
const getCutomActivity = catchAsync(async (req, res) => {
  today = moment(req.query.endDate).startOf('day');
  let today2 = moment(today).format('D MMMM');
  lastDate = moment(req.query.startDate).startOf('day');
  let lastDate2 = moment(lastDate).format('D MMMM');
  diff = today.diff(lastDate, 'days');
  let aggregate = Activity.aggregate();
  let deviceArray = Object.values(req.query);
  let functionSwitch = '';
  deviceArray = deviceArray.map((value) => {
    if (ObjectId.isValid(value)) return ObjectId(value);
  });
  console.log(deviceArray);
  if (deviceArray.length < 1) {
    aggregate.match({
      userId: req.user._id,
      startDate: { $gte: new Date(lastDate), $lt: new Date(today) },
    });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gte: new Date(lastDate), $lt: new Date(today) },
    });
  }
  if (diff >= 14) {
    aggregate.group({
      _id: {
        week: { $week: '$startDate' },
        year: { $year: '$startDate' },
      },
      total: { $sum: '$overallConsumption' },
    });
    aggregate.sort({ '_id.week': 1, '_id.month': 1 });
    functionSwitch = 'Month';
  } else if (diff > 1 && diff < 14) {
    aggregate.group({
      _id: {
        month: { $month: '$startDate' },
        day: { $dayOfMonth: '$startDate' },
        year: { $year: '$startDate' },
      },
      total: { $sum: '$overallConsumption' },
    });
    aggregate.sort({ '_id.month': 1, '_id.day': 1 });
    functionSwitch = 'Day';
  } else {
    aggregate.unwind({ path: '$activity' });
    aggregate.group({
      _id: {
        month1: { $month: '$activity.timestamp' },
        day1: { $dayOfMonth: '$activity.timestamp' },
        year1: { $year: '$activity.timestamp' },
        hour1: { $hour: '$activity.timestamp' },
        deviceId: '$deviceId',
      },
      min: { $min: '$activity.overall' },
      max: { $max: '$activity.overall' },
    });
    aggregate.project({
      difference: { $subtract: ['$max', '$min'] },
    });
    aggregate.lookup({
      from: 'devices',
      localField: '_id.deviceId',
      foreignField: '_id',
      as: 'devices',
    });
    aggregate.group({
      _id: {
        month: '$_id.month1',
        day: '$_id.day1',
        year: '$_id.year1',
        hour: '$_id.hour1',
      },
      total: { $sum: '$difference' },
    });
    aggregate.sort({ '_id.day': -1, '_id.hour': 1 });
    functionSwitch = 'Hour';
  }

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let customResult = { labels: [], datasets: { data: [] } };
  let resultConsumption = '';
  console.log(functionSwitch);
  switch (functionSwitch) {
    case 'Month':
      if (result.docs[0]?.total) {
        resultConsumption = getActivitiesBy1MonthHelper(result, customResult);
      } else {
        return res.status(404).send({ message: 'No data found' });
      }
      break;
    case 'Day':
      if (result.docs[0]?.total) {
        resultConsumption = getActivitiesBy7DayHelper(result, customResult);
      } else {
        return res.status(404).send({ message: 'No data found' });
      }
      break;
    case 'Hour':
      if (result.docs[0]?.total) {
        resultConsumption = getActivitiesByOneDayHelper(result, customResult);
      } else {
        return res.status(404).send({ message: 'No data found' });
      }
      break;
  }
  // console.log(result);
  res.json({ resultConsumption, startDate: today2, endDate: lastDate2 });
  // res.json({ result });
});

const getActivity = catchAsync(async (req, res) => {
  const activity = await activityService.getActivityById(req.params.activityId);
  if (!activity) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Activity not found');
  }
  res.send(activity);
});

const updateActivity = catchAsync(async (req, res) => {
  const activity = await activityService.updateActivityById(req.params.activityId, req.body);
  res.send(activity);
});

const deleteActivity = catchAsync(async (req, res) => {
  await activityService.deleteActivityById(req.params.activityId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createActivity,
  getActivities,
  getActivitiesByOneDay,
  getActivitiesBy7Days,
  getActivitiesBy1Month,
  //   getRoomActivitys,
  getActivity,
  updateActivity,
  deleteActivity,
  getCutomActivity,
};
