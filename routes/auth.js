const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const facebookController = require('../controllers/facebookController');
const twitterController = require('../controllers/twitterController');
const linkedinController = require('../controllers/linkedinController'); // Import the LinkedIn controller
const pinterestController = require('../controllers/pinterestController'); // Import the Pinterest controller
const tiktokController = require('../controllers/tiktokController'); // Import the Tiktok controller

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/save-token', facebookController.saveOrUpdateFacebookToken);
router.post('/get-data', facebookController.getImage);
router.post('/get-account', facebookController.getAccounts);
router.post('/linkedin/create-post', linkedinController.createLinkedInPost); // Add the LinkedIn endpoint
router.post('/linkedin/create-linkedin-user',linkedinController.createUser)
router.get('/linkedin/get-users',linkedinController.getLinkedinTables)
router.delete('/linkedin/delete-users',linkedinController.deleteLinkedinAccounts)

router.post('/pinterest/create-pinterest-user',pinterestController.createUser)
router.post('/pinterest/create-post', pinterestController.createPinterestPost);
router.post('/pinterest/get-boards', pinterestController.getPinBoards);

router.post('/pinterest/create-tiktok-user',tiktokController.createUser)

//router.post('twitter/get-token', twitterController.accessTwitterToken);
module.exports = router;
