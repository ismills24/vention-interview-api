// models/Video.js
const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const User = require('./User'); // Import User correctly

const Video = sequelize.define('Video', {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  thumbnail: DataTypes.STRING,
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  videoUrl: DataTypes.STRING,
  UploaderId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'auth0Id',
    },
  },
});

// Define the association with User after both models are defined
Video.belongsTo(User, { as: 'Uploader', foreignKey: 'UploaderId' });

module.exports = Video;
