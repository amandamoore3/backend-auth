'use strict'

const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const {
  check,
  validationResult
} = require('express-validator/check');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const db = require('./db/db')

let app = express();

app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({
  extended: false
}));
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

app.get('/profile', function(req, res) {
  res.render('profile', {
    title: 'This is the profile'
  })
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

    console.log(req.body);
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
          console.log(results);
          res.send('user added')
        }

      });
    });
  }
})

app.get('/login', function(req, res) {
  res.render('login', {
    title: 'Login here'
  })
});

app.post('/login', [
  check('username').isLength({
    min: 4,
    max: 45
  }).withMessage('Username must be 4-45 characters.'), check('email').isEmail().withMessage('Invalid email address.'), check('email').isLength({
    min: 6,
    max: 100
  }).withMessage('Email address must be between 4-100 characters.'), check('password').isLength({
    min: 8,
    max: 30
  }).withMessage('Password must be between 8-100 characters.'),
], (req, res) => {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    console.log(err.mapped());
    res.render('login', {
      title: "login failed",
      errors: err.array()
    })
  } else {

    console.log(req.body);
    let username = req.body.username,
      password = req.body.password
    db.query('INSERT INTO users (username, email, password) VALUES (? , ?, ?)', [username, email, password], function(err, results, fields) {
      if (err) {
        res.send('There was a login error.');
        return
      }
      console.log(results);
      res.send('logged in successfully!')
    });
  }
})



app.listen(3000, () => {
  console.log('listening on port 3000');
});
