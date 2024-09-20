// seedUser.js
const { sequelize, User } = require('./models');
require('dotenv').config();

async function seedUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Check if the user already exists
    const existingUser = await User.findOne({
      where: { auth0Id: process.env.AUTH0_USER_ID },
    });

    if (existingUser) {
      console.log('User already exists in the database.');
      return;
    }

    // Create a new user with your Auth0 ID
    const newUser = await User.create({
      auth0Id: process.env.AUTH0_USER_ID, // Replace with your Auth0 user ID
      displayName: process.env.AUTH0_DISPLAY_NAME,
    });

    console.log('User has been added successfully:', newUser.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Unable to seed the user:', error);
    process.exit(1);
  }
}

seedUser();
