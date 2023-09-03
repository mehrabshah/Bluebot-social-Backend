const axios = require('axios');
const jwtdecode  = require('jwt-decode');
const User = require('../models/user'); // Adjust the path to your User model
const LinkedinToken = require('../models/linkedinToken'); // Import your LinkedInToken model
const jwt = require('jsonwebtoken');
const secret = process.env.JWTPRIVATEKEY; // Your JWT private key
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID; // Your LinkedIn client ID

const Joi = require('joi');

const schema = Joi.object().keys({
  linkedinAccessToken: Joi.string().required(),
});



const createLinkedinUser = async (req, res) => {
  const authorizationCode = req.body.code;
  const userId = req.body.userId;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  params.append('redirect_uri', process.env.LINKEDIN_REDIRECT_URI);
  params.append('client_id', process.env.LINKEDIN_CLIENT_ID);
  params.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);
  const tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';

  try {
    const response = await axios.post(tokenEndpoint, params);
    const tokenId = response?.data.id_token;
    const accessToken = response?.data.access_token;
    
    let existingLinkedinToken = await LinkedinToken.findOne({ userId });

    if (!existingLinkedinToken) {
      existingLinkedinToken = new LinkedinToken({
        userId: userId,
        accessToken: accessToken,
        tokenId: tokenId
      });
    } else {
      existingLinkedinToken.accessToken = accessToken;
      existingLinkedinToken.tokenId = tokenId;
    }
    
    await LinkedinToken.save();
    
    res.json({
      accessToken: accessToken,
      tokenId: tokenId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error exchanging authorization code for access token' });
  }
};
const createUser=async(req,res)=>{
  const authorizationCode = req.body.code;
  const userId = req.body.userId;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', authorizationCode);
  params.append('redirect_uri', process.env.LINKEDIN_REDIRECT_URI);
  params.append('client_id', process.env.LINKEDIN_CLIENT_ID);
  params.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);
  const tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';
  let existingLinkedinProfile = await LinkedinToken.findOne({ userId });
  try{
    const response = await axios.post(tokenEndpoint, params);
    const tokenId = response?.data.id_token;  
    const accessTokenId = response?.data.access_token;  
    const {sub,name,email,picture}=jwtdecode(tokenId);
  if (!existingLinkedinProfile) {
    existingLinkedinProfile = new LinkedinToken({
      userId: userId,
      authCode: authorizationCode,
      linkedinUserName: name,
      linkedinId: sub,
      linkedinEmail: email,
      profilePicture: picture
    });

  } else {
    existingLinkedinProfile.authCode = authorizationCode;
    existingLinkedinProfile.linkedinUserName = name;
    existingLinkedinProfile.linkedinId = sub;
    existingLinkedinProfile.linkedinEmail = email;
    existingLinkedinProfile.profilePicture = picture;
  }
  await existingLinkedinProfile.save();
  res.json({
    userId: userId,
    authCode:authorizationCode,
    linkedinId: sub,
    linkedinEmail: email,
    profilePicture:picture,
    linkedinUserName:name
  });
}
  catch(error){
    res.status(500).json({ error: 'Error getting user information' });
  }
}

const getLinkedinTables=async(req,res)=>{
  try {
    const linkedinAccounts = await LinkedinToken.find();
    return res.status(200).json(linkedinAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


async function createLinkedInPost(req, res) {
  try {
    const { userId,postData,linkedinAccessToken } = req.body;

    // Fetch user data from LinkedIn using the access token
    const linkedinResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${linkedinAccessToken}`,
      },
    });

    // Assuming you store the LinkedIn user's ID in your User model
    console.log('LinkedIn response:', linkedinResponse.data)
    const linkedinId = linkedinResponse.data.sub;

    // Fetch the user from your database using the LinkedIn ID

    // Create a post using the LinkedIn API
    const postResponse = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        "author": `urn:li:person:${linkedinId}`,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": `${postData}`
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    },
      {
        headers: {
          Authorization: `Bearer ${linkedinAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json({
      message: 'LinkedIn post created successfully',
      post: postResponse.data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
const deleteLinkedinAccounts=async(req,res)=>{
  try {
    const linkedinAccounts = await LinkedinToken.deleteMany();
    return res.status(200).json(linkedinAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  createLinkedInPost,
  createLinkedinUser,
  getLinkedinTables,
  deleteLinkedinAccounts,
  createUser
};
