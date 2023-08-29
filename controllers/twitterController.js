const axios = require('axios'); 
const express = require('express');
const app = express.Router();
const Twit = require('twit');

const T = new Twit({
  consumer_key: 'Bws6w7hP8agS4Ea7SKb0fuNkO',
  consumer_secret: 'TMYBhMkXMk7MpR9pXJlMqUSvUF5acEdSSk78wWjE4GFobuXmeC',
  app_only_auth: true // Use app-only authentication
});

app.get('/request-token', async (req, res) => {
  T.post('oauth/request_token', {}, (err, data, response) => {
    if (err) {
      console.error('Error requesting token:', err);
      return res.status(500).json({ message: 'Error requesting token', error: err });
    }
    return res.json(data);
  });
});

app.get('/callback', (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;

  if (!oauth_token || !oauth_verifier) {
    return res.status(400).json({ message: 'Invalid callback parameters' });
  }

  T.post('oauth/access_token', {
    oauth_verifier: oauth_verifier,
    oauth_token: oauth_token
  }, (err, data, response) => {
    if (err) {
      console.error('Error getting access token:', err);
      return res.status(500).json({ message: 'Error getting access token', error: err });
    }

    // Successfully obtained access token
    return res.json(data);
  });
});
module.exports = app;
