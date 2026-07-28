const mongoose = require('mongoose');

const WorkingDaySchema = new mongoose.Schema({
  realDate: { type: String, required: true, unique: true },
  workingDate: { type: String, required: true },
  eventName: { type: String, default: '' },
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });


module.exports = mongoose.models.WorkingDay || mongoose.model('WorkingDay', WorkingDaySchema);