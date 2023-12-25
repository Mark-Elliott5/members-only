const bcrypt = require('bcrypt');
const passport = require('passport');
const { formatDistanceToNow } = require('date-fns');
const Filter = require('bad-words');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const User = require('../models/user');
const Message = require('../models/message');

const filter = new Filter();

const signUpValidationFunctions = [
  body('username')
    .exists()
    .notEmpty()
    .withMessage('Username must not be empty.')
    .isString()
    .withMessage('Username must be a string')
    .not()
    .contains(/\s/)
    .withMessage('Username must not contain whitespace characters.')
    .trim()
    .matches(/^[a-zA-Z0-9\-._]+$/)
    .withMessage(
      'Username must only contain alphanumeric characters, periods, underscores, and/or hyphens'
    )
    .isLength({ min: 1, max: 100 })
    .withMessage('Username must be 1-100 characters in length.')
    .escape(),
  body('password')
    .exists()
    .notEmpty()
    .withMessage('Password must not be empty.')
    .isString()
    .withMessage('Password must be a string')
    .not()
    .contains(/\s/)
    .withMessage('Password must not contain whitespace characters.')
    .trim()
    .matches(/^[a-zA-Z0-9\-._]+$/)
    .withMessage(
      'Password must only contain alphanumeric characters, periods, underscores, and/or hyphens'
    )
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters in length.')
    .escape(),
];

// const errors = validationResult(req);

exports.indexGet = (req, res, next) => {
  const errors = req.flash('errors');
  res.render('index', { errors });
};

exports.signUpGet = (req, res, next) => {
  const errors = req.flash('errors');
  res.render('sign-up-form', { errors });
};

exports.signUpPost = [
  ...signUpValidationFunctions,

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorArray = errors.array();
      for (let i = 0; i < errorArray.length; i += 1) {
        req.flash('errors', errorArray[i].msg);
      }
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
        await user
          .save()
          .then(() => res.redirect('/'))
          .catch((error) => next(error));
      }
    });
  }),
];

exports.logInPost = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/',
});

exports.logOutGet = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};

exports.messageBoardGet = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({}).sort({ date: 1 }).exec();
  const errors = req.flash('errors');
  res.render('messageboard', {
    messages,
    currentUser: req.user || null,
    formatDate: formatDistanceToNow,
    errors,
  });
});

exports.addMessageGet = (req, res, next) => {
  if (!req.user) {
    req.flash('errors', 'You must be logged in to add a message.');
    return res.redirect('/');
  }
  const errors = req.flash('errors');
  res.render('addmessage', { errors });
};

exports.addMessagePost = asyncHandler(async (req, res, next) => {
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
  await newMessage
    .save()
    .then(() => res.redirect('/'))
    .catch((error) => next(error));
});
