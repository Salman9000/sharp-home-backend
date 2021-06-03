const mongoose = require('mongoose');
const { toJSON, paginate, aggregatePaginate } = require('./plugins');

const notificationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    type: {
      type: String,
      required: false,
    },
    message: {
      type: String,
      required: false,
    },
    deviceName: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: false,
    },
    deviceId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Device',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);
notificationSchema.plugin(aggregatePaginate);
/*
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
// notificationSchema.statics.isEmailTaken = async function (email, excludeUserId) {
//   const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
//   return !!user;
// };

/**
 * @typedef Notification
 */
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
