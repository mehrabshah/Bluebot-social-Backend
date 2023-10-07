const mongoose = require('mongoose');

const twitterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authCode: { type: String, required: true },
  twitterId: { type: String, required: true },
  profilePicture: { type: String, required: true },
  twitterEmail: { type: String, required: true },
  twitterUserName: { type: String, required: true },
  authClient: { type: Object, required: true },
});

const TwitterToken = mongoose.model('TwitterToken', twitterSchema);

module.exports = TwitterToken;
