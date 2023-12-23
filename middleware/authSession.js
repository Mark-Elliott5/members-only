const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const nconf = require('nconf');
const flash = require('connect-flash');
const User = require('../models/user');

const configureAuthentication = (app) => {
  nconf.argv().env().file({ file: 'config.json' });

  const secret = nconf.get('secret');

  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: true,
    })
  );
  app.use(flash());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());
  app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
  });
};

module.exports = configureAuthentication;
