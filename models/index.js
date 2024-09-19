const sequelize = require('./database');
const User = require('./User');
const Video = require('./Video');
const Comment = require('./Comment');

// Define Associations
User.belongsToMany(Video, { through: 'UserLikes', as: 'LikedVideos' });
Video.belongsToMany(User, { through: 'UserLikes', as: 'Likes' });

User.hasMany(Comment);
Comment.belongsTo(User);

Video.hasMany(Comment);
Comment.belongsTo(Video);

User.belongsToMany(Video, { through: 'UserFavorites', as: 'FavoritedVideos' });
Video.belongsToMany(User, { through: 'UserFavorites', as: 'FavoritedByUsers' });

module.exports = {
  sequelize,
  User,
  Video,
  Comment,
};
