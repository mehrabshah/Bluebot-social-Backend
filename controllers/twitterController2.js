const axios = require('axios');
const jwtdecode = require('jwt-decode');
const User = require('../models/user'); // Adjust the path to your User model
const TwitterToken = require('../models/twitterToken'); // Import your TwitterToken model
const jwt = require('jsonwebtoken');
const secret = process.env.JWTPRIVATEKEY; // Your JWT private key
const twitterClientId = process.env.TWIITER_CLIENT_ID; // Your Twitter client ID
const fs = require('fs')
const Joi = require('joi');
const { post } = require('./twitterController');
const schedule = require('node-schedule');

const { Client, auth } = require("twitter-api-sdk");

let authClient = new auth.OAuth2User({
  client_id: process.env.TWITTER_CLIENT_ID,
  client_secret: process.env.TWITTER_CLIENT_SECRET,
  callback: process.env.REDIRECT_URI,
  scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
});

const twitterClient = new Client(authClient);


const requestToken = async () => {

  const twitterAccessToken = await authClient.requestAccessToken(code);
  console.log(twitterAccessToken);
}

const getTwitterAuthUrl = async (req, res) => {
  const authUrl = authClient.generateAuthURL({
    state: "skjdfhjsf24754fsdf",
    code_challenge_method: "s256",
  }); 

  if (authUrl) {
    res.json({
      authUrl: authUrl
    })
  }
};

const uploadImageToTwitter = async (imageFile) => {
  const headers = {
    Authorization: `Bearer ${authClient.token.access_token}`,
  };

  // const formData = new FormData();
  // formData.append('media', imageFile);

  const response = await axios.post('https://upload.twitter.com/1.1/media/upload.json', {
    headers,
    params: {
      command: 'INIT',
      media_category: 'tweet_image',
      media_data: `${imageFile}`
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to upload image to Twitter: ${response.status}`);
  }

  const jsonResponse = await response.data;

  return jsonResponse.media_id;
};

const createUser = async (req, res) => {
  const authorizationCode = req.body.code;
  const userId = req.body.userId;

  let existingTwitterProfile = await TwitterToken.findOne({ userId })

  try {
    // if (state !== STATE) return res.status(500).send("State isn't matching");
    const response = await authClient.requestAccessToken(req.body.code);
    const twitterRefreshToken = response.token.refresh_token;
    const twitterAccessToken = response.token.access_token;

    const getCurrentUser = await twitterClient.users.findMyUser({
      "user.fields": ["created_at", "profile_image_url"],
    });
    console.log(getCurrentUser);

    const twitterUserID = getCurrentUser.data.id
    const twitterName = getCurrentUser.data.name
    const twitterUserName = getCurrentUser.data.username
    const twitterProfileImage = getCurrentUser.data.profile_image_url

    // const { sub, name, email, picture, accessToken } = jwtdecode(decodedTokenId);
    // console.log("ACCESS TOKEN", accessToken)
    if (!existingTwitterProfile) {
      existingTwitterProfile = new TwitterToken({
        userId: userId,
        authCode: authorizationCode,
        twitterUserName: twitterName,
        twitterId: twitterUserID,
        twitterEmail: "test@gmail.com",
        profilePicture: twitterProfileImage,
        authClient: authClient
      });

    } else {
      existingTwitterProfile.authCode = authorizationCode;
      existingTwitterProfile.twitterUserName = twitterName;
      existingTwitterProfile.twitterId = twitterUserID;
      existingTwitterProfile.twitterEmail = "test@gmail.com";
      existingTwitterProfile.profilePicture = twitterProfileImage;
      existingTwitterProfile.authClient = authClient
    }
    await existingTwitterProfile.save();
    res.json({
      userId: userId,
      authCode: authorizationCode,
      twitterId: twitterUserID,
      twitterEmail: "test@gmail.com",
      profilePicture: twitterProfileImage,
      twitterUserName: twitterName,
      // accessToken: response ? response.data.access_token : "ERROR"
    });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error getting user information' });
  }
}

async function createTwitterPost(req, res) {
  try {
    

    const postData = req.body.postData
    const userId = req.body.userId
    const date = new Date(postData.date)
    let cronDate = `${date.getUTCMinutes()} ${date.getUTCHours()+5} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;

    // const base64Image = postData.img.split(",");
    // const imageType = base64Image[0].split(":")[1].split(";")[0]; 

    const existingTwitterProfile = await TwitterToken.findOne({ userId })
    if (authClient.token === undefined || authClient.token === null) {
      authClient.token = existingTwitterProfile.authClient.token
      const isAccessTokenExpired = await authClient.isAccessTokenExpired();
      if (isAccessTokenExpired) {
        // const response = await authClient.refreshAccessToken();
      }
    }

    // const mediaId = await uploadImageToTwitter(base64Image[1]);
    // console.log(mediaId)
    const job =  schedule.scheduleJob(cronDate, async() => {
         
               
   
      const postTweet = await twitterClient.tweets.createTweet({
        // The text of the Tweet
        text: `${postData.title}`,
  
        // media: {"media_data": `${base64Image[1]}`},
  
        // Options for a Tweet with a poll
        // poll: {
        //   options: ["Yes", "Maybe", "No"],
        //   duration_minutes: 120,
        // },
      });
      job.cancel()

    })

    // console.log(postTweet)
    res.status(201).json({ message: "Tweet Posted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error Posting Tweet' });
  }
}

async function createTwitterPostGlobal(req, res) {
  try {
    const { userId, postData, twitterAccessToken } = req.body;

    // Fetch user data from Twitter using the access token
    const twitterResponse = await axios.get('https://api.twitter.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${twitterAccessToken}`,
      },
    });

    // Assuming you store the Twitter user's ID in your User model
    console.log('Twitter response:', twitterResponse.data)
    const twitterId = twitterResponse.data.sub;
    const headers = {
      Authorization: `Bearer ${twitterAccessToken}`,
      'Content-Type': 'image/jpeg', // Adjust the content type based on your image type
    };
    let body = {
      "author": `urn:li:person:${twitterId}`,
      "lifecycleState": "PUBLISHED",
      "specificContent": {
        "com.twitter.ugc.ShareContent": {
          "shareCommentary": {
            "text": `${postData.text}`
          },
          "shareMediaCategory": "NONE"
        }
      },
      "visibility": {
        "com.twitter.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    }

    if (postData.post === "MEDIA") {
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      const imageBuffer = fs.readFileSync(postData.img);
      const uploadResponse = await axios.post(
        'https://api.twitter.com/v2/assets?action=registerUpload', {
        "registerUploadRequest": {
          "recipes": [
            "urn:li:digitalmediaRecipe:feedshare-image"
          ],
          "owner": `urn:li:person:${twitterId}`,
          "serviceRelationships": [
            {
              "relationshipType": "OWNER",
              "identifier": "urn:li:userGeneratedContent"
            }
          ]
        }
      }, {
        headers: {
          Authorization: `Bearer ${twitterAccessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (uploadResponse.data.value) {
        console.log(uploadResponse.data, "")
        body = {
          "author": `urn:li:person:${twitterId}`,
          "lifecycleState": "PUBLISHED",
          "specificContent": {
            "com.Twitter.ugc.ShareContent": {
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
                    "text": "Twitter Talent Connect 2021"
                  }
                }
              ]
            }
          },
          "visibility": {
            "com.Twitter.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        }
        axios.post(uploadResponse.data.value.uploadMechanism["com.Twitter.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl, imageBuffer, { headers })
          .then((response) => {
            console.log('Image uploaded successfully:', response.data);
          })
          .catch((error) => {
            console.error('Error uploading image:', error);
          });

      }
    }
    // Fetch the user from your database using the Twitter ID

    // Create a post using the Twitter API


    // console.log(uploadResponse)

    const postResponse = await axios.post(
      'https://api.Twitter.com/v2/ugcPosts',
      body,
      {
        headers: {
          Authorization: `Bearer ${twitterAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );


    return true
    // return res.status(201).json({
    //   message: 'Twitter post created successfully',
    //   post: postResponse.data,
    // });
  } catch (error) {
    console.error(error);
    // return res.status(500).json({ message: 'Internal server error' });
  }
}

const deleteTwitterAccounts = async (req, res) => {
  try {
    const twitterAccounts = await TwitterToken.deleteMany();
    return res.status(200).json(twitterAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getTwitterAuthUrl,
  createUser,
  createTwitterPost,
  createTwitterPostGlobal,
  deleteTwitterAccounts,
};
