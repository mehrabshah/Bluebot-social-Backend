const mongoose = require('mongoose');

const twitterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  consumerKey: {
    type: String,
    required: true
  },
  consumerSecret: {
    type: String,
    required: true
  }
});

const Twitter = mongoose.model('Twitter', twitterSchema);

module.exports = Twitter;
