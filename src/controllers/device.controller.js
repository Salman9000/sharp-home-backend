const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { deviceService } = require('../services');
const { Activity } = require('../models');
const { Device } = require('../models');
const { activityService } = require('../services');
var moment = require('moment');
// const { deviceService } = require('../services');
const createDevice = catchAsync(async (req, res) => {
  const device = await deviceService.createDevice(req.body, req.user._id);
  res.status(httpStatus.CREATED).send(device);
});

const getTotalConsumptionAllDevices = catchAsync(async (req, res) => {
  const aggregate = Activity.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: `$deviceId`,
        total: { $sum: `$overallConsumption` },
      },
    },
  ]);

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  res.json({ result });
});

const getTotalConsumptionByDevice = catchAsync(async (req, res) => {
  const aggregate = Activity.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: req.params.deviceId,
        total: { $sum: `$overallConsumption` },
      },
    },
  ]);
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  res.json({ result });
});

const getCustomActivity1Month = (resultArray, inputArray) => {
  //{ labels: [], datasets: { data: [] } }
  console.log(resultArray);
  labels = [];
  datas = [];
  deviceArray = [];

  count = 0;

  resultArray.docs.map((value) => {
    labels.push('Week ' + value._id.week);
    deviceArray.push(`${value._id.deviceId}`);
    datas.push(`${(value.total / 1000).toFixed(2)} ${value._id.deviceId}`);
  });
  data2 = new Array(2).fill(new Array(1).fill(0));
  // console.log(data2);
  data = [];
  const uniqueSet = new Set(labels);
  labels = [...uniqueSet];
  const uniqueDevice = new Set(deviceArray);
  deviceArray = [...uniqueDevice];
  inputArray.labels = labels;
  count = 0;
  datas.map((value) => {
    var index = deviceArray.indexOf(value.split(' ')[1]);
    //console.log(index);
    //console.log(value.split(' ')[1] + ' ' + value.split(' ')[0]);
    data2[index].push(value.split(' ')[0]);
    //console.log(data2);
  });

  // resultArray.docs.map((value) => {
  //   labels.push('Week ' + value._id.week);
  //   //datas.push((value.total / 1000).toFixed(2));
  // });
  console.log(data2);
  // inputArray.datasets.data = datas;
  overallConsumption = resultArray.docs
    .map((value) => value.total)
    .reduce((acc, current) => acc + current)
    .toFixed(2);
  return { inputArray, overallConsumption };
};
const getDeviceConsumptionBy1Month = catchAsync(async (req, res) => {
  var today = new Date(2021, 2 - 1, 10);
  var lastDate = moment(today).subtract(1, 'month');
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gt: new Date(lastDate), $lt: new Date(today) } });
  aggregate.group({
    _id: {
      week: { $week: '$startDate' },
      year: { $year: '$startDate' },
      deviceId: '$deviceId',
    },
    total: { $sum: '$overallConsumption' },
  });
  aggregate.sort({ '_id.deviceId': 1, '_id.week': 1, '_id.year': 1 });
  //aggregate.unwind({ path: '$_id' });
  // aggregate.populate({});

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result1Month = { labels: [], datasets: { data: [] } };
  result1Month = getCustomActivity1Month(result, result1Month);
  res.json({ result });
});
const getDevices = catchAsync(async (req, res) => {
  // console.log(req.user);
  const filter = { userId: req.user._id };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await deviceService.queryDevices(filter, options);
  res.send(result);
});
const getRoomDevices = catchAsync(async (req, res) => {
  const filter = { userId: req.user._id, room: req.params.roomId };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await deviceService.queryDevices(filter, options);
  res.send(result);
});

const getDevice = catchAsync(async (req, res) => {
  const device = await deviceService.getDeviceById(req.params.deviceId);
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device not found');
  }
  res.send(device);
});

const updateDevice = catchAsync(async (req, res) => {
  const device = await deviceService.updateDeviceById(req.params.deviceId, req.body);
  res.send(device);
});

const deleteDevice = catchAsync(async (req, res) => {
  await deviceService.deleteDeviceById(req.params.deviceId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createDevice,
  getDevices,
  getRoomDevices,
  getDevice,
  updateDevice,
  deleteDevice,
  getTotalConsumptionByDevice,
  getDeviceConsumptionBy1Month,
};
