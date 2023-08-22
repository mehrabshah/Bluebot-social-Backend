const config = require('./config.json');
const { Sequelize } = require('sequelize');
var database = new Sequelize(config.development);
database
    .authenticate()
    .then(() => {
        console.log('database connected');
    })
    .catch((err) => {
        console.log(err);
    });
module.exports = database;