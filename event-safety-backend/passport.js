const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Adjust path if necessary

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract email from profile
      const email = profile.emails[0].value;
      // Find user by email
      let user = await User.findOne({ email });

      if (!user) {
        // Create new user (auto-approved)
        user = new User({
          username: profile.displayName,
          email,
          password: '', // No password set for OAuth users
          role: 'ground',
          isApproved: true
        });
        await user.save();
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

module.exports = passport;
