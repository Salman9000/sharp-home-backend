const express = require('express');
const auth = require('../../middlewares/auth');
// const validate = require('../../middlewares/validate');
// const userValidation = require('../../validations/user.validation');
const roomController = require('../../controllers/room.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('createRoom'), roomController.createRoom)
  .get(auth('getRoom'), roomController.getRooms)
  .delete()
  .patch();

router.route('/:roomId').get(roomController.getRoom).patch(roomController.updateRoom).delete(roomController.deleteRoom);

module.exports = router;
