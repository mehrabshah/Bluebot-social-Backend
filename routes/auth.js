const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const facebookController = require('../controllers/facebookController');
const twitterController = require('../controllers/twitterController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/save-token', facebookController.saveOrUpdateFacebookToken);
router.post('/get-data', facebookController.getImage);
router.post('/get-account', facebookController.getAccounts);
//router.post('twitter/get-token', twitterController.accessTwitterToken);
module.exports = router;
