const express = require('express');
const indexController = require('../controllers/indexController');

const router = express.Router();

router.get('/', indexController.messageBoardGet);

router.get('/sign-up', indexController.signUpGet);
router.post('/sign-up', indexController.signUpPost);

router.post('/log-in', indexController.logInPost);

router.get('/log-out', indexController.logOutGet);

router.get('/add-message', indexController.addMessageGet);
router.post('/add-message', indexController.addMessagePost);

module.exports = router;
