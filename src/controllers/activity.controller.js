const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { activityService } = require('../services');
var moment = require('moment');
const { ConsoleTransportOptions } = require('winston/lib/winston/transports');

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
const getActivitiesBySevenDays = catchAsync(async (req, res) => {
  var today = new Date(2021, 2, 3);
  var today2 = moment(today).format('dddd');

  console.log(today2);
  var lastDate = moment(today).subtract(7, 'days');
  const filter = { userId: req.user._id, startDate: { $gte: lastDate, $lte: today } };
  let options = pick(req.query, ['sortBy', 'limit', 'page']);
  options = { ...options, select: 'overallConsumption startDate' };
  const result = await activityService.queryActivities(filter, options);
  const resultSevenDays = result.docs.map((value) => value.overallConsumption).reduce((acc, current) => acc + current);
  console.log(result.docs.map((value) => console.log(moment(value.startDate).format('dddd'))));
  res.json({ overallConsumption: resultSevenDays });
});
// const getRoomActivities = catchAsync(async (req, res) => {
//   const filter = { userId: req.user._id, room: req.params.roomId };
//   const options = pick(req.query, ['sortBy', 'limit', 'page']);
//   const result = await activityService.queryActivitys(filter, options);
//   res.send(result);
// });

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
  getActivitiesBySevenDays,
  //   getRoomActivitys,
  getActivity,
  updateActivity,
  deleteActivity,
};
