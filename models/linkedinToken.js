const mongoose = require('mongoose');

const linkedinSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accessToken: { type: String, required: true },
});

const LinkedinToken = mongoose.model('LinkedinToken', linkedinSchema);

module.exports = LinkedinToken;
