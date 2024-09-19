// seed.js
const { sequelize, Video } = require('./models');
require('dotenv').config();

const videos = [
    {
      "title": "Exploring the Forest",
      "description": "A beautiful journey through a lush forest.",
      "thumbnail": "https://loremflickr.com/640/480/nature",
      "views": "0",
      "uploadDate": 1726679745,
      "videoUrl": "https://cdn.pixabay.com/video/2022/05/24/118014-714270866_large.mp4",
      "id": "1"
    },
    {
      "title": "Sunset by the Beach",
      "description": "Watch the sun dip below the horizon over a peaceful beach.",
      "thumbnail": "https://loremflickr.com/640/480/beach",
      "views": "0",
      "uploadDate": 1726679746,
      "videoUrl": "https://cdn.pixabay.com/video/2016/02/29/2304-157269929_large.mp4",
      "id": "2"
    },
    {
      "title": "Mountain Hiking Adventure",
      "description": "An adventurous hike through rugged mountains.",
      "thumbnail": "https://loremflickr.com/640/480/mountains",
      "views": "0",
      "uploadDate": 1726679747,
      "videoUrl": "https://videos.pexels.com/video-files/8935802/8935802-uhd_2560_1440_25fps.mp4",
      "id": "3"
    },
    {
      "title": "Cityscape Timelapse",
      "description": "A breathtaking timelapse of a bustling city at night.",
      "thumbnail": "https://loremflickr.com/640/480/city",
      "views": "0",
      "uploadDate": 1726679748,
      "videoUrl": "https://videos.pexels.com/video-files/8368202/8368202-uhd_2732_1440_25fps.mp4",
      "id": "4"
    },
    {
      "title": "Serenity of a Waterfall",
      "description": "Relax to the sight and sound of a serene waterfall.",
      "thumbnail": "https://loremflickr.com/640/480/waterfall",
      "views": "0",
      "uploadDate": 1726679749,
      "videoUrl": "https://videos.pexels.com/video-files/7295981/7295981-uhd_2732_1440_30fps.mp4",
      "id": "5"
    },
    {
      "title": "Busy Street in the City",
      "description": "A view of a busy street in a lively city center.",
      "thumbnail": "https://loremflickr.com/640/480/street",
      "views": "0",
      "uploadDate": 1726679750,
      "videoUrl": "https://videos.pexels.com/video-files/7314354/7314354-uhd_2732_1440_25fps.mp4",
      "id": "6"
    }
  ];

// Update the seedDatabase function to handle IDs
const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ force: true }); // Drops tables and recreates them

    // Insert videos
    for (const videoData of videos) {
      await Video.create(videoData);
    }

    console.log('Videos have been added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to seed the database:', error);
    process.exit(1);
  }
};

seedDatabase();
