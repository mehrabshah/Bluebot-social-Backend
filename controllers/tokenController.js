
const Token = require('../models/token'); 


exports.createToken = async (req, res) => {
  try {
    const { token, type, user } = req.body;
    const newToken = new Token({ token, type, user });
    await newToken.save();
    res.status(201).json(newToken);
  } catch (error) {
    res.status(500).json({ error: 'Could not create token' });
  }
};


exports.getAllTokens = async (req, res) => {
  try {
    const tokens = await Token.find();
    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve tokens' });
  }
};


exports.getTokensByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const tokens = await Token.find({ user: userId });
    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve tokens by user ID' });
  }
};
