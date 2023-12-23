const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../models/user');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

router.get('/sign-up', (req, res) => res.render('sign-up-form'));
router.post('/sign-up', async (req, res, next) => {
  try {
    if (req.body.password.length < 8) {
      throw new Error('Password shorter than 8 characters.');
    }
    if (req.body.password.length > 512) {
      throw new Error('Passowrd longer than 32 characters.');
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

module.exports = router;
