const mongoose = require('mongoose');

// Define the Facebook schema
const facebookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  fb_id: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true
  }
});

// Create the Facebook model
const Facebook = mongoose.model('Facebook', facebookSchema);

module.exports = Facebook;
