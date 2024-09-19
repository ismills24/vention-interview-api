// routes/users.js
const express = require('express');
const router = express.Router();
const { enhancedCheckJwt } = require('../middleware/auth');
const { User } = require('../models');

// Update Profile Route
// Update Profile Route
router.post('/updateProfile', enhancedCheckJwt, async (req, res) => {
    try {
      const userAuth0Id = req.user.sub;
      const { displayName } = req.body;
  
      let user = await User.findOne({ where: { auth0Id: userAuth0Id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Update displayName and save the user
      user.displayName = displayName;
      await user.save();
      await user.reload(); // Ensure latest state is fetched after update
  
      console.log('Updated user: ', user);
      res.json({ message: 'Profile updated successfully!', user });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile. Please try again.' });
    }
  });
  
  // Fetch Profile Route
  router.get('/profile', enhancedCheckJwt, async (req, res) => {
    try {
      const userAuth0Id = req.user.sub;
      const user = await User.findOne({ where: { auth0Id: userAuth0Id } });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      console.log('Fetched user:', user);
      res.json({ displayName: user.displayName });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

module.exports = router;
