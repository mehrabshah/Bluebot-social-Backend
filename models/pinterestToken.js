const mongoose = require('mongoose');

const pinterestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authCode: { type: String, required: true },
  pinterestId: { type: String, required: true },
  profilePicture: { type: String, required: true },
  pinterestEmail: { type: String, required: true },
  pinterestUserName: { type: String, required: true },
  token: { type: String, required: true },
});

const PinterestToken = mongoose.model('PinterestToken', pinterestSchema);

module.exports = PinterestToken;
