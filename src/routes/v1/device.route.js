const express = require('express');
const auth = require('../../middlewares/auth');
// const validate = require('../../middlewares/validate');
// const userValidation = require('../../validations/user.validation');
const deviceController = require('../../controllers/device.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('createDevice'), deviceController.createDevice)
  .get(auth('getDevice'), deviceController.getDevices)
  .delete()
  .patch();

router.route('/rooms/:roomId').get(auth('roomDevice'), deviceController.getRoomDevices);

router
  .route('getDevice/:deviceId')
  .get(deviceController.getDevice)
  .patch(deviceController.updateDevice)
  .delete(deviceController.deleteDevice);

router.route('/getConsumptionByDevice/:deviceId').get(deviceController.getTotalConsumptionByDevice);

module.exports = router;
