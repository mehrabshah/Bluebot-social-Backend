const axios = require('axios');
const jwtdecode = require('jwt-decode');
const User = require('../models/user'); // Adjust the path to your User model
const TiktokToken = require('../models/tiktokToken'); // Import your TiktokToken model
const jwt = require('jsonwebtoken');
const secret = process.env.JWTPRIVATEKEY; // Your JWT private key
const tiktokClientId = process.env.TIKTOK_CLIENT_ID; // Your Tiktok client ID
const fs = require('fs')
const Joi = require('joi');
const { post } = require('./twitterController');

const schema = Joi.object().keys({
  tiktokAccessToken: Joi.string().required(),
});



const createTiktokUser = async (req, res) => {
  const authorizationCode = req.body.code;
  const userId = req.body.userId;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  // params.append('redirect_uri', process.env.REDIRECT_URI);
  params.append('client_id', process.env.TIKTOK_CLIENT_ID);
  params.append('client_secret', process.env.TIKTOK_CLIENT_SECRET);
  const tokenEndpoint = 'https://open-api.tiktok.com/oauth/access_token/';

  try {
    const response = await axios.post(tokenEndpoint, params);
    const tokenId = response?.data.refresh_token;
    const accessToken = response?.data.access_token;

    let existingTiktokToken = await TiktokToken.findOne({ userId });

    if (!existingTiktokToken) {
      existingTiktokToken = new TiktokToken({
        userId: userId,
        accessToken: accessToken,
        tokenId: tokenId
      });
    } else {
      existingTiktokToken.accessToken = accessToken;
      existingTiktokToken.tokenId = tokenId;
    }

    await TiktokToken.save(existingTiktokToken);

    res.json({
      accessToken: accessToken,
      tokenId: tokenId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error exchanging authorization code for access token' });
  }
};
const createUser = async (req, res) => {
  const authorizationCode = req.body.code;
  const userId = req.body.userId;

  const clientDetails = process.env.TIKTOK_CLIENT_ID + ":" + process.env.TIKTOK_CLIENT_SECRET

  const encodedClientDetails = Buffer.from(clientDetails).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  // params.append('redirect_uri', process.env.REDIRECT_URI);
  params.append('client_id', process.env.TIKTOK_CLIENT_ID);
  params.append('client_secret', process.env.TIKTOK_CLIENT_SECRET);
  const tokenEndpoint = 'https://open-api.tiktok.com/oauth/access_token/';
  let existingTiktokProfile = await TiktokToken.findOne({ userId });

  const config = {
    headers: {
      'Authorization': "Basic " + encodedClientDetails,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  };
  // let existingTiktokProfile = null;
  try {
    const response = await axios.post(tokenEndpoint, params);
    console.log("------------")
    console.log("------------")
    console.log(response)
    console.log("------------")
    const tokenId = response?.data.refresh_token;
    const accessTokenId = response?.data.access_token;

    const headers = {
      "Content-Type": "application/json",
      "fields": ["open_id", "union_id", "avatar_url", "display_name"]
    }
    const tiktokBody = {
      "access_token": accessTokenId
    }

    const apiResponse = await axios.post('https://open-api.tiktok.com/user/info/', tiktokBody, { headers });

    const userName = apiResponse.data.business_name;
    const profileImage = apiResponse.data.profile_image
    const tiktokId = apiResponse.data.id

    // const { sub, name, email, picture, accessToken } = jwtdecode(decodedTokenId);
    // console.log("ACCESS TOKEN", accessToken)
    if (!existingTiktokProfile) {
      existingTiktokProfile = new TiktokToken({
        userId: userId,
        authCode: authorizationCode,
        tiktokUserName: userName,
        tiktokId: tiktokId,
        tiktokEmail: "test@gmail.com",
        profilePicture: profileImage,
        token: accessTokenId
      });

    } else {
      existingTiktokProfile.authCode = authorizationCode;
      existingTiktokProfile.tiktokUserName = userName;
      existingTiktokProfile.tiktokId = tiktokId;
      existingTiktokProfile.tiktokEmail = "test@gmail.com";
      existingTiktokProfile.profilePicture = profileImage;
      existingTiktokProfile.token = accessTokenId
    }
    await existingTiktokProfile.save();
    res.json({
      userId: userId,
      authCode: authorizationCode,
      tiktokId: tiktokId,
      tiktokEmail: "test@gmail.com",
      profilePicture: profileImage,
      tiktokUserName: userName,
      accessToken: response ? response.data.access_token : "ERROR"
    });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error getting user information' });
  }
}

const getTiktokTables = async (req, res) => {
  try {
    const tiktokAccounts = await TiktokToken.find();
    return res.status(200).json(tiktokAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


async function createTiktokPost(req, res) {
  try {
    const { userId, postData, tiktokAccessToken } = req.body;

    // Fetch user data from Tiktok using the access token
    const tiktokResponse = await axios.get('https://api.Tiktok.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${AccessToken}`,
      },
    });

    // Assuming you store the Tiktok user's ID in your User model
    console.log('Tiktok response:', tiktokResponse.data)
    const tiktokId = tiktokResponse.data.sub;

    // Fetch the user from your database using the Tiktok ID

    // Create a post using the Tiktok API
    const postResponse = await axios.post(
      'https://api.tiktok.com/v2/ugcPosts',
      {
        "author": `urn:li:person:${tiktokId}`,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
          "com.Tiktok.ugc.ShareContent": {
            "shareCommentary": {
              "text": `${postData}`
            },
            "shareMediaCategory": "NONE"
          }
        },
        "visibility": {
          "com.tiktok.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${tiktokAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json({
      message: 'Tiktok post created successfully',
      post: postResponse.data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }

  return hash;
}

async function createTiktokPostGlobal(req, res) {
  try {
    const { userId, postData, tiktokAccessToken } = req.body;

    // Fetch user data from Tiktok using the access token
    const tiktokResponse = await axios.get('https://api.tiktok.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tiktokAccessToken}`,
      },
    });

    // Assuming you store the Tiktok user's ID in your User model
    console.log('Tiktok response:', tiktokResponse.data)
    const tiktokId = tiktokResponse.data.sub;
    const headers = {
      Authorization: `Bearer ${tiktokAccessToken}`,
      'Content-Type': 'image/jpeg', // Adjust the content type based on your image type
    };
    let body = {
      "author": `urn:li:person:${tiktokId}`,
      "lifecycleState": "PUBLISHED",
      "specificContent": {
        "com.Tiktok.ugc.ShareContent": {
          "shareCommentary": {
            "text": `${postData.text}`
          },
          "shareMediaCategory": "NONE"
        }
      },
      "visibility": {
        "com.Tiktok.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    }

    if (postData.post === "MEDIA") {
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      const imageBuffer = fs.readFileSync(postData.img);
      const uploadResponse = await axios.post(
        'https://api.Tiktok.com/v2/assets?action=registerUpload', {
        "registerUploadRequest": {
          "recipes": [
            "urn:li:digitalmediaRecipe:feedshare-image"
          ],
          "owner": `urn:li:person:${tiktokId}`,
          "serviceRelationships": [
            {
              "relationshipType": "OWNER",
              "identifier": "urn:li:userGeneratedContent"
            }
          ]
        }
      }, {
        headers: {
          Authorization: `Bearer ${tiktokAccessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (uploadResponse.data.value) {
        console.log(uploadResponse.data, "")
        body = {
          "author": `urn:li:person:${tiktokId}`,
          "lifecycleState": "PUBLISHED",
          "specificContent": {
            "com.Tiktok.ugc.ShareContent": {
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
                    "text": "Tiktok Talent Connect 2021"
                  }
                }
              ]
            }
          },
          "visibility": {
            "com.Tiktok.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        }
        axios.post(uploadResponse.data.value.uploadMechanism["com.Tiktok.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl, imageBuffer, { headers })
          .then((response) => {
            console.log('Image uploaded successfully:', response.data);
          })
          .catch((error) => {
            console.error('Error uploading image:', error);
          });

      }
    }
    // Fetch the user from your database using the Tiktok ID

    // Create a post using the Tiktok API


    // console.log(uploadResponse)

    const postResponse = await axios.post(
      'https://api.Tiktok.com/v2/ugcPosts',
      body,
      {
        headers: {
          Authorization: `Bearer ${tiktokAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );


    return true
    // return res.status(201).json({
    //   message: 'Tiktok post created successfully',
    //   post: postResponse.data,
    // });
  } catch (error) {
    console.error(error);
    // return res.status(500).json({ message: 'Internal server error' });
  }
}

const deleteTiktokAccounts = async (req, res) => {
  try {
    const tiktokAccounts = await TiktokToken.deleteMany();
    return res.status(200).json(tiktokAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createTiktokUser,
  createTiktokPost,
  createTiktokPostGlobal,
  getTiktokTables,
  deleteTiktokAccounts,
  createUser
};
