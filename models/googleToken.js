const mongoose = require('mongoose');

const googleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authCode: { type: String, required: true },
  googleId: { type: String, required: true },
  profilePicture: { type: String, required: true },
  googleEmail: { type: String, required: true },
  googleUserName: { type: String, required: true },
  token: { type: String, required: false },
});

const GoogleToken = mongoose.model('GoogleToken', googleSchema);

module.exports = GoogleToken;
