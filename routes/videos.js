const express = require('express');
const router = express.Router();
const { Video, User, Comment } = require('../models');
const { enhancedCheckJwt } = require('../middleware/auth');
const { Op } = require('sequelize');
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');

/* -- Configuration -- */

const UPLOAD_SIZE_LIMIT_MB = 300;

// Middleware to 'optionally' check authentication
const optionalCheckJwt = (req, res, next) => {
  if (req.headers.authorization) {
    enhancedCheckJwt(req, res, next);
  } else {
    next();
  }
};

// Configure AWS SDK to use Cloudflare R2
const s3 = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

// multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: UPLOAD_SIZE_LIMIT_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /mp4|mkv|webm|jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed!'));
    }
  },
});

/* -- Endpoints -- */

// Generic endpoint to get all videos, can include search query or filter to only show favorites
router.get('/', optionalCheckJwt, async (req, res) => {
  const { page = 1, limit = 10, searchTerm = '', showFavorites = false } = req.query;
  const userAuth0Id = req.user?.sub;
  try {
    if (showFavorites === 'true' && userAuth0Id) {
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

      // Return all favorited videos, ignore pagination
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
    
    let whereClause = searchTerm.trim() 
      ? { title: { [Op.iLike]: `%${searchTerm.toLowerCase()}%` } } 
      : {};

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

// Endpoint for getting a specific video by id - Publicly Accessible
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

// Endpoint to toggle favorite status for a specific video - Requires Authentication
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

// Endpoint to add a comment - Requires Authentication
router.post('/:id/comments', enhancedCheckJwt, async (req, res) => {
  try {
    // Extract Auth0 user ID from JWT
    const userAuth0Id = req.user.sub;
    const { content } = req.body; // Extract the comment content from the request body

    // Find the video by its ID
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Create a new comment and associate it directly with the user's auth0Id and the video
    const comment = await Comment.create({
      content,
      UserAuth0Id: userAuth0Id, // Set the UserAuth0Id directly to link the comment to the authenticated user
      VideoId: video.id,
    });

    // Fetch the displayName from the User model using auth0Id to display the comment author correctly
    const user = await User.findOne({ where: { auth0Id: userAuth0Id } });
    const displayName = user ? user.displayName : 'Anonymous';

    // Send the comment back along with the user's displayName
    res.json({ ...comment.toJSON(), displayName });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for getting comments for a specific video by id - Publicly Accessible
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

// Endpoint for uploading a video and thumbnail - Requires Authentication
router.post('/upload', enhancedCheckJwt, upload.fields([{ name: 'file' }, { name: 'thumbnail' }]), async (req, res) => {
  const { originalname, buffer } = req.files.file[0];
  const { buffer: thumbnailBuffer } = req.files.thumbnail[0]; // Thumbnail file
  const userAuth0Id = req.user.sub;
  const { title, description } = req.body;

  try {
    // Define the S3 upload parameters for video
    const videoUploadParams = {
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: `videos/${Date.now()}_${originalname}`,
      Body: buffer,
      ContentType: req.files.file[0].mimetype,
      ACL: 'public-read',
    };

    // Define the S3 upload parameters for thumbnail
    const thumbnailUploadParams = {
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: `thumbnails/${Date.now()}_thumbnail.jpg`,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    };

    // Upload the video and thumbnail to R2
    const [videoUploadResult, thumbnailUploadResult] = await Promise.all([
      s3.upload(videoUploadParams).promise(),
      s3.upload(thumbnailUploadParams).promise(),
    ]);

    // Store the video metadata in your database
    const newVideo = await Video.create({
      title,
      description,
      videoUrl: `${process.env.BUCKET_URL}/${videoUploadResult.Key}`,
      thumbnail: `${process.env.BUCKET_URL}/${thumbnailUploadResult.Key}`,
      views: 0,
      uploadDate: new Date(),
      UploaderId: userAuth0Id,
    });

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: newVideo,
      url: videoUploadResult.Location,
      thumbnailUrl: thumbnailUploadResult.Location,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

module.exports = router;
