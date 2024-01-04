const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const nconf = require('nconf');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require('express-rate-limit');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const configureAuthentication = require('./middleware/authSession');

nconf.argv().env().file({ file: 'config.json' });

const app = express();

const limiter = RateLimit({
  windowMs: 1 * 10 * 1000,
  max: 10,
});

app.use(limiter);

mongoose.set('strictQuery', false);

const mongoDB = nconf.get('mongoDBURI');

async function connectToDB() {
  await mongoose.connect(mongoDB);
}
connectToDB().catch((err) => console.log(err));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

configureAuthentication(app);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: ["'self'"],
    },
  })
);

app.use(compression());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.log('err2');
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

console.log('Server started');

module.exports = app;
