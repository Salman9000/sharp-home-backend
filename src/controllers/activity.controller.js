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
  // console.log(req.user);
  const filter = { userId: req.user._id };
  console.log(filter);
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

    labels.push(moment(date).format('dddd'));
    datas.push((value.total / 1000).toFixed(2));
  });
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  // console.log(inputArray);
  return { inputArray };
};
const getCustomActivity1Month = (resultArray, inputArray) => {
  labels = [];
  datas = [];
  resultArray.docs.map((value) => {
    // date = new Date(value._id.year, value._id.month - 1, value._id.day);

    labels.push('Week ' + value._id.week);
    datas.push((value.total / 1000).toFixed(2));
  });
  inputArray.labels = labels;
  inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  // console.log(inputArray);
  return { inputArray };
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
    // page: 1,
    pagination: false,
    // limit: 10,
    //,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  console.log(result);
  let result7Days = { labels: [], datasets: { data: [] } };
  result7Days = getCustomActivity(result, result7Days);
  // result7days.count = result7days.days.length;
  // console.log(result7days.days);
  console.log(result7Days);
  res.json({ result7Days });
});
const getActivitiesBy1Month = catchAsync(async (req, res) => {
  var today = new Date(2021, 2 - 1, 10);
  // console.log(today);
  var lastDate = moment(today).subtract(1, 'month');
  // console.log(lastDate);
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
    // page: 1,
    pagination: false,
    // limit: 10,
    //,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  // console.log(result);
  let result1Month = { labels: [], datasets: { data: [] } };
  result1Month = getCustomActivity1Month(result, result1Month);
  // result7days.count = result7days.days.length;
  // console.log(result7days.days);
  // console.log(result7days);
  res.json({ result1Month });
});
// const getRoomActivities = catchAsync(async (req, res) => {
//   const filter = { userId: req.user._id, room: req.params.roomId };
//   const options = pick(req.query, ['sortBy', 'limit', 'page']);
//   const result = await activityService.queryActivitys(filter, options);
// res.send(result);
// });
const getActivitiesByToday = catchAsync(async (req, res) => {
  var today = new Date(2021, 2, 3);
  var lastDate = moment(today).subtract(24, 'hours');
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gte: new Date(lastDate), $lte: new Date(today) } });

  aggregate.unwind({ path: '$activity' });
  // aggregate.addFields({

  // con: {
  //   $cond: {
  //     if: { $eq: ['$activity.status', 'on'] },
  //     then: { add: { $add: ['$powerRating'] } },
  //   },
  // },
  // hourConsumptionStart: { $min: '$activity.overall' },
  // hourConsumptionEnd: { $max: '$activity.overall' },
  //   hourConsumptionStart: { $arrayElemAt: ['$activity.overall', 0] },
  //   hourConsumptionEnd: { $arrayElemAt: ['$activity.overall', 60] },
  // });
  // aggregate.project({ '$activity.overall': 1 });
  aggregate.group({
    _id: {
      month: { $month: '$activity.timestamp' },
      day: { $dayOfMonth: '$activity.timestamp' },
      year: { $year: '$activity.timestamp' },
      hour: { $hour: '$activity.timestamp' },
      deviceId: '$deviceId',
      // power: '$powerRating',
      //
      // customfield: {
      //   $switch: {
      //     branches: [
      //       { case: { $eq: ['$activity.status', 'on'] }, then: { add: { $sum: ['$powerRating'] } } },
      //       { case: { $eq: ['$activity.status', 'off'] }, then: { sub: { $add: [0] } } },
      //     ],
      //     // default: 0,
      //   },
      // },
    },
    con: { $sum: '$activity.overall' },
    // $cond: {
    //   if: { $eq: ['$activity.status', 'on'] },
    //   then: { $sum: ['$powerRating'] },
    //   else: 0,
    // },
    // },
    // ove: { $max: '$activity.overall' },

    // hourConsumptionStart: { $min: '$activity.overall' },
    // hourConsumptionEnd: { $max: '$activity.overall' },
  });

  // aggregate.group({
  //   $group: {
  //     _id: '$_id.hour',
  //     books: {
  //       $push: {
  //         book: '$_id.book',
  //         count: '$bookCount',
  //       },
  //     },
  //     count: { $sum: '$bookCount' },
  //   },
  // });

  //   total: { $sum: '$overallConsumption' },
  // });
  aggregate.sort({ '_id.day': -1, '_id.hour': 1 });
  const options = {
    page: 1,
    // pagination: false,
    limit: 10,
    //,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  res.send(result);
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
  getActivitiesByToday,
  getActivitiesBy7Days,
  getActivitiesBy1Month,
  //   getRoomActivitys,
  getActivity,
  updateActivity,
  deleteActivity,
};
