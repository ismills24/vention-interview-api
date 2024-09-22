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

```
/backend
├── middleware/            # Middleware for authentication
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
```

## API Overview
This backend exposes several endpoints grouped under three main routes: /videos, /comments, and /users.

### API Specification
### Base URL: `/api`
### Authentication
- Most endpoints require JWT authentication. Use the `Authorization` header with a bearer token.
<hr/>

### Videos
#### 1. Get All Videos
- Endpoint: `/videos`
- Method: `GET`
- Query Parameters:
  - `page` (optional, default: 1): Page number for pagination.
  - `limit` (optional, default: 10): Number of videos per page.
  - `searchTerm` (optional): Search query for filtering videos by title.
  - `showFavorites` (optional): Set to true to show favorited videos only (requires authentication).
- Response:
  - *200 OK*: List of videos with pagination details.
```json
{
  "total": 100,
  "videos": [
    {
      "id": "1",
      "title": "Sample Video",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "views": 100,
      "isFavorite": true
    }
  ],
  "page": 1,
  "pages": 10
}
```
#### 2. Get Specific Video
- Endpoint: `/videos/:id`
- Method: `GET`
- Path Parameters:
  - `id`: Video ID.
- Response:
  - 200 OK: Details of the requested video.
```json
{
  "id": "1",
  "title": "Sample Video",
  "description": "Description of the video",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "views": 101,
  "uploadDate": "2024-09-23T10:00:00Z",
  "isFavorite": false
}
```
#### 3. Upload a Video
- Endpoint: `/videos/upload`
- Method: `POST`
- Headers:
  - `Authorization`: Bearer token (required).
- Form Data:
  - `file`: Video file (required).
  - `thumbnail`: Thumbnail image (optional).
  - `title`: Title of the video (required).
  - `description`: Description of the video (optional).
- Response:
  - 201 Created: Confirmation of the uploaded video.
```json
{
  "message": "Video uploaded successfully",
  "video": {
    "id": "1",
    "title": "Sample Video",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "views": 0
  }
}
```
#### 4. Toggle Favorite Status
- Endpoint: `/videos/:id/favorite`
- Method: `POST`
- Headers:
  - `Authorization`: Bearer token (required).
- Path Parameters:
  - `id`: Video ID.
- Response:
  - 200 OK: Status message indicating the action taken.
```json
{ "message": "Video added to favorites" }
```
### Comments
#### 1. Get Comments for a Video
- Endpoint: `/videos/:id/comments`
- Method: `GET`
- Path Parameters:
  - `id`: Video ID.
- Response:
  - 200 OK: List of comments.
```json
[
  {
    "id": "1",
    "content": "Great video!",
    "likes": 5,
    "dislikes": 0,
    "User": {
      "displayName": "JohnDoe"
    }
  }
]
```
#### 2. Add a Comment
- Endpoint: `/videos/:id/comments`
- Method: `POST`
- Headers:
  - `Authorization`: Bearer token (required).
- Path Parameters:
  - `id`: Video ID.
- Request Body:
```json
{ "content": "Your comment text" }
```
- Response:
200 OK: The created comment.
```json
{
  "id": "1",
  "content": "Your comment text",
  "displayName": "JohnDoe"
}
```
#### 3. Like a Comment
- Endpoint: /comments/:id/like
- Method: POST
- Headers:
  - Authorization: Bearer token (required).
- Path Parameters:
  - id: Comment ID.
- Response:
  - 200 OK: Updated like count.
```json
{ "likes": 6 }
```
#### 4. Dislike a Comment
- Endpoint: /comments/:id/dislike
- Method: POST
- Headers:
  - Authorization: Bearer token (required).
- Path Parameters:
  - id: Comment ID.
- Response:
  - 200 OK: Updated dislike count.
```json
{ "dislikes": 1 }
```
#### 5. Delete a Comment
- Endpoint: /comments/:id
- Method: DELETE
- Headers:
  - Authorization: Bearer token (required).
- Path Parameters:
  - id: Comment ID.
- Response:
  - 200 OK: Confirmation message.
```json
{ "message": "Comment deleted successfully" }
```
### User Profile
#### 1. Get User Profile
- Endpoint: /users/profile
- Method: GET
- Headers:
  - Authorization: Bearer token (required).
- Response:
  - 200 OK: User profile data.
```json
{ "displayName": "JohnDoe" }
```
****2. Update User Profile
- Endpoint: /users/updateProfile
- Method: POST
- Headers:
  - Authorization: Bearer token (required).
- Request Body:
```json
{ "displayName": "NewDisplayName" }
```
Response:
- 200 OK: Confirmation message with updated user details.
```json
{
  "message": "Profile updated successfully!",
  "user": {
    "displayName": "NewDisplayName"
  }
}
```
### Error Responses
- 400 Bad Request: Invalid request parameters or missing required fields.
- 401 Unauthorized: Missing or invalid authentication token.
- 403 Forbidden: Insufficient permissions for the action.
- 404 Not Found: Resource not found (e.g., video, comment).
- 500 Internal Server Error: Server error, usually due to unexpected conditions.

## Getting Started
### Prerequisites
- Node.js (v16.x or higher)
- PostgreSQL (configured with a connection URL)
- Cloudflare R2 credentials for file storage
### Installation
#### Clone the repository:

```bash
git clone https://github.com/your-username/softserve-backend.git
cd softserve-backend
```
#### Install dependencies:

```bash
npm install
```
#### Set up environment variables (see the section below).

#### Run the development server:

```bash
npm start
```
The backend will be available at http://localhost:5000.

### Environment Variables
Create a .env file in the root of your project and configure the following:

```env
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
```
### Authentication
Authentication is handled by Auth0, integrating seamlessly with the backend APIs through JWTs. For protected routes, enhancedCheckJwt middleware validates the token, creates a user profile if it doesn't exist, and attaches user information to the request.

### Future Improvements
- Microservices Architecture: Split functionalities (video, user, and comments) into separate microservices to improve scalability and fault tolerance.
- CDN Integration: Use a CDN to cache video files closer to users, reducing load times and server costs.
- Video Transcoding: Implement video transcoding to support various resolutions, optimizing streaming quality based on user bandwidth.
Enhanced Caching: Use Redis or other caching solutions to reduce database load, especially for frequently accessed data like popular videos.
### Conclusion
The SoftServe backend prototype provides the foundation for a scalable, secure, and feature-rich video streaming platform. It addresses core functionalities like video uploading, viewing, and interaction, and offers clear pathways for future scalability and optimization.
