const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (!email) {
                return done(new Error('No email found in Google profile'), null);
            }

            // Check if user already exists with this email
            user = await User.findOne({ email });
            if (user) {
                // Link the Google account to existing user
                user.googleId = profile.id;
                if (!user.picture && profile.photos && profile.photos.length > 0) {
                    user.picture = profile.photos[0].value;
                }
                await user.save();
            } else {
                // Create a new user
                user = await User.create({
                    googleId: profile.id,
                    email: email,
                    name: profile.displayName,
                    picture: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
                    role: 'EMPLOYEE' // Default role
                });
            }
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

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
