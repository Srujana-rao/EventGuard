const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./models/User');

// Generates a unique username by appending random digits if the base name is taken
async function generateUniqueUsername(baseName) {
  let username = baseName;
  let attempt = 0;

  while (await User.findOne({ username })) {
    attempt += 1;
    const suffix = crypto.randomInt(1000, 9999);
    username = `${baseName}${suffix}`;
    if (attempt > 10) {
      // extremely unlikely fallback — guarantees uniqueness
      username = `${baseName}${Date.now()}`;
      break;
    }
  }

  return username;
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });

      if (!user) {
        const randomPassword = crypto.randomBytes(20).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        const uniqueUsername = await generateUniqueUsername(profile.displayName);

        user = new User({
          username: uniqueUsername,
          email,
          password: hashedPassword,
          role: 'ground',
          isApproved: false
        });
        await user.save();
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;