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

router.route('/customActivity').get(auth('getActivity'), activityController.getCustomActivity);

router.route('/1month').get(auth('getActivity'), activityController.getActivitiesBy1Month);

router.route('/7days').get(auth('getActivity'), activityController.getActivitiesBy7Days);

router.route('/barchart').get(auth('getActivity'), activityController.getActivityBarChart);

router.route('/:day').get(auth('getActivity'), activityController.getActivitiesByOneDay);

router
  .route('/:activityId')
  .get(activityController.getActivity)
  .patch(activityController.updateActivity)
  .delete(activityController.deleteActivity);

module.exports = router;
