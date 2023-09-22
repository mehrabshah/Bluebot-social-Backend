const mongoose = require('mongoose');

const tiktokSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authCode: { type: String, required: true },
  tiktokId: { type: String, required: true },
  profilePicture: { type: String, required: true },
  tiktokEmail: { type: String, required: true },
  tiktokUserName: { type: String, required: true },
  token: { type: String, required: true },
});

const TiktokToken = mongoose.model('TiktokToken', tiktokSchema);

module.exports = TiktokToken;
