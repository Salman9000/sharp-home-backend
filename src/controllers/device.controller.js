const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { deviceService } = require('../services');
const { Activity } = require('../models');
const { Device } = require('../models');
const { activityService } = require('../services');
var moment = require('moment');
const { count } = require('../models/token.model');
// const { deviceService } = require('../services');
const createDevice = catchAsync(async (req, res) => {
  const device = await deviceService.createDevice(req.body, req.user._id);
  res.status(httpStatus.CREATED).send(device);
});

const getTotalConsumptionAllDevices = catchAsync(async (req, res) => {
  const aggregate = Activity.aggregate([
    { $match: { userId: req.user._id } },
    { $group: { _id: '$deviceId', total: { $sum: '$overallConsumption' } } },
    { $lookup: { from: 'devices', localField: '_id', foreignField: '_id', as: 'dev' } },
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
  //{ labels: [], datasets:  [{ data: [] }, { data: [] }] }
  labels = [];
  datas = [];
  deviceArray = [];
  deviceName = [];
  resultArray.docs.map((value) => {
    labels.push('Week ' + value._id.week); //add week to label array
    deviceArray.push(`${value._id.deviceId}`); //add device to device array
    deviceName.push(`${value.devices[0].name}`); //add device to device array
    datas.push(`${(value.total / 1000).toFixed(2)} ${value._id.deviceId}`); //add total and device id to datas array
  });

  data = [];
  const uniqueSet = new Set(labels); //set unique lables
  labels = [...uniqueSet];
  const uniqueDevice = new Set(deviceArray); //set unqiue devices
  deviceArray = [...uniqueDevice];
  const uniqueDeviceName = new Set(deviceName); //set unqiue devices
  deviceName = [...uniqueDeviceName];
  data2 = new Array(deviceArray.length).fill(new Array(0)); //create 2d array having length of number devices

  datas.map((value) => {
    var index = deviceArray.indexOf(value.split(' ')[1]); //get the index of device in the device array
    data2[index] = [...data2[index], value.split(' ')[0]]; //insert data into data2 array
  });

  overallConsumption =
    resultArray.docs
      .map((value) => value.total)
      .reduce((acc, current) => acc + current)
      .toFixed(2) / 1000;

  data2.map((value) => {
    inputArray.datasets.push({ data: value }); //push the data eg. datasets:  [{ data: [] },]
  });
  inputArray.datasets.shift(); //remove the first empty element
  inputArray.labels = labels; //rename label
  return { inputArray, overallConsumption, deviceArray, deviceName };
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
  aggregate.lookup({
    from: 'devices',
    localField: '_id.deviceId',
    foreignField: '_id',
    as: 'devices',
  });
  aggregate.sort({ '_id.deviceId': 1, '_id.week': 1, '_id.year': 1 });
  //aggregate.unwind({ path: '$_id' });
  // aggregate.populate({});

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result1Month = { labels: [], datasets: [{ data: [] }] };
  result1Month = getCustomActivity1Month(result, result1Month);
  res.json({ result1Month });
});

const getCustomActivity7Days = (resultArray, inputArray) => {
  //{ labels: [], datasets:  [{ data: [] }, { data: [] }] }
  labels = [];
  datas = [];
  deviceArray = [];
  deviceName = [];
  colorArray = [
    (opacity = 1) => `rgba(255,0,0,${opacity})`,
    (opacity = 1) => `rgba(0,0,102, ${opacity})`,
    (opacity = 1) => `rgba(0,102,0, ${opacity})`,
  ];
  console.log(colorArray[0]);
  resultArray.docs.map((value) => {
    date = new Date(value._id.year, value._id.month - 1, value._id.day);
    labels.push(`${moment(date).format('dd')}/${moment(date).format('D')}`); //add week to label array
    deviceArray.push(`${value._id.deviceId}`); //add device to device array
    deviceName.push(`${value.devices[0].name}`); //add device to device array
    datas.push(`${(value.total / 1000).toFixed(2)} ${value._id.deviceId}`); //add total and device id to datas array
  });

  data = [];
  const uniqueSet = new Set(labels); //set unique lables
  labels = [...uniqueSet];
  const uniqueDevice = new Set(deviceArray); //set unqiue devices
  deviceArray = [...uniqueDevice];
  const uniqueDeviceName = new Set(deviceName);
  deviceName = [...uniqueDeviceName];
  console.log(deviceName);
  data2 = new Array(deviceArray.length).fill(new Array(0)); //create 2d array having length of number devices

  datas.map((value) => {
    var index = deviceArray.indexOf(value.split(' ')[1]); //get the index of device in the device array
    data2[index] = [...data2[index], value.split(' ')[0]]; //insert data into data2 array
  });

  overallConsumption =
    resultArray.docs
      .map((value) => value.total)
      .reduce((acc, current) => acc + current)
      .toFixed(2) / 1000;
  count1 = 0;
  inputArray.labels = labels;
  colorfunc = {
    col: function color() {
      (opacity = 1) => `rgba(134, 65, 244, ${opacity})`;
    },
  };
  data2.map((value) => {
    inputArray.datasets.push({
      data: value,
      color: colorfunc.col,
      strokeWidth: 2,
    });
    //push the data eg. datasets:  [{ data: [] },]
    count1 = count1 + 1;
  });
  // console.log(inputArray.datasets, 1);
  inputArray.datasets.shift(); //remove the first empty element
  // for (var i in inputArray.datasets) {
  //   // inputArray.datasets[i].color = (opacity = 1) => `rgba(0,255,0,${opacity})`;
  // }
  //rename label
  // inputArray.datasets.color = (opacity = 1) => `rgba(255,0,0,${opacity})`;
  console.log(inputArray);
  return { inputArray, overallConsumption, deviceArray, deviceName };
};

const getDeviceConsumptionBy7Days = catchAsync(async (req, res) => {
  var today = new Date(2021, 2 - 1, 10);
  var lastDate = moment(today).subtract(7, 'days');
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gt: new Date(lastDate), $lt: new Date(today) } });
  aggregate.group({
    _id: {
      month: { $month: '$startDate' },
      day: { $dayOfMonth: '$startDate' },
      year: { $year: '$startDate' },
      deviceId: '$deviceId',
    },

    total: { $sum: '$overallConsumption' },
  });
  aggregate.lookup({
    from: 'devices',
    localField: '_id.deviceId',
    foreignField: '_id',
    as: 'devices',
  });
  // aggregate.lookup();
  // console.log(aggregate._pipeline.lookup);
  aggregate.sort({ '_id.deviceId': 1, '_id.month': 1, '_id.day': 1 });
  //aggregate.unwind({ path: '$_id' });
  // aggregate.populate({});

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result7Days = { labels: [], datasets: [{ data: [], stokeWidth: 2, color: '' }] };
  result7Days = getCustomActivity7Days(result, result7Days);
  console.log(result7Days.inputArray.datasets);
  res.json({ result7Days });
});

const getCustomActivityOneDay = (resultArray, inputArray) => {
  //{ labels: [], datasets:  [{ data: [] }, { data: [] }] }
  labels = [];
  datas = [];
  deviceArray = [];
  deviceName = [];
  resultArray.docs.map((value) => {
    // date = new Date(value._id.year, value._id.month - 1, value._id.day);
    labels.push(value._id.hour + ':00');
    deviceArray.push(`${value._id.deviceId}`);
    deviceName.push(`${value.devices[0].name}`); //add device to device array
    datas.push(`${(value.total / 1000).toFixed(2)} ${value._id.deviceId}`); //add total and device id to datas array
  });

  data = [];
  const uniqueSet = new Set(labels); //set unique lables
  labels = [...uniqueSet];
  const uniqueDevice = new Set(deviceArray); //set unqiue devices
  deviceArray = [...uniqueDevice];
  const uniqueDeviceName = new Set(deviceName); //set unqiue devices
  deviceName = [...uniqueDeviceName];
  data2 = new Array(deviceArray.length).fill(new Array(0)); //create 2d array having length of number devices

  datas.map((value) => {
    var index = deviceArray.indexOf(value.split(' ')[1]); //get the index of device in the device array
    data2[index] = [...data2[index], value.split(' ')[0]]; //insert data into data2 array
  });

  overallConsumption =
    resultArray.docs
      .map((value) => value.total)
      .reduce((acc, current) => acc + current)
      .toFixed(2) / 1000;

  data2.map((value) => {
    inputArray.datasets.push({ data: value, color: (opacity = 1) => `rgba(255,0,0,${opacity})` }); //push the data eg. datasets:  [{ data: [] },]
  });
  inputArray.datasets.shift(); //remove the first empty element
  inputArray.labels = labels; //rename label
  return { inputArray, overallConsumption, deviceArray, deviceName };
};

const getDeviceConsumptionByOneDay = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let lastDate;
  if (req.params.day == 'Today') {
    lastDate = moment(today).add(24, 'hours');
  } else if (req.params.day == 'Yesterday') {
    lastDate = today;
    today = moment(today).subtract(24, 'hours');
  }
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gte: new Date(today), $lt: new Date(lastDate) } });
  aggregate.unwind({ path: '$activity' });
  aggregate.group({
    _id: {
      month: { $month: '$activity.timestamp' },
      day: { $dayOfMonth: '$activity.timestamp' },
      year: { $year: '$activity.timestamp' },
      hour: { $hour: '$activity.timestamp' },
      deviceId: '$deviceId',
    },
    min: { $min: '$activity.overall' },
    max: { $max: '$activity.overall' },
  });

  aggregate.project({
    total: { $subtract: ['$max', '$min'] },
  });
  aggregate.lookup({
    from: 'devices',
    localField: '_id.deviceId',
    foreignField: '_id',
    as: 'devices',
  });

  // aggregate.group({
  //   _id: null,

  // });
  aggregate.sort({ '_id.deviceId': 1, '_id.day': -1, '_id.hour': 1 });
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let resultOneDay = { labels: [], datasets: [{ data: [] }] };
  resultOneDay = getCustomActivityOneDay(result, resultOneDay);
  res.json({ resultOneDay });
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
  getTotalConsumptionAllDevices,
  getDeviceConsumptionBy7Days,
  getDeviceConsumptionByOneDay,
};
