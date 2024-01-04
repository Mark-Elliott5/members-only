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
      'Username must only contain alphanumeric characters, periods, underscores, and/or hyphens.'
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
      'Password must only contain alphanumeric characters, periods, underscores, and/or hyphens.'
    )
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters in length.')
    .escape(),
];

const logInValidationFunctions = [
  body('username')
    .exists()
    .withMessage('Username required.')
    .notEmpty()
    .withMessage('Username required.')
    .escape(),
  body('password')
    .exists()
    .withMessage('Password required.')
    .notEmpty()
    .withMessage('Password required.')
    .escape(),
];

// exports.indexGet = (req, res, next) => {
//   const error = req.flash('error');
//   res.render('index', { error });
// };

exports.signUpGet = (req, res, next) => {
  const error = req.flash('error');
  res.render('sign-up-form', { error });
};

exports.signUpPost = [
  ...signUpValidationFunctions,

  asyncHandler(async (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      const errorArray = error.array();
      for (let i = 0; i < errorArray.length; i += 1) {
        req.flash('error', errorArray[i].msg);
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
          .catch((err1) => next(err1));
      }
    });
  }),
];

exports.logInPost = [
  ...logInValidationFunctions,

  (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      const errorArray = error.array();
      for (let i = 0; i < errorArray.length; i += 1) {
        req.flash('error', errorArray[i].msg);
      }
      return res.redirect(req.header('Referer'));
    }
    req.flash('success', 'logged in');
    next();
  },

  passport.authenticate('local', {
    successRedirect: '/',
    successFlash: 'Login Successful!',
    failureRedirect: '/',
    failureFlash: 'Username or password incorrect.',
  }),
];

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
  const error = req.flash('error');
  const success = req.flash('success');
  console.log(success);
  res.render('messageboard', {
    messages,
    currentUser: req.user || null,
    formatDate: formatDistanceToNow,
    error,
    success,
  });
});

exports.addMessageGet = (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You must be logged in to add a message.');
    return res.redirect('/');
  }
  const error = req.flash('error');
  res.render('addmessage', { error });
};

exports.addMessagePost = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    req.flash('error', 'You must be logged in to add a message.');
    return res.redirect('/');
  }
  const currentTime = new Date();
  const filteredText = req.body.text ? filter.clean(req.body.text) : '';
  const user = req.user.username;
  if (filteredText === '') {
    req.flash('error', 'Text cannot be blank.');
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
