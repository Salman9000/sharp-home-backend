const express = require('express');
const auth = require('../../middlewares/auth');
// const validate = require('../../middlewares/validate');
// const userValidation = require('../../validations/user.validation');
const activityController = require('../../controllers/activity.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('createActivity'), activityController.createActivity)
  .get(auth('getActivity'), activityController.getActivities)
  .delete()
  .patch();

router 
  .route('/graph')
  .get(auth('getActivity'),activityController.getActivitiesBySevenDays)
// router
//   .route('/:activityId')
//   .get(auth('getActivity'), activityController.getActivity)
  
// router
//   .route('getActivity/:activityId')
//   .get(activityController.getActivity)
//   .patch(activityController.updateActivity)
//   .delete(activityController.deleteActivity);

module.exports = router;
