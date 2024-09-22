# SoftServe Backend
Welcome to the backend repository for SoftServe, a video streaming platform built using Node.js, Express, and PostgreSQL. This backend serves APIs for user authentication, video management, comment handling, and other platform functionalities. It interacts with a React frontend and utilizes Cloudflare R2 for video storage.

## Table of Contents
Overview
Technologies Used
Project Structure
API Overview
Getting Started
Environment Variables
Authentication
Future Improvements

## Overview
SoftServe's backend handles video streaming, user management, commenting, and more. Key features include:

- Secure user authentication and authorization with Auth0.
- Video uploading and retrieval, including video metadata management.
- Commenting system with the ability to like, dislike, and delete comments.
- Management of user profiles, including display name updates.
- 
## Technologies Used
- *Node.js*: JavaScript runtime for building the server-side application.
- *Express*: Web framework for building RESTful APIs.
- *PostgreSQ*L: Relational database used for data storage.
- *Sequelize*: ORM for managing database models and relationships.
- *Cloudflare R2*: Storage solution for video and thumbnail files.
- *Auth0*: Authentication and authorization service.
- *AWS SDK*: For interacting with Cloudflare R2 using S3-compatible APIs.
## Project Structure
``
/backend
├── middleware/            # Middleware for authentication and other purposes
│   └── auth.js
├── models/                # Database models (User, Video, Comment)
│   ├── Comment.js
│   ├── User.js
│   ├── Video.js
│   ├── database.js        # Sequelize configuration
│   └── index.js           # Model relationships and exports
├── routes/                # API route handlers
│   ├── comments.js
│   ├── users.js
│   └── videos.js
├── .env                   # Environment variables configuration (not in repo)
├── index.js               # Entry point of the application
└── README.md              # This file
``
API Overview
This backend exposes several endpoints grouped under three main routes: /videos, /comments, and /users.

Videos API
GET /api/videos: Fetches a list of videos with optional search, pagination, and filter for favorites.
POST /api/videos/upload: Uploads a new video file with an optional thumbnail. Requires authentication.
GET /api/videos/
: Retrieves a specific video’s details, including its comments.
POST /api/videos/
/favorite: Toggles the favorite status of a video. Requires authentication.
GET /api/videos/
/comments: Retrieves comments for a specific video.
POST /api/videos/
/comments: Adds a new comment to the video. Requires authentication.
Comments API
POST /api/comments/
/like: Likes a comment.
POST /api/comments/
/dislike: Dislikes a comment.
DELETE /api/comments/
: Deletes a comment if it belongs to the authenticated user.
Users API
POST /api/users/updateProfile: Updates the user’s display name. Requires authentication.
GET /api/users/profile: Fetches the profile details of the authenticated user.
Getting Started
Prerequisites
Node.js (v16.x or higher)
PostgreSQL (configured with a connection URL)
Cloudflare R2 credentials for file storage
Installation
Clone the repository:

bash
Copy code
git clone https://github.com/your-username/softserve-backend.git
cd softserve-backend
Install dependencies:

bash
Copy code
npm install
Set up environment variables (see the section below).

Run the development server:

bash
Copy code
npm start
The backend will be available at http://localhost:5000.

Environment Variables
Create a .env file in the root of your project and configure the following:

env
Copy code
# Server Config
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Auth0 Config
AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=your-auth0-audience

# PostgreSQL Config
DATABASE_URL=your-postgres-database-url

# Cloudflare R2 Config
CLOUDFLARE_ENDPOINT=your-cloudflare-endpoint
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_BUCKET_NAME=your-bucket-name
BUCKET_URL=https://your-cloudflare-bucket-url
Authentication
Authentication is handled by Auth0, integrating seamlessly with the backend APIs through JWTs. For protected routes, enhancedCheckJwt middleware validates the token, creates a user profile if it doesn't exist, and attaches user information to the request.

Future Improvements
Microservices Architecture: Split functionalities (video, user, and comments) into separate microservices to improve scalability and fault tolerance.
CDN Integration: Use a CDN to cache video files closer to users, reducing load times and server costs.
Video Transcoding: Implement video transcoding to support various resolutions, optimizing streaming quality based on user bandwidth.
Enhanced Caching: Use Redis or other caching solutions to reduce database load, especially for frequently accessed data like popular videos.
Conclusion
The SoftServe backend prototype provides the foundation for a scalable, secure, and feature-rich video streaming platform. It addresses core functionalities like video uploading, viewing, and interaction, and offers clear pathways for future scalability and optimization.
