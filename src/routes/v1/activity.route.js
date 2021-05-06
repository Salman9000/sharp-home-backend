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

router.route('/1Month').get(auth('getActivity'), activityController.getActivitiesBy1Month);

router.route('/7Days').get(auth('getActivity'), activityController.getActivitiesBy7Days);

router.route('/:day').get(auth('getActivity'), activityController.getActivitiesByOneDay);

// router.route('/Yesterday').get(auth('getActivity'), activityController.getActivitiesByOneDay);
// router
//   .route('/:activityId')
//   .get(auth('getActivity'), activityController.getActivity)

// router
//   .route('getActivity/:activityId')
//   .get(activityController.getActivity)
//   .patch(activityController.updateActivity)
//   .delete(activityController.deleteActivity);

module.exports = router;
