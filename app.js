'use strict'

const express = require('express');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const {
  check,
  validationResult
} = require('express-validator/check')

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
    title: 'Catchy title'
  })
});

app.get('/register', function(req, res) {
  res.render('register', {
    title: 'Register here'
  })
});




app.post('/register', [
  check('username').isLength({
    min: 1
  }).withMessage('Username required')
], (req, res) => {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    console.log(err.mapped());
    res.render('register', {
      title: "Registration failed",
      errors: err.array()
    })
  } else {

    console.log(req.body);
    let username = req.body.username,
      email = req.body.email,
      password = req.body.password,
      passwordVerify = req.body.passwordVerify
    db.query('INSERT INTO users (username, email, password) VALUES (? , ?, ?)', [username, email, password], function(err, results, fields) {
      if (err) {
        res.send('There was an error.');
        return
      }
      console.log(results);
      res.send('worked')
    });
  }
})

app.get('/login', function(req, res) {
  res.render('login', {
    title: 'Login here'
  })
});


app.listen(3000, () => {
  console.log('listening on port 3000');
});
