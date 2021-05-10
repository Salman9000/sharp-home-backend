const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { deviceService } = require('../services');
const { Activity } = require('../models');
const { Device } = require('../models');
const { activityService } = require('../services');
const { ObjectId } = require('mongodb');
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

const getCustomDeviceConsumption = catchAsync(async (req, res) => {
  today = moment(new Date(2021, 2, 3));
  let today2 = moment(today).format('D MMMM');
  lastDate = moment(new Date(2021, 2, 2));
  let lastDate2 = moment(lastDate).format('D MMMM');
  diff = today.diff(lastDate, 'days');
  let aggregate = Activity.aggregate();
  let deviceArray = Object.values(req.query);
  let functionSwitch = '';
  deviceArray = deviceArray.map((value) => {
    return ObjectId(value);
  });
  console.log(deviceArray);
  if (deviceArray.length < 1) {
    aggregate.match({
      userId: req.user._id,
      startDate: { $gt: new Date(lastDate), $lt: new Date(today) },
    });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gt: new Date(lastDate), $lt: new Date(today) },
    });
  }
  if (diff >= 14) {
    aggregate.group({
      _id: {
        week: { $week: '$startDate' },
        year: { $year: '$startDate' },
        deviceId: '$deviceId',
        powerRating: '$powerRating',
      },
      total: { $sum: '$overallConsumption' },
    });
    aggregate.lookup({
      from: 'devices',
      localField: '_id.deviceId',
      foreignField: '_id',
      as: 'devices',
    });
    aggregate.sort({ '_id.powerRating': -1, '_id.deviceId': -1, '_id.week': 1, '_id.year': 1 });
    functionSwitch = 'Month';
  } else if (diff > 1 && diff < 14) {
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
    aggregate.sort({ '_id.deviceId': 1, '_id.month': 1, '_id.day': 1 });
    functionSwitch = 'Day';
  } else {
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

    aggregate.sort({ '_id.deviceId': 1, '_id.day': -1, '_id.hour': 1 });
    functionSwitch = 'Hour';
  }

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let customResult = { labels: [], datasets: [{ data: [] }] };
  switch (functionSwitch) {
    case 'Month':
      resultConsumption = getCustomActivity1Month(result, customResult);
      res.json({ resultConsumption, startDate: today2, endDate: lastDate2 });
    case 'Day':
      resultConsumption = getCustomActivity7Days(result, customResult);
      res.json({ resultConsumption, startDate: today2, endDate: lastDate2 });
    case 'Hour':
      resultConsumption = getCustomActivityOneDay(result, customResult);
      res.json({ resultConsumption, startDate: today2 });
  }
  // res.json({ result });
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
    inputArray.datasets.push({ data: value, color: '', strokeWidth: 2 }); //push the data eg. datasets:  [{ data: [] },]
  });
  inputArray.datasets.shift(); //remove the first empty element
  inputArray.labels = labels; //rename label
  return { inputArray, overallConsumption, deviceArray, deviceName };
};
const getDeviceConsumptionBy1Month = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let today2 = moment(today).format('D MMMM');
  let lastDate = moment(today).subtract(1, 'month');
  let lastDate2 = moment(lastDate).format('D MMMM');
  let aggregate = Activity.aggregate();
  let deviceArray = Object.values(req.query);
  deviceArray = deviceArray.map((value) => {
    return ObjectId(value);
  });
  if (deviceArray.length < 1) {
    aggregate.match({
      userId: req.user._id,
      startDate: { $gt: new Date(lastDate), $lt: new Date(today) },
    });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gt: new Date(lastDate), $lt: new Date(today) },
    });
  }

  aggregate.group({
    _id: {
      week: { $week: '$startDate' },
      year: { $year: '$startDate' },
      deviceId: '$deviceId',
      powerRating: '$powerRating',
    },
    total: { $sum: '$overallConsumption' },
  });
  aggregate.lookup({
    from: 'devices',
    localField: '_id.deviceId',
    foreignField: '_id',
    as: 'devices',
  });
  aggregate.sort({ '_id.powerRating': -1, '_id.deviceId': -1, '_id.week': 1, '_id.year': 1 });

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result1Month = { labels: [], datasets: [{ data: [] }] };
  resultConsumption = getCustomActivity1Month(result, result1Month);
  res.json({ resultConsumption, startDate: today2, endDate: lastDate2 });
});

const getCustomActivity7Days = (resultArray, inputArray) => {
  //{ labels: [], datasets:  [{ data: [] }, { data: [] }] }
  labels = [];
  datas = [];
  deviceArray = [];
  deviceName = [];
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
  inputArray.labels = labels;
  data2.map((value) => {
    inputArray.datasets.push({ data: value, color: '', strokeWidth: 2 }); //push the data eg. datasets:  [{ data: [] },]
  });
  inputArray.datasets.shift(); //remove the first empty element
  //rename label
  return { inputArray, overallConsumption, deviceArray, deviceName };
};

const getDeviceConsumptionBy7Days = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let today2 = moment(today).format('D MMMM');
  let lastDate = moment(today).subtract(7, 'days');
  let lastDate2 = moment(lastDate).format('D MMMM');
  let aggregate = Activity.aggregate();
  let deviceArray = Object.values(req.query);
  deviceArray = deviceArray.map((value) => {
    return ObjectId(value);
  });
  if (deviceArray.length < 1) {
    aggregate.match({
      userId: req.user._id,
      startDate: { $gt: new Date(lastDate), $lt: new Date(today) },
    });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gt: new Date(lastDate), $lt: new Date(today) },
    });
  }
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
  aggregate.sort({ '_id.deviceId': 1, '_id.month': 1, '_id.day': 1 });
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result7Days = { labels: [], datasets: [{ data: [], stokeWidth: 2, color: '' }] };
  resultConsumption = getCustomActivity7Days(result, result7Days);
  res.json({ resultConsumption, startDate: today2, endDate: lastDate2 });
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

  console.log(data2);
  overallConsumption =
    resultArray.docs
      .map((value) => value.total)
      .reduce((acc, current) => acc + current)
      .toFixed(2) / 1000;
  inputArray.labels = labels; //rename label
  data2.map((value) => {
    inputArray.datasets.push({ data: value, color: '', strokeWidth: 2 }); //push the data eg. datasets:  [{ data: [] },]
  });
  inputArray.datasets.shift(); //remove the first empty element
  console.log(inputArray);
  return { inputArray, overallConsumption, deviceArray, deviceName };
};

const getDeviceConsumptionByOneDay = catchAsync(async (req, res) => {
  let today = new Date(2021, 2, 3);
  let lastDate;
  if (req.params.day == 'today') {
    lastDate = moment(today).add(24, 'hours');
    today2 = moment(today).format('D MMMM');
  } else if (req.params.day == 'yesterday') {
    lastDate = today;
    today = moment(today).subtract(24, 'hours');
    today2 = moment(today).format('D MMMM');
  }
  let aggregate = Activity.aggregate();
  let deviceArray = Object.values(req.query);
  deviceArray = deviceArray.map((value) => {
    return ObjectId(value);
  });
  if (deviceArray.length < 1) {
    aggregate.match({
      userId: req.user._id,
      startDate: { $gt: new Date(today), $lt: new Date(lastDate) },
    });
  } else {
    aggregate.match({
      userId: req.user._id,
      deviceId: { $in: deviceArray },
      startDate: { $gt: new Date(today), $lt: new Date(lastDate) },
    });
  }
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

  aggregate.sort({ '_id.deviceId': 1, '_id.day': -1, '_id.hour': 1 });
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let resultOneDay = { labels: [], datasets: [{ data: [] }] };
  resultConsumption = getCustomActivityOneDay(result, resultOneDay);
  res.json({ resultConsumption, startDate: today2 });
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
  getCustomDeviceConsumption,
};
