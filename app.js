// 'use strict'

const express = require('express');

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const hbs = require('hbs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const {
  check,
  validationResult
} = require('express-validator/check');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');

const db = require('./db/db')

let app = express();

app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

const options = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Mustang1',
  database: 'backend-auth'
};



const sessionStore = new MySQLStore(options);
app.use(session({
  secret: 'iwendapoiddnt',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}))
passport.use(new LocalStrategy(function(username, password, done) {
  db.query('SELECT id, password FROM users WHERE username=?', username, function(err, results, fields) {
    if (err) {
      done(err, false)
    } else if (results.length === 0) {
      done(null, false, {
        message: 'Username and password do not match.'
      })
    } else {
      const hash = results[0].password.toString();
      console.log(hash);
      // console.log(password);
      bcrypt.compare(password, hash, function(err, res) {
        console.log(res);
        if (res === true) {
          done(null, {
            user_id: results[0].id
          })
        } else {
          done(null, false)
        }
      })
    }

    // done(null, true)
  });
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

hbs.registerPartials(__dirname + '/views/partials');


app.get('/', function(req, res) {
  res.render('home', {
    title: 'I\'m starting to understand what\'s going on'
  })
});

app.get('/register', function(req, res) {
  res.render('register', {
    title: 'Register here'
  })
});

app.get('/profile', isAuthenticatedMiddleware(), function(req, res) {
  console.log(req.user);
  console.log(req.isAuthenticated());
  db.query('SELECT * FROM users WHERE id=?', req.user.user_id,

    function(err, results, fields) {
      let username = results[0].username,
        email = results[0].email

      res.render('profile', {
        title: 'This is the profile',
        user: req.user.user_id,
        username: username,
        email: email

      })
    });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/login');
});


app.post('/register', [
  check('username').isLength({
    min: 4,
    max: 45
  }).withMessage('Username must be 4-45 characters.'), check('email').isEmail().withMessage('Invalid email address.'), check('email').isLength({
    min: 6,
    max: 100
  }).withMessage('Email address must be between 4-100 characters.'),
  check('password').isLength({
    min: 8,
    max: 30
  }).withMessage('Password must be between 8-100 characters.'),
  check('username').matches(/^[a-zA-Z0-9]([a-zA-Z0-9_])+$/i).withMessage('Username can contain letters, numbers, or underscores.'), check('passwordVerify').isLength({
    min: 8,
    max: 100
  }).withMessage('Password must be between 8-100 characters long.'),
  check('passwordVerify').custom((value, {
    req
  }) => value === req.body.password).withMessage('Passwords do not match')
], (req, res) => {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    console.log(err.mapped());
    res.render('register', {
      msg: "Registration failed",
      errors: err.array()
    })
  } else {

    // console.log(req.body);
    let username = req.body.username,
      email = req.body.email,
      password = req.body.password

    bcrypt.hash(password, saltRounds, function(err, hash) {
      db.query('INSERT INTO users (username, email, password) VALUES (? , ?, ?)', [username, email, hash], function(err, results, fields) {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            res.render('register', {
              msg: "Registration failed.  See the reasons below.",
              error: "Username or email is already taken"
            })
          } else {
            res.render('register', {
              msg: "Registration failed.  See the reasons below.",
              error: "Error but not sure what it was.  Good luck."
            })
          }
          // console.log(err.code);
          // res.send('Error in registration');
          // return
        } else {
          db.query('SELECT LAST_INSERT_ID() as user', function(err, results, fields) {
            if (err) {
              res.send('There is a database issue')
            } else {
              console.log(results[0]);
              req.login(results[0], function(err) {
                res.redirect('/profile')
              })
            }
          })
          // console.log(results);
          // res.send('user added')
        }

      });
    });
  }
});

app.get('/login', function(req, res) {
  res.render('login', {
    title: 'Login here',
    message: req.flash('error')
  })
});


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  done(null, id)
});

function isAuthenticatedMiddleware() {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      next()
    } else {
      res.direct('/login')
    }
  }
}

app.listen(3000, () => {
  console.log('listening on port 3000');
});
