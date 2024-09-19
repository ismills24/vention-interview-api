const express = require('express');
const router = express.Router();
const { Video, User, Comment } = require('../models');
const { enhancedCheckJwt } = require('../middleware/auth');

// Get all videos - Publicly Accessible
router.get('/', async (req, res) => {
  try {
    const videos = await Video.findAll({
      attributes: ['id', 'title', 'description', 'thumbnail', 'views', 'uploadDate', 'videoUrl'],
      include: [
        { model: User, as: 'Likes', attributes: ['id', 'auth0Id'], through: { attributes: [] } },
        { model: Comment, include: [{ model: User, attributes: ['id', 'auth0Id'] }] },
      ],
    });
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's favorited videos - Requires Authentication
router.get('/favorites', enhancedCheckJwt, async (req, res) => {
  try {
    const userAuth0Id = req.user.sub;
    const user = await User.findOne({
      where: { auth0Id: userAuth0Id },
      include: [{ model: Video, as: 'FavoritedVideos' }],
    });

    if (!user) {
      console.log('No user found with Auth0 ID:', userAuth0Id);
      return res.json([]);
    }

    res.json(user.FavoritedVideos);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific video by ID - Publicly Accessible
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findByPk(req.params.id, {
      attributes: ['id', 'title', 'description', 'thumbnail', 'views', 'uploadDate', 'videoUrl'],
      include: [
        {
          model: Comment,
          include: [{ model: User, attributes: ['displayName'] }],
        },
      ],
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Increment the view count
    video.views += 1;
    await video.save();

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite status - Requires Authentication
router.post('/:id/favorite', enhancedCheckJwt, async (req, res) => {
  try {
    const userAuth0Id = req.user.sub;
    let user = await User.findOne({ where: { auth0Id: userAuth0Id } });
    if (!user) {
      user = await User.create({ auth0Id: userAuth0Id });
    }

    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const favorited = await user.hasFavoritedVideo(video);

    if (favorited) {
      // Remove from favorites
      await user.removeFavoritedVideo(video);
      res.json({ message: 'Video removed from favorites' });
    } else {
      // Add to favorites
      await user.addFavoritedVideo(video);
      res.json({ message: 'Video added to favorites' });
    }
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a comment - Requires Authentication
router.post('/:id/comments', enhancedCheckJwt, async (req, res) => {
  try {
    const userAuth0Id = req.user.sub;
    let user = await User.findOne({ where: { auth0Id: userAuth0Id } });
    if (!user) {
      user = await User.create({ auth0Id: userAuth0Id });
    }

    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const comment = await Comment.create({
      content: req.body.content,
      UserId: user.id,
      VideoId: video.id,
    });
    res.json({ ...comment.toJSON(), displayName: user.displayName });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch comments for a video - Publicly Accessible
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { VideoId: req.params.id },
      include: [{ model: User, attributes: ['displayName', 'auth0Id'] }],
      order: [['likes', 'DESC'], ['dislikes', 'ASC']],
    });

    if (!comments) {
      return res.status(404).json({ error: 'No comments found' });
    }

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
