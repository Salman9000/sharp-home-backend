const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const activitySchema = mongoose.Schema(
  {
    activity: [
      {
        status: { type: String, required: true },
        cumulative: { type: Number, required: true },
        overall: { type: Number, required: true },
        timestamp: { type: Date, required: true },
      },
    ],
    overallConsumption: {
      type: Number,
      required: true,
    },
    powerRating: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    numberOfEntries: {
      type: Number,
      required: true,
    },
    deviceId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Device',
      required: true,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
activitySchema.plugin(toJSON);
activitySchema.plugin(paginate);

/*
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
// deviceSchema.statics.isEmailTaken = async function (email, excludeUserId) {
//   const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
//   return !!user;
// };

/**
 * @typedef Activity
 */
const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
