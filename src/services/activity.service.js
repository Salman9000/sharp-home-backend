const httpStatus = require('http-status');
const { Activity } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a activity
 * @param {Object} activityBody
 * @returns {Promise<Activity>}
 */
const createActivity = async (activityBody, userId) => {
  const activity = await Activity.create({ ...activityBody, userId });
  return activity;
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
const queryActivities = async (filter, options) => {
  const activities = await Activity.paginate(filter, options);
  return activities;
};

const queryAggregateActivities = async (aggregate, options) => {
  const activities = await Activity.aggregatePaginate(aggregate, options);
  return activities;
};

/**
 * Get activity by id
 * @param {ObjectId} id
 * @returns {Promise<Activity>}
 */
const getActivityById = async (id) => {
  return Activity.findById(id);
};

const getActivityByDeviceId = async (filter) => {
  return Activity.find(filter);
};
/**
 * Update activity by id
 * @param {ObjectId} ActivityId
 * @param {Object} updateBody
 * @returns {Promise<Activity>}
 */
const updateActivityById = async (ActivityId, updateBody) => {
  const activity = await getActivityById(ActivityId);
  if (!activty) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Activty not found');
  }
  Object.assign(activty, updateBody);
  await activity.save();
  return activity;
};

/**
 * Delete activity by id
 * @param {ObjectId} ActivityId
 * @returns {Promise<Activity>}
 */
const deleteActivityById = async (ActivityId) => {
  const activity = await getActivityByDeviceId(ActivityId);
  if (!activity) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Activity not found');
  }
  await activity.remove();
  return activity;
};
const deleteActivityByDeviceId = async (filter, options) => {
  const activity = await getActivityByDeviceId(filter, options);
  if (!activity) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Activity not found');
  }
  console.log(activity.length);
  // await activity.remove();
  // return activity;
};

module.exports = {
  createActivity,
  queryActivities,
  queryAggregateActivities,
  getActivityById,
  updateActivityById,
  deleteActivityById,
  deleteActivityByDeviceId,
};
