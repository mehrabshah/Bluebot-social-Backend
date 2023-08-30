const Facebook = require('../models/facebook'); // Adjust the path to the model
const axios = require('axios'); // Import the axios module
async function saveOrUpdateFacebookToken(req, res) {
    const { userId: userId, fb_id: fb_id, token: token } = req.body;
    const appID = '727057952593031';
    const appSecret = 'dc4913beb4248e093c72ea8674e92656';

    try {
        // Check if a document with the given userId already exists
        const existingFacebook = await Facebook.findOne({ userId: userId });
        const response = await axios.get(`https://graph.facebook.com/v17.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appID}&client_secret=${appSecret}&fb_exchange_token=${token}`);
        console.log(response.data);
        const longLivedToken = response.data.access_token;
        if (existingFacebook) {
            // If the document exists, update the token
            existingFacebook.fb_id = fb_id;  
            existingFacebook.token = longLivedToken;
            const updatedFacebook = await existingFacebook.save();
        //    console.log('Facebook token updated:', updatedFacebook);
            res.status(200).json({ message: 'Facebook token updated', data: updatedFacebook });
        } else {
            // If the document doesn't exist, create a new one
            const newFacebook = new Facebook({
                userId: userId,
                fb_id: fb_id,
                token: longLivedToken
            });
            const savedFacebook = await newFacebook.save();
            console.log('New Facebook token saved:', savedFacebook);
            res.status(201).json({ message: 'New Facebook token saved', data: savedFacebook });
        }
    } catch (error) {
        console.error('Error saving/updating Facebook token:', error);
        res.status(500).json({ message: 'Error saving/updating Facebook token', error: error.message });
    }
}

async function getImage(req, res) {
    const userId = req.body.userId;
   // console.log(userId);
    const existingFacebook = await Facebook.findOne({ userId: userId });
    if (existingFacebook) {
        const id = existingFacebook.fb_id;
        const token = existingFacebook.token;

        try {
            const response = await axios.get(`https://graph.facebook.com/${id}/picture?type=large`);
            const profileImageURL = response.request.res.responseUrl;
          //  console.log(token + "image");
            res.json({ profileImageURL: profileImageURL, fb_id: id, token : token});
        } catch (error) {
            console.error('Error fetching user profile image:', error);
            res.status(500).json({ error: 'Error fetching user profile image' });
        }
    }
};

async function getAccounts(req, res) {
    try {
       const token = req.body.token;  // You may want to secure this better in real apps
       console.log(token + 'jkiuihihuhihuh');
       const response = await axios.get(`https://graph.facebook.com/v17.0/me/accounts?access_token=${token}`);
       const data = response.data;
 
    //    const accounts = data.map(account => ({
    //       id: account.id,
    //       name: account.name,
    //       accessToken: account.access_token
    //    }));

    console.log(response.data.data);
       const idAccessTokenArray = response.data.data.map(item => ({
        id: item.id,
        access_token: item.access_token,
        name: item.name
       }));
       console.log(idAccessTokenArray);
       res.json(idAccessTokenArray);
    } catch (error) {
       res.status(500).json({ error: 'Failed to fetch accounts.' });
    }
 };


module.exports = { saveOrUpdateFacebookToken, getImage, getAccounts };