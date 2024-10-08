// auth.js
const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');
const {jwtDecode} = require('jwt-decode');
const { User } = require('../models');
require('dotenv').config();

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
  credentialsRequired: true,
  getToken: (req) => {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  },
});

const enhancedCheckJwt = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      // Decode the JWT token manually because I can't get the header to attach automatically
      const decoded = jwtDecode(token);
      console.log('Manually Decoded Token:', decoded);
      req.user = req.user || decoded;

      const userAuth0Id = req.user.sub;
      const displayNameFromAuth0 = req.user.name || 'Anonymous';

      let user = await User.findOne({ where: { auth0Id: userAuth0Id } });

      // Create a new user if one does not exist
      if (!user) {
        user = await User.create({
          auth0Id: userAuth0Id,
          displayName: displayNameFromAuth0,
        });
        console.log(`Created new user for Auth0 ID: ${userAuth0Id}`);
      } else {
        if (user.displayName === 'Anonymous' && displayNameFromAuth0 !== 'Anonymous') {
          user.displayName = displayNameFromAuth0;
          await user.save();
          console.log(`Updated display name for user: ${userAuth0Id}`);
        }
      }
    } catch (error) {
      console.error('Error decoding token or handling user login:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    console.warn('No token found in the request headers.');
  }

  checkJwt(req, res, (err) => {
    if (err) {
      console.error('Error in JWT validation:', err);
      return res.status(401).json({ message: 'Invalid token', error: err });
    }
    console.log('Decoded user from JWT:', req.user);
    if (!req.user) {
      console.warn('JWT validation passed, but req.user is undefined.');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    next();
  });
};

module.exports = {
  enhancedCheckJwt,
};
