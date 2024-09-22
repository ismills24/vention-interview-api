const { Model, DataTypes } = require('sequelize');
const sequelize = require('./database');

class User extends Model {}

User.init({
  auth0Id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'User',
  timestamps: true,
});

module.exports = User;
