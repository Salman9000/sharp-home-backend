const express = require('express');
const auth = require('../../middlewares/auth');
const notificationController = require('../../controllers/notification.controller');

const router = express.Router();

router
  .route('/')
  //   .post(auth('createNotification'), notificationController.createNotification)
  .get(auth('getNotification'), notificationController.getNotifications)
  .delete()
  .patch();

router
  .route('/getunseen')
  //   .post(auth('createNotification'), notificationController.createNotification)
  .get(auth('getNotification'), notificationController.getUnseenNotifications)
  .delete()
  .patch();

router
  .route('/:notificationId')
  .get(auth('getNotification'), notificationController.getNotification)
  //   .patch(notificationController.updateNotification)
  .delete(notificationController.deleteNotification);

module.exports = router;
