// routes/comments.js
const express = require('express');
const router = express.Router();
const { Comment, User, Video } = require('../models');
const {enhancedCheckJwt} = require('../middleware/auth');

// Endpoint to like a comment
router.post('/:id/like', enhancedCheckJwt, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    comment.likes += 1;
    await comment.save();
    res.json({ likes: comment.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to dislike a comment
router.post('/:id/dislike', enhancedCheckJwt, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    comment.dislikes += 1;
    await comment.save();
    res.json({ dislikes: comment.dislikes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', enhancedCheckJwt, async (req, res) => {
    try {
      // Ensure the User model is being included when fetching the comment
      const comment = await Comment.findByPk(req.params.id, {
        include: [{ model: User, attributes: ['auth0Id'] }],
      });
  
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
  
      // Check if the comment belongs to the current user
      if (comment.User.auth0Id !== req.user.sub) {
        return res.status(403).json({ error: 'You do not have permission to delete this comment' });
      }
  
      await comment.destroy();
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
