const mongoose = require('mongoose');
const { toJSON, paginate, aggregatePaginate } = require('./plugins');

const deviceSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    powerRating: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['on', 'off'],
      required: true,
      default: 'on',
    },
    exists: {
      type: Boolean,
      required: false,
      default: true,
    },
    room: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'room',
      required: false,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
deviceSchema.plugin(toJSON);
deviceSchema.plugin(paginate);
deviceSchema.plugin(aggregatePaginate);
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
 * @typedef Device
 */
const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
