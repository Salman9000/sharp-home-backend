const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { activityService } = require('../services');
var moment = require('moment');
const { ConsoleTransportOptions } = require('winston/lib/winston/transports');
const { Activity } = require('../models');
const { response } = require('express');

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

const getActivitiesByToday = catchAsync(async (req, res) => {
  var inputDate = Date();
  var today = moment().startOf('day');
  console.log(today);
  const filter = { userId: req.user._id, startDate: { $gte: new Date(2021, 2, 3), $lt: new Date(2021, 2, 4) } };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await activityService.queryActivities(filter, options);
  res.send(result);
});
const getCustomActivity = (resultArray, inputArray) => {
  inputArray.days = resultArray.docs.map((value) => ({
    day: moment(value.startDate).format('dddd'),
    overallConsumption: value.overallConsumption.toFixed(2),
    deviceId: value.deviceId,
  }));
  inputArray.overallConsumption = resultArray.docs
    .map((value) => value.overallConsumption)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  return inputArray;
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
  res.send(result);
  // let result7days = { days: [], overallConsumption: 0 };
  // result7days = getCustomActivity(result, result7days);
  // result7days.count = result7days.days.length;
  // console.log(result7days.days);
  // res.json({ result7days });
});
// const getRoomActivities = catchAsync(async (req, res) => {
//   const filter = { userId: req.user._id, room: req.params.roomId };
//   const options = pick(req.query, ['sortBy', 'limit', 'page']);
//   const result = await activityService.queryActivitys(filter, options);
// res.send(result);
// });
const getActivitiesByToday = catchAsync(async (req, res) => {
  var today = new Date(2021, 2, 3);
  var lastDate = moment(today).add(24, 'hours');
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
  //   getRoomActivitys,
  getActivity,
  updateActivity,
  deleteActivity,
};
