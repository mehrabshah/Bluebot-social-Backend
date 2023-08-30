const axios = require('axios'); 
const express = require('express');
const app = express.Router();
const Twit = require('twit');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const Twitter = require('../models/twitter'); 
const T = new Twit({
  consumer_key: 'Bws6w7hP8agS4Ea7SKb0fuNkO',
  consumer_secret: 'TMYBhMkXMk7MpR9pXJlMqUSvUF5acEdSSk78wWjE4GFobuXmeC',
  app_only_auth: true // Use app-only authentication
});

// Replace with your Twitter App API key and API secret key
const API_KEY = 'Bws6w7hP8agS4Ea7SKb0fuNkO';
const API_SECRET_KEY = 'TMYBhMkXMk7MpR9pXJlMqUSvUF5acEdSSk78wWjE4GFobuXmeC';


// Replace with your callback URL
const CALLBACK_URL = 'http://localhost:8000/auth/twitter/twitter/callback';

const oauth = OAuth({
  consumer: {
    key: API_KEY,
    secret: API_SECRET_KEY,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
const accessTokenUrl = 'https://api.twitter.com/oauth/access_token';

app.get('/twitter/login', (req, res) => {
  const requestData = {
    url: requestTokenUrl,
    method: 'POST',
    data: { oauth_callback: CALLBACK_URL },
  };

  axios.post(requestTokenUrl, null, {
    headers: oauth.toHeader(oauth.authorize(requestData)),
  })
    .then(response => {
      const requestToken = new URLSearchParams(response.data);
      const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${requestToken.get('oauth_token')}`;
      res.redirect(authUrl);
    })
    .catch(error => {
      console.error('Error fetching request token:', error);
      res.status(500).json({ error: 'Error fetching request token' });
    });
});

app.get('/twitter/callback', async (req, res) => {
  const requestData = {
    url: accessTokenUrl,
    method: 'POST',
    data: { oauth_verifier: req.query.oauth_verifier },
  };

  axios.post(accessTokenUrl, null, {
    headers: oauth.toHeader(oauth.authorize(requestData)),
  })
    .then(response => {
      const accessToken = new URLSearchParams(response.data);
      res.json({ access_token: accessToken.get('oauth_token'), secret: accessToken.get('oauth_token_secret') });
    })
    .catch(error => {
      console.error('Error fetching access token:', error);
      res.status(500).json({ error: 'Error fetching access token' });
    });
});

app.post('/request-token', async (req, res) => {
  try {
    const { userId : userId, consumerKey : consumerKey, consumerSecret :consumerSecret } = req.body;

    // Create a new Twitter record in the database
    const credentials = `${consumerKey}:${consumerSecret}`;
    const credentialsBase64 = Buffer.from(credentials).toString('base64');
    
    const response = await axios.post('https://api.twitter.com/oauth2/token', 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${credentialsBase64}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    });
    console.log(response.data);
    let twitterRecord = await Twitter.findOne({ user: userId });
    if (!twitterRecord) {
        twitterRecord = new Twitter({
        user: userId,
        accessToken : response.data.access_token,
        consumerKey : consumerKey,
        consumerSecret : consumerSecret
      });
    }
      else {
        // If a record exists, update the authentication details
        twitterRecord.accessToken = response.data.access_token;
      }
  
      const savedRecord = await twitterRecord.save();
      console.log(savedRecord);

    res.json(response.data);

  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.get('/getAccessToken/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const twitterData = await Twitter.findOne({ user: userId });
    if (twitterData) {
      const accessToken = twitterData.accessToken;
     console.log(twitterData);
      res.json({ twitterData });
  
    } else {
      res.status(404).json({ message: 'No Twitter data found for this user.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

app.post('/create-tweet', async (req, res) => {
  try {
    const tweetText = req.body.text;
    const tokenTwitter = req.body.tokenTwitter;
    
    const response = await axios.post('https://api.twitter.com/2/tweets', {
      text: tweetText,
    }, {
      headers: {
        Authorization: `Bearer AAAAAAAAAAAAAAAAAAAAALuFpgEAAAAAHlcZWXx3kIr%2Bh61HPJ%2FKYDB9olw%3DIIpaiKevda20j6bX7o8IcCnbYOzNA0GsdonEegsjDIRcRLo8V3`,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});


module.exports = app;
