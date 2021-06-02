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

// router.route('/rooms/:roomId').get(auth('roomDevice'), deviceController.getRoomDevices);
router.route('/rooms').get(auth('getDevice'), deviceController.getRoomDevices);

router
  .route('/info/:deviceId')
  .get(deviceController.getDevice)
  .patch(deviceController.updateDevice)
  .delete(deviceController.deleteDevice);

router.route('/getSensorDevices/:deviceId').get(deviceController.getSensorDevices);

router.route('/total/:deviceId').get(auth('getDevice'), deviceController.getTotalConsumptionByDevice);

router.route('/1month').get(auth('getDevice'), deviceController.getDeviceConsumptionBy1Month);

router.route('/7days').get(auth('getDevice'), deviceController.getDeviceConsumptionBy7Days);

router.route('/oneday/:day').get(auth('getActivity'), deviceController.getDeviceConsumptionByOneDay);

router.route('/total').get(auth('getDevice'), deviceController.getTotalConsumptionAllDevices);

router.route('/customActivity').get(auth('getDevice'), deviceController.getCustomDeviceConsumption);

module.exports = router;
