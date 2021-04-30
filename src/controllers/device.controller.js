const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { deviceService } = require('../services');

const createDevice = catchAsync(async (req, res) => {
  const device = await deviceService.createDevice(req.body, req.user._id);
  res.status(httpStatus.CREATED).send(device);
});

const getDevices = catchAsync(async (req, res) => {
  // console.log(req.user);
  const filter = { userId: req.user._id };
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
  getDevice,
  updateDevice,
  deleteDevice,
};
