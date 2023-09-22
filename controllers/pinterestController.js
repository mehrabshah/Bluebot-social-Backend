const axios = require('axios');
const jwtdecode = require('jwt-decode');
const User = require('../models/user'); // Adjust the path to your User model
const PinterestToken = require('../models/pinterestToken'); // Import your PinterestToken model
const jwt = require('jsonwebtoken');
const secret = process.env.JWTPRIVATEKEY; // Your JWT private key
const pinterestClientId = process.env.PINTEREST_CLIENT_ID; // Your Pinterest client ID
const fs = require('fs')
const Joi = require('joi');
const { post } = require('./twitterController');

const apiBaseURL='https://api-sandbox.pinterest.com'

const schema = Joi.object().keys({
  pinterestAccessToken: Joi.string().required(),
});



const createPinterestUser = async (req, res) => {
  const authorizationCode = req.body.code;
  const userId = req.body.userId;

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  params.append('redirect_uri', process.env.REDIRECT_URI);
  params.append('client_id', process.env.PINTEREST_CLIENT_ID);
  params.append('client_secret', process.env.PINTEREST_CLIENT_SECRET);
  const tokenEndpoint = 'https://www.pinterest.com/oauth/v2/accessToken';

  try {
    const response = await axios.post(tokenEndpoint, params);
    const tokenId = response?.data.id_token;
    const accessToken = response?.data.access_token;

    let existingPinterestToken = await PinterestToken.findOne({ userId });

    if (!existingPinterestToken) {
      existingPinterestToken = new PinterestToken({
        userId: userId,
        accessToken: accessToken,
        tokenId: tokenId
      });
    } else {
      existingPinterestToken.accessToken = accessToken;
      existingPinterestToken.tokenId = tokenId;
    }

    await PinterestToken.save(existingPinterestToken);

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

  const clientDetails = process.env.PINTEREST_CLIENT_ID + ":" + process.env.PINTEREST_CLIENT_SECRET

  const encodedClientDetails = Buffer.from(clientDetails).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  params.append('redirect_uri', process.env.REDIRECT_URI);
  const tokenEndpoint = `${apiBaseURL}/v5/oauth/token`;
  let existingPinterestProfile = await PinterestToken.findOne({ userId });

  const config = {
    headers: {
      'Authorization': "Basic " + encodedClientDetails,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  };
  // let existingPinterestProfile = null;
  try {
    const response = await axios.post(tokenEndpoint, params, config);
    console.log("------------")
    console.log("------------")
    console.log(response)
    console.log("------------")
    const tokenId = response?.data.refresh_token;
    const accessTokenId = response?.data.access_token;

    const headers = {
      Authorization: `Bearer ${accessTokenId}`
    }
    const apiResponse = await axios.get(`${apiBaseURL}/v5/user_account`, { headers });

    const userName = apiResponse.data.business_name;
    const profileImage = apiResponse.data.profile_image
    const pinterestId = apiResponse.data.id

    // const { sub, name, email, picture, accessToken } = jwtdecode(decodedTokenId);
    // console.log("ACCESS TOKEN", accessToken)
    if (!existingPinterestProfile) {
      existingPinterestProfile = new PinterestToken({
        userId: userId,
        authCode: authorizationCode,
        pinterestUserName: userName,
        pinterestId: pinterestId,
        pinterestEmail: "test@gmail.com",
        profilePicture: profileImage,
        token: accessTokenId
      });

    } else {
      existingPinterestProfile.authCode = authorizationCode;
      existingPinterestProfile.pinterestUserName = userName;
      existingPinterestProfile.pinterestId = pinterestId;
      existingPinterestProfile.pinterestEmail = "test@gmail.com";
      existingPinterestProfile.profilePicture = profileImage;
      existingPinterestProfile.token = accessTokenId
    }
    await existingPinterestProfile.save();
    res.json({
      userId: userId,
      authCode: authorizationCode,
      pinterestId: pinterestId,
      pinterestEmail: "test@gmail.com",
      profilePicture: profileImage,
      pinterestUserName: userName,
      accessToken: response ? response.data.access_token : "ERROR"
    });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error getting user information' });
  }
}

const getPinterestTables = async (req, res) => {
  try {
    const pinterestAccounts = await PinterestToken.find();
    return res.status(200).json(pinterestAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
const getPinBoards = async (req, res) => {
  try {
    const userId = req.body.userId;
    let existingPinterestProfile = await PinterestToken.findOne({ userId });
    const headers = {
      Authorization: `Bearer ${existingPinterestProfile.token}`
    }

    const boardApiResponse = await axios.get(`${apiBaseURL}/v5/boards`,{ headers })
    return res.status(200).json(boardApiResponse.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


async function createPinterestPost(req, res) {
  try {
    const { userId, postData } = req.body;

    const accessToken = await PinterestToken.findOne({ userId });

    // Fetch user data from Pinterest using the access token
    const pinterestResponse = await axios.get(`${apiBaseURL}/v5/boards`, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
    });

    // const createBoardResponse = await axios.post(`${apiBaseURL}/v5/boards`,
    //   {
    //     "name": "Summer Recipes",
    //     "description": "My favorite summer recipes",
    //     "privacy": "PUBLIC"
    //   }, 
    //   {
    //   headers: {
    //     Authorization: `Bearer ${accessToken.token}`,
    //     'Content-Type': 'application/json'
    //   },
    // });

    console.log(pinterestResponse)
    // console.log(createBoardResponse)
    // Fetch the user from your database using the Pinterest ID

    console.log("Pinterest Post Data: " + postData)
    // Create a post using the Pinterest API
    const postResponse = await axios.post(
      `${apiBaseURL}/v5/pins`,
      {
        "title": `${postData.title}`,
        "description": `${postData.desc}`,
        "board_id": `${postData.pinBoard}`,
        "media_source": {
          "source_type": "image_url",
          // "url": `${postData.img}`
          "url": `https://www.recipetineats.com/wp-content/uploads/2022/08/Stack-of-cheeseburgers.jpg`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json({
      message: 'Pinterest post created successfully',
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

async function createPinterestPostGlobal(req, res) {
  try {
    const { userId, postData, pinterestAccessToken } = req.body;

    // Fetch user data from Pinterest using the access token
    const pinterestResponse = await axios.get('https://api.pinterest.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${pinterestAccessToken}`,
      },
    });

    // Assuming you store the Pinterest user's ID in your User model
    console.log('Pinterest response:', pinterestResponse.data)
    const pinterestId = pinterestResponse.data.sub;
    const headers = {
      Authorization: `Bearer ${pinterestAccessToken}`,
      'Content-Type': 'image/jpeg', // Adjust the content type based on your image type
    };
    let body = {
      "author": `urn:li:person:${pinterestId}`,
      "lifecycleState": "PUBLISHED",
      "specificContent": {
        "com.pinterest.ugc.ShareContent": {
          "shareCommentary": {
            "text": `${postData.text}`
          },
          "shareMediaCategory": "NONE"
        }
      },
      "visibility": {
        "com.pinterest.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    }

    if (postData.post === "MEDIA") {
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      console.log("INSIDE-----------------------")
      const imageBuffer = fs.readFileSync(postData.img);
      const uploadResponse = await axios.post(
        'https://api.pinterest.com/v2/assets?action=registerUpload', {
        "registerUploadRequest": {
          "recipes": [
            "urn:li:digitalmediaRecipe:feedshare-image"
          ],
          "owner": `urn:li:person:${pinterestId}`,
          "serviceRelationships": [
            {
              "relationshipType": "OWNER",
              "identifier": "urn:li:userGeneratedContent"
            }
          ]
        }
      }, {
        headers: {
          Authorization: `Bearer ${pinterestAccessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (uploadResponse.data.value) {
        console.log(uploadResponse.data, "")
        body = {
          "author": `urn:li:person:${pinterestId}`,
          "lifecycleState": "PUBLISHED",
          "specificContent": {
            "com.pinterest.ugc.ShareContent": {
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
                    "text": "Pinterest Talent Connect 2021"
                  }
                }
              ]
            }
          },
          "visibility": {
            "com.pinterest.ugc.MemberNetworkVisibility": "PUBLIC"
          }
        }
        axios.post(uploadResponse.data.value.uploadMechanism["com.pinterest.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl, imageBuffer, { headers })
          .then((response) => {
            console.log('Image uploaded successfully:', response.data);
          })
          .catch((error) => {
            console.error('Error uploading image:', error);
          });

      }
    }
    // Fetch the user from your database using the Pinterest ID

    // Create a post using the Pinterest API


    // console.log(uploadResponse)

    const postResponse = await axios.post(
      'https://api.pinterest.com/v2/ugcPosts',
      body,
      {
        headers: {
          Authorization: `Bearer ${pinterestAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );


    return true
    // return res.status(201).json({
    //   message: 'Pinterest post created successfully',
    //   post: postResponse.data,
    // });
  } catch (error) {
    console.error(error);
    // return res.status(500).json({ message: 'Internal server error' });
  }
}

const deletePinterestAccounts = async (req, res) => {
  try {
    const pinterestAccounts = await PinterestToken.deleteMany();
    return res.status(200).json(pinterestAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createPinterestUser,
  createPinterestPost,
  createPinterestPostGlobal,
  getPinterestTables,
  deletePinterestAccounts,
  createUser,
  getPinBoards
};
