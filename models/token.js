const mongoose = require('mongoose');

const TokensSchema = new mongoose.Schema({
  token: { type: String, required: false },
  type: { type: String, required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Token = mongoose.model('Token', TokensSchema);
module.exports = Token;
