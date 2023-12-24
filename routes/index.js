const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { formatDistanceToNow } = require('date-fns');
const Filter = require('bad-words');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const Message = require('../models/message');

const router = express.Router();

const filter = new Filter();

/* GET home page. */
router.get('/', (req, res, next) => {
  const errors = req.flash('errors');
  res.render('index', { errors });
});

router.get('/sign-up', (req, res) => {
  const errors = req.flash('errors');
  res.render('sign-up-form', { errors });
});
router.post('/sign-up', async (req, res, next) => {
  try {
    if (req.body.password.length < 8) {
      req.flash('errors', 'Password must not be shorter than 8 characters.');
      return res.redirect('/sign-up');
    }
    if (req.body.password.length > 128) {
      req.flash('errors', 'Password must not be longer than 128 characters.');
      return res.redirect('/sign-up');
    }
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) {
        res.redirect('/sign-up');
      } else {
        const user = new User({
          username: req.body.username,
          password: hashedPassword,
        });
        await user.save();
        res.redirect('/');
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/log-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/',
  })
);

router.get('/log-out', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

router.get(
  '/message-board',
  asyncHandler(async (req, res, next) => {
    const messages = await Message.find({}).sort({ date: 1 }).exec();
    const errors = req.flash('errors');
    res.render('messageboard', {
      messages,
      currentUser: req.user || null,
      formatDate: formatDistanceToNow,
      errors,
    });
  })
);

router.get('/add-message', (req, res, next) => {
  if (!req.user) {
    req.flash('errors', 'You must be logged in to add a message.');
    return res.redirect('/');
  }
  const errors = req.flash('errors');
  res.render('addmessage', { errors });
});

router.post('/add-message', async (req, res, next) => {
  if (!req.user) {
    req.flash('errors', 'You must be logged in to add a message.');
    return res.redirect('/');
  }
  const currentTime = new Date();
  const filteredText = req.body.text ? filter.clean(req.body.text) : '';
  const user = req.user.username;
  if (filteredText === '') {
    req.flash('errors', 'Text cannot be blank.');
    return res.redirect('/add-message');
  }
  const newMessage = new Message({
    content: filteredText,
    user,
    date: currentTime,
  });
  await newMessage.save();
  res.redirect('/');
});

module.exports = router;
