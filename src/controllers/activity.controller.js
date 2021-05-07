const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { activityService } = require('../services');
var moment = require('moment');
const { ConsoleTransportOptions } = require('winston/lib/winston/transports');
const { Activity } = require('../models');
const { response } = require('express');
const { data } = require('../config/logger');

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

// const getActivitiesByToday = catchAsync(async (req, res) => {
//   var inputDate = Date();
//   var today = moment().startOf('day');
//   console.log(today);
//   const filter = { userId: req.user._id, startDate: { $gte: new Date(2021, 2, 3), $lt: new Date(2021, 2, 4) } };
//   const options = pick(req.query, ['sortBy', 'limit', 'page']);
//   const result = await activityService.queryActivities(filter, options);
//   res.send(result);
// });
const getCustomActivity = (resultArray, inputArray) => {
  labels = [];
  datas = [];
  resultArray.docs.map((value) => {
    date = new Date(value._id.year, value._id.month - 1, value._id.day);

    labels.push(`${moment(date).format('dd')}/${moment(date).format('D')}`);
    datas.push((value.total / 1000).toFixed(2));
  });
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  return { inputArray, overallConsumption };
};
const getCustomActivity1Month = (resultArray, inputArray) => {
  labels = [];
  datas = [];
  resultArray.docs.map((value) => {
    labels.push('Week ' + value._id.week);
    datas.push((value.total / 1000).toFixed(2));
  });
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  return { inputArray, overallConsumption };
};
const getActivitiesBy7Days = catchAsync(async (req, res) => {
  var today = new Date(2021, 2, 3);
  var lastDate = moment(today).subtract(7, 'days');
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gte: new Date(lastDate), $lte: new Date(today) } });
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
  result7Days = getCustomActivity(result, result7Days);
  res.json({ result7Days });
});
const getActivitiesBy1Month = catchAsync(async (req, res) => {
  var today = new Date(2021, 2 - 1, 10);
  var lastDate = moment(today).subtract(1, 'month');
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gt: new Date(lastDate), $lt: new Date(today) } });
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
  result1Month = getCustomActivity1Month(result, result1Month);
  res.json({ result1Month });
});

const getCustomActivityOneDay = (resultArray, inputArray) => {
  labels = [];
  datas = [];
  resultArray.docs.map((value) => {
    labels.push(value._id.hour + ':00');
    datas.push((value.total / 1000).toFixed(2));
  });
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  return { inputArray, overallConsumption };
};

const getActivitiesByOneDay = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let lastDate;
  if (req.params.day == 'today') {
    lastDate = moment(today).add(24, 'hours');
  } else if (req.params.day == 'yesterday') {
    lastDate = today;
    today = moment(today).subtract(24, 'hours');
  }
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gte: new Date(today), $lt: new Date(lastDate) } });
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
  resultOneDay = getCustomActivityOneDay(result, resultOneDay);
  res.json({ resultOneDay });
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
};
