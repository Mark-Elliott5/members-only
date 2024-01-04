const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const nconf = require('nconf');
const mongoose = require('mongoose');
const compression = require('compression');
const helmet = require('helmet');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const configureAuthentication = require('./middleware/authSession');

nconf.argv().env().file({ file: 'config.json' });

const app = express();

// // Set up rate limiter: maximum of twenty requests per minute
// const RateLimit = require('express-rate-limit');

// const limiter = RateLimit({
//   windowMs: 1 * 10 * 1000, // 10 seconds
//   max: 10,
// });
// Apply rate limiter to all requests
// app.use(limiter);

// const categoryRouter = require('./routes/categories');
// const productsRouter = require('./routes/products');

mongoose.set('strictQuery', false);

const mongoDB = nconf.get('mongoDBURI');

async function connectToDB() {
  await mongoose.connect(mongoDB);
}
connectToDB().catch((err) => console.log(err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

configureAuthentication(app);
// app.use((req, res, next) => {
//   res.locals.currentUser = req.user;
//   next();
// });

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      scriptSrc: ["'self'", "'/scripts/'", "'localhost'"],
    },
  })
);

app.use(compression()); // Compress all routes

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  console.log('404');
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  console.log('err2');
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

console.log('Server started');

module.exports = app;
