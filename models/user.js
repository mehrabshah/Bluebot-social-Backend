const { boolean } = require('joi')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Joi = require('joi')
const usersSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  gender: { type: String, required: true },
})
const User = mongoose.model('User', usersSchema)
module.exports = User
