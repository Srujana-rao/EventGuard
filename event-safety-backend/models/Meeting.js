const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    targetRole: {
      type: String,
      enum: ['all', 'head', 'room', 'ground'],
      required: true,
    },
    meetingTime: {
      type: Date,
      required: true,
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Meeting', MeetingSchema);

