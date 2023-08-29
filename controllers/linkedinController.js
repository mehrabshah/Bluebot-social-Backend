const axios = require('axios');
const User = require('../models/user'); // Adjust the path to your User model
const LinkedinToken = require('../models/linkedinToken'); // Import your LinkedInToken model
const jwt = require('jsonwebtoken');
const secret = process.env.JWTPRIVATEKEY; // Your JWT private key
const linkedinClientId = process.env.LINKEDIN_CLIENT_ID; // Your LinkedIn client ID

const Joi = require('joi');

const schema = Joi.object().keys({
  linkedinAccessToken: Joi.string().required(),
});

async function saveOrUpdateLinkedinToken(req, res) {
  const { userId, linkedinId, linkedinAccessToken } = req.body;

  try {
    // Check if a document with the given userId already exists
    const existingLinkedinToken = await LinkedinToken.findOne({ userId });

    if (existingLinkedinToken) {
      // If the document exists, update the token
      existingLinkedinToken.linkedinId = linkedinId;
      existingLinkedinToken.accessToken = linkedinAccessToken;
      const updatedLinkedinToken = await existingLinkedinToken.save();
      console.log('LinkedIn token updated:', updatedLinkedinToken);
      res.status(200).json({ message: 'LinkedIn token updated', data: updatedLinkedinToken });
    } else {
      // If the document doesn't exist, create a new one
      const newLinkedinToken = new LinkedinToken({
        userId,
        linkedinId,
        accessToken: linkedinAccessToken
      });
      const savedLinkedinToken = await newLinkedinToken.save();
      console.log('New LinkedIn token saved:', savedLinkedinToken);
      res.status(201).json({ message: 'New LinkedIn token saved', data: savedLinkedinToken });
    }
  } catch (error) {
    console.error('Error saving/updating LinkedIn token:', error);
    res.status(500).json({ message: 'Error saving/updating LinkedIn token', error: error.message });
  }
}

async function createLinkedInPost(req, res) {
  try {
    const { userId, linkedinAccessToken,postData } = req.body;

    // Fetch user data from LinkedIn using the access token
    const linkedinResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${linkedinAccessToken}`,
      },
    });

    // Assuming you store the LinkedIn user's ID in your User model
    const linkedinId = linkedinResponse.data.sub;

    // Fetch the user from your database using the LinkedIn ID
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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

async function getLinkedinAccounts(req, res) {
  try {
    const { userId } = req.body;
    const existingLinkedinToken = await LinkedinToken.findOne({ userId });

    if (!existingLinkedinToken) {
      return res.status(404).json({ message: 'LinkedIn token not found' });
    }

    const linkedinAccessToken = existingLinkedinToken.accessToken;

    const response = await axios.get('https://api.linkedin.com/v2/clientsAll',
      {
        headers: {
          Authorization: `Bearer ${linkedinAccessToken}`,
        },
      });

    const accounts = response.data.elements.map(account => ({
      id: account.entityUrn.split(':').pop(),
      name: account.name,
    }));

    return res.json({ accounts });
  } catch (error) {
    console.error('Error fetching LinkedIn accounts:', error);
    return res.status(500).json({ error: 'Error fetching LinkedIn accounts' });
  }
}

module.exports = {
  saveOrUpdateLinkedinToken,
  createLinkedInPost,
  getLinkedinAccounts,
};
