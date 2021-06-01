const httpStatus = require('http-status');
const { Device } = require('../models');
const ApiError = require('../utils/ApiError');
const { Room } = require('../models');
const Roomservice = require('./room.service');
/**
 * Create a device
 * @param {Object} deviceBody
 * @returns {Promise<Device>}
 */
const createDevice = async (deviceBody, userId) => {
  const device = await Device.create({ ...deviceBody, userId });
  let deviceId = device.id;
  let roomId = device.room;
  const room = await Roomservice.getRoomById(roomId);
  room.devices.push(deviceId);
  room.deviceCount = room.devices.length;
  const roomupdate = await Roomservice.updateRoomById(roomId, room);
  return device;
};

/**
 * Query for devices
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryDevices = async (filter, options) => {
  const devices = await Device.paginate(filter, options);
  return devices;
};

/**
 * Get device by id
 * @param {ObjectId} id
 * @returns {Promise<Device>}
 */
const getDeviceById = async (id) => {
  return Device.findById(id);
};

/**
 * Update device by id
 * @param {ObjectId} deviceId
 * @param {Object} updateBody
 * @returns {Promise<Device>}
 */
const updateDeviceById = async (deviceId, updateBody) => {
  const device = await getDeviceById(deviceId);
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device not found');
  }
  Object.assign(device, updateBody);
  await device.save();
  return device;
};

/**
 * Delete device by id
 * @param {ObjectId} deviceId
 * @returns {Promise<Device>}
 */
const deleteDeviceById = async (deviceId) => {
  const device = await getDeviceById(deviceId);
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device not found');
  } else {
    let deviceId = device.id;
    console.log(deviceId);
    let roomId = device.room;
    let tempArray = [];
    const room = await Roomservice.getRoomById(roomId);
    console.log(room);
    tempArray = room.devices;
    tempArray = tempArray.filter((value) => value != deviceId);
    room.devices = tempArray;
    room.deviceCount = room.devices.length;
    const roomupdate = await Roomservice.updateRoomById(roomId, room);
    console.log(roomupdate);
  }
  await device.remove();

  return device;
};

const deleteDeviceUsingRoomId = async (roomId) => {
  console.log('hhh');
  // const devices = await Device.find({ room: roomId });
  // console.log(devices);
};

module.exports = {
  createDevice,
  queryDevices,
  getDeviceById,
  updateDeviceById,
  deleteDeviceById,
  deleteDeviceUsingRoomId,
};
