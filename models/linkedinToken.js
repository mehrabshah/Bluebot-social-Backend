const mongoose = require('mongoose');

const linkedinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authCode: { type: String, required: true },
  linkedinId: { type: String, required: true },
  profilePicture: { type: String, required: true },
  linkedinEmail: { type: String, required: true },
  linkedinUserName: { type: String, required: true },
  token: { type: String, required: true },
});

const LinkedinToken = mongoose.model('LinkedinToken', linkedinSchema);

module.exports = LinkedinToken;
