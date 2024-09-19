// models/User.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('./database');

class User extends Model {}

User.init({
  auth0Id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true, // Allow users to update their display names later
  }
}, {
  sequelize,
  modelName: 'User',
});

module.exports = User;
