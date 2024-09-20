const { faker } = require('@faker-js/faker');
const { sequelize, Video, User } = require('./models');
require('dotenv').config();

async function seedUsers() {
  try {
    // Seed a specific user defined by the environment variables
    const users = [
      {
        auth0Id: process.env.AUTH0_USER_ID,
        displayName: process.env.AUTH0_DISPLAY_NAME,
      },
    ];

    // Seed additional users with unique auth0Id values
    for (let i = 0; i < 9; i++) {  // Adjust the loop to add other users if needed
      users.push({
        auth0Id: `auth0|${faker.string.uuid()}`, // Generates unique UUIDs for each user
        displayName: faker.person.fullName(),
      });
    }

    // Insert users into the database
    await User.bulkCreate(users, { ignoreDuplicates: true }); // This ensures existing users are not duplicated
    console.log('Users have been added successfully.');

    // Fetch the users to associate videos correctly
    return await User.findAll();
  } catch (error) {
    console.error('Unable to seed users:', error);
    throw error;
  }
}

async function seedVideos() {
  try {
    const users = await seedUsers();

    // Ensure videos only use valid UploaderIds from the seeded users
    const videos = [];
    for (let i = 0; i < 1000; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      videos.push({
        title: faker.food.dish(),
        description: faker.food.description(),
        thumbnail: faker.image.urlLoremFlickr({ category: 'nature' }),
        views: faker.number.int({ min: 0, max: 1000 }),
        uploadDate: faker.date.past(),
        videoUrl: 'https://cdn.pixabay.com/video/2016/02/29/2304-157269929_large.mp4',
        UploaderId: randomUser.id, // Ensure this matches an existing user
      });
    }

    // Insert videos into the database
    await Video.bulkCreate(videos);
    console.log('Videos have been added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to seed the database:', error);
    process.exit(1);
  }
}

async function seedDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync the database (drop tables and recreate them)
    await sequelize.sync({ force: true });

    // Seed users and videos
    await seedVideos();
  } catch (error) {
    console.error('Error seeding the database:', error);
    process.exit(1);
  }
}

seedDatabase().catch(console.error);
