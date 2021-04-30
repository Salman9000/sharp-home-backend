const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { roomService } = require('../services');

const createRoom = catchAsync(async (req, res) => {
  const room = await roomService.createRoom(req.body, req.user._id);
  res.status(httpStatus.CREATED).send(room);
});

const getRooms = catchAsync(async (req, res) => {
  // console.log(req.user);
  const filter = { userId: req.user._id };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await roomService.queryRooms(filter, {
    ...options,
    populate: { model: 'User', path: 'userId', select: 'name role' },
    select: 'description',
  });
  res.send(result);
});

const getRoom = catchAsync(async (req, res) => {
  const room = await roomService.getRoomById(req.params.roomId);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  res.send(room);
});

const updateRoom = catchAsync(async (req, res) => {
  const room = await roomService.updateRoomById(req.params.roomId, req.body);
  res.send(room);
});

const deleteRoom = catchAsync(async (req, res) => {
  await roomService.deleteRoomById(req.params.roomId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
};
