const express = require('express');
const router = express.Router();
const { Video, User, Comment } = require('../models');
const { enhancedCheckJwt } = require('../middleware/auth');
const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

// Middleware to optionally check authentication
const optionalCheckJwt = (req, res, next) => {
  if (req.headers.authorization) {
    enhancedCheckJwt(req, res, next);
  } else {
    next();
  }
};

// Get all videos - Can include favorites if authenticated
router.get('/', optionalCheckJwt, async (req, res) => {
  const { page = 1, limit = 10, searchTerm = '', showFavorites = false } = req.query;
  const userAuth0Id = req.user?.sub; // Extract the user ID from the authenticated request, if available

  try {
    // Check if the request is for favorites and if the user is authenticated
    if (showFavorites === 'true' && userAuth0Id) {
      // Fetch the user's favorited videos
      const user = await User.findOne({
        where: { auth0Id: userAuth0Id },
        include: [{ 
          model: Video, 
          as: 'FavoritedVideos', 
          include: [{ 
            model: Comment, 
            include: [{ model: User, attributes: ['displayName'] }] 
          }] 
        }],
      });

      // If no user or no favorites, return an empty response
      if (!user || user.FavoritedVideos.length === 0) {
        return res.json({
          total: 0,
          videos: [],
          page: 1,
          pages: 0,
        });
      }

      // Return all favorited videos, bypassing pagination since it's specific to favorites
      return res.json({
        total: user.FavoritedVideos.length,
        videos: user.FavoritedVideos.map(video => ({
          ...video.toJSON(),
          isFavorite: true,
        })),
        page: 1,
        pages: 1,
      });
    }

    // Regular video fetching logic if not showing favorites
    const offset = (page - 1) * limit;
    
    // Fix: Use `Op.iLike` consistently and ensure the search term is sanitized
    let whereClause = searchTerm.trim() 
      ? { title: { [Op.iLike]: `%${searchTerm.toLowerCase()}%` } } 
      : {};

    // Fetch the paginated videos
    const videos = await Video.findAndCountAll({
      where: whereClause,
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      order: [['uploadDate', 'DESC']],
      include: [
        { model: User, as: 'Uploader', attributes: ['auth0Id', 'displayName'] },
        { model: Comment, include: [{ model: User, attributes: ['displayName'] }] },
      ],
    });

    // Check if videos are favorited for authenticated users
    let favoritedVideoIds = [];
    if (userAuth0Id) {
      const user = await User.findOne({
        where: { auth0Id: userAuth0Id },
        include: [{ model: Video, as: 'FavoritedVideos', attributes: ['id'] }],
      });

      if (user && user.FavoritedVideos.length > 0) {
        favoritedVideoIds = user.FavoritedVideos.map((video) => video.id);
      }
    }

    // Map the videos to include isFavorite status
    const videosWithFavorites = videos.rows.map((video) => ({
      ...video.toJSON(),
      isFavorite: favoritedVideoIds.includes(video.id),
    }));

    res.json({
      total: videos.count,
      videos: videosWithFavorites,
      page: parseInt(page, 10),
      pages: Math.ceil(videos.count / limit),
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific video by ID - Publicly Accessible
router.get('/:id', optionalCheckJwt, async (req, res) => {
  try {
    const videoId = req.params.id;
    const userAuth0Id = req.user?.sub;
    let isFavorite = false;

    const video = await Video.findByPk(videoId, {
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

    // Check if the video is favorited by the user
    if (userAuth0Id) {
      const user = await User.findOne({
        where: { auth0Id: userAuth0Id },
        include: [{ model: Video, as: 'FavoritedVideos', where: { id: videoId }, required: false }],
      });

      if (user && user.FavoritedVideos.length > 0) {
        isFavorite = true;
      }
    }

    // Increment the view count
    video.views += 1;
    await video.save();

    res.json({
      ...video.toJSON(),
      isFavorite, // Include the favorite status in the response
    });
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
      UserId: user.auth0Id, // Use auth0Id as the UserId
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

// Configure AWS SDK to use Cloudflare R2
const s3 = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 50 MB limit (adjust as needed)
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mkv|webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  },
});

// Upload video route
router.post('/upload', enhancedCheckJwt, upload.single('file'), async (req, res) => {
  const { originalname, buffer } = req.file;
  const userAuth0Id = req.user.sub;
  const { title, description } = req.body; // Ensure the title and description are extracted from the request body

  try {
    // Define the S3 upload parameters
    const uploadParams = {
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: `videos/${Date.now()}_${originalname}`, // Modify the key as needed
      Body: buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read', // Optional: Set permissions (public/private)
    };

    // Upload the file to R2
    const uploadResult = await s3.upload(uploadParams).promise();

    // Store the video metadata in your database
    const newVideo = await Video.create({
      title: title,
      description: description,
      videoUrl: uploadResult.Location,
      thumbnail: '',
      views: 0,
      uploadDate: new Date(),
      UploaderId: userAuth0Id,
    });

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: newVideo,
      url: uploadResult.Location,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

module.exports = router;
