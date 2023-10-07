const axios = require('axios');
const jwtdecode = require('jwt-decode');
const User = require('../models/user'); // Adjust the path to your User model
const GoogleToken = require('../models/googleToken'); // Import your googleToken model
const jwt = require('jsonwebtoken');
const secret = process.env.JWTPRIVATEKEY; // Your JWT private key
const googleClientId = process.env.TWIITER_CLIENT_ID; // Your Google client ID
const fs = require('fs')
const Joi = require('joi');
const { post } = require('./googleController');

const { google, GoogleApis } = require('googleapis');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');

const oauth2Client = new google.auth.OAuth2(
  process.env.MYBUSINESS_CLIENT_ID,
  process.env.MYBUSINESS_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/blogger',
  'https://www.googleapis.com/auth/calendar'
];

const requestToken = async () => {

  const googleAccessToken = await authClient.requestAccessToken(code);
  console.log(googleAccessToken);
}

// requestToken();

const getMyBusinessAuthUrl = async (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',

    // If you only need one scope you can pass it as a string
    scope: scopes
  });

  if (authUrl) {
    res.json({
      authUrl: authUrl
    })
  }
};

const createUser = async (req, res) => {
  const authorizationCode = req.body.code;
  const userId = req.body.userId;

  let existingGoogleProfile = await GoogleToken.findOne({ userId })

  try {
    const { tokens } = await oauth2Client.getToken(authorizationCode)
    oauth2Client.setCredentials(tokens);

    let accessToken = '';
    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // store the refresh_token in my database!
        console.log(tokens.refresh_token);
      }
      accessToken = tokens.access_token;
      console.log(tokens.access_token);
    });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userProfile = await oauth2.userinfo.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses',
    });

    // const userProfile = await oauth2Client.currentUser.get().getBasicProfile().getName()
    // if (oauth2Client.isSignedIn.get()) {
    //   var profile = oauth2Client.currentUser.get().getBasicProfile();
    //   console.log('ID: ' + profile.getId());
    //   console.log('Full Name: ' + profile.getName());
    //   console.log('Given Name: ' + profile.getGivenName());
    //   console.log('Family Name: ' + profile.getFamilyName());
    //   console.log('Image URL: ' + profile.getImageUrl());
    //   console.log('Email: ' + profile.getEmail());
    // }
    console.log(userProfile)
    const googleName = userProfile.data.name;
    const googleUserID = userProfile.data.id;
    const googleUserEmail = userProfile.data.email;
    const googleProfileImage = userProfile.data.picture;
    const googleAccessToken = oauth2Client.credentials.access_token
    // const { sub, name, email, picture, accessToken } = jwtdecode(decodedTokenId);
    // console.log("ACCESS TOKEN", accessToken)
    if (!existingGoogleProfile) {
      existingGoogleProfile = new GoogleToken({
        userId: userId,
        authCode: authorizationCode,
        googleUserName: googleName,
        googleId: googleUserID,
        googleEmail: googleUserEmail,
        profilePicture: googleProfileImage,
        token: googleAccessToken
      });

    } else {
      existingGoogleProfile.authCode = authorizationCode;
      existingGoogleProfile.googleUserName = googleName;
      existingGoogleProfile.googleId = googleUserID;
      existingGoogleProfile.googleEmail = googleUserEmail;
      existingGoogleProfile.profilePicture = googleProfileImage;
      existingGoogleProfile.token = googleAccessToken
    }
    await existingGoogleProfile.save();
    res.json({
      userId: userId,
      authCode: authorizationCode,
      googleId: googleUserID,
      googleEmail: googleUserEmail,
      profilePicture: googleProfileImage,
      googleUserName: googleName,
      accessToken: oauth2Client.credentials ? oauth2Client.credentials.access_token  : "ERROR"
    });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error getting user information' });
  }
}

async function createGooglePost(req, res) {
  try {
    const tweetContent = req.body.postData.title
    const userId = req.body.userId
    // const tweetResponse = await axios.post('https://api.google.com/2/tweets', {
    //   text: "Pakisatn"
    // }, {})

    // console.log(tweetResponse)
    const existingGoogleProfile = await GoogleToken.findOne({ userId })

    // const response = await authClient.requestAccessToken(existingGoogleProfile.authCode);


    const postTweet = await googleClient.tweets.createTweet({
      // The text of the Tweet
      text: `${tweetContent}`,

      // Options for a Tweet with a poll
      // poll: {
      //   options: ["Yes", "Maybe", "No"],
      //   duration_minutes: 120,
      // },
    });
    console.log(postTweet)
    res.status(201).json({ message: "Tweet Posted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error Posting Tweet' });
  }
}

async function createGooglePostGlobal(req, res) {
  try {
    const { userId, postData, googleAccessToken } = req.body;

    // Fetch user data from Google using the access token
    const googleResponse = await axios.get('https://api.google.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
      },
    });

    // Assuming you store the Google user's ID in your User model
    console.log('Google response:', googleResponse.data)
    const googleId = googleResponse.data.sub;
    const headers = {
      Authorization: `Bearer ${googleAccessToken}`,
      'Content-Type': 'image/jpeg', // Adjust the content type based on your image type
    };
    let body = {
      "author": `urn:li:person:${googleId}`,
      "lifecycleState": "PUBLISHED",
      "specificContent": {
        "com.google.ugc.ShareContent": {
          "shareCommentary": {
            "text": `${postData.text}`
          },
          "shareMediaCategory": "NONE"
        }
      },
      "visibility": {
        "com.google.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    }

    if (postData.post === "MEDIA") {
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      const imageBuffer = fs.readFileSync(postData.img);
      const uploadResponse = await axios.post(
        'https://api.google.com/v2/assets?action=registerUpload', {
        "registerUploadRequest": {
          "recipes": [
            "urn:li:digitalmediaRecipe:feedshare-image"
          ],
          "owner": `urn:li:person:${googleId}`,
          "serviceRelationships": [
            {
              "relationshipType": "OWNER",
              "identifier": "urn:li:userGeneratedContent"
            }
          ]
        }
      }, {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (uploadResponse.data.value) {
        console.log(uploadResponse.data, "")
        body = {
          "author": `urn:li:person:${googleId}`,
          "lifecycleState": "PUBLISHED",
          "specificContent": {
            "com.google.ugc.ShareContent": {
              "shareCommentary": {
                "text": `${postData.text}`
              },
              "shareMediaCategory": "IMAGE", // Set the media category to IMAGE
              "media": [
                {
                  "status": "READY",
                  "description": {
                    "text": "Center stage!"
                  },
                  "media": `${uploadResponse.data.value.asset}`,
                  "title": {
                    "text": "Google Talent Connect 2021"
                  }
                }
              ]
            }
          },
          "visibility": {
            "com.Twitter.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        }
        axios.post(uploadResponse.data.value.uploadMechanism["com.google.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl, imageBuffer, { headers })
          .then((response) => {
            console.log('Image uploaded successfully:', response.data);
          })
          .catch((error) => {
            console.error('Error uploading image:', error);
          });

      }
    }
    // Fetch the user from your database using the Google ID

    // Create a post using the Google API


    // console.log(uploadResponse)

    const postResponse = await axios.post(
      'https://api.google.com/v2/ugcPosts',
      body,
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );


    return true
    // return res.status(201).json({
    //   message: 'google post created successfully',
    //   post: postResponse.data,
    // });
  } catch (error) {
    console.error(error);
    // return res.status(500).json({ message: 'Internal server error' });
  }
}

const deleteGoogleAccounts = async (req, res) => {
  try {
    const googleAccounts = await GoogleToken.deleteMany();
    return res.status(200).json(googleAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getMyBusinessAuthUrl,
  createGooglePost,
  createGooglePostGlobal,
  deleteGoogleAccounts,
  createUser,
};
