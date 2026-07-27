const mongoose = require('mongoose');

const SafetyIncidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  location: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'Critical'], default: 'Low' },
  status: { type: String, enum: ['Open', 'Assigned', 'In Progress', 'Resolved'], default: 'Open' },
  reportedBy: { type: String, default: 'Unknown' },
  reportedByRole: { type: String, default: '' },
  assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  sourceAlertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', default: null },
  incidentDate: { type: String, required: true, index: true }, // 'YYYY-MM-DD' — the working date this incident belongs to
  eventName: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('SafetyIncident', SafetyIncidentSchema);