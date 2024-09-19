// models/Video.js
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

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
});

module.exports = Video;
