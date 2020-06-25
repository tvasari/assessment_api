const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const rateLimit = require("express-rate-limit");

const register = require('./controllers/register.js');
const signin = require('./controllers/signin.js');
const profile = require('./controllers/profile.js');


const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'test',
    database : 'assessmentdb'
  }
});

const signinLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: JSON.stringify("Tentativi esauriti, riprova tra 1 minuto.")
});

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors());
app.use("/signin", signinLimiter);

app.get('/', (req, res) => {res.json('It is working!');})
app.get('/confirmation/:token', (req, res) => {
  jwt.verify(req.params.token, 'secret4algorithm', (err, verifiedJwt) => {
    if (err) {
      res.send(err.message)
    } else {
      db('login').where('email', '=', verifiedJwt.user).update({confirmed: true}).then(user => res.send(user));
    }
    return res.redirect('http://localhost:3000/signin');
  }); 
})
app.get('/content', (req, res) => {
  db('content').select('*').then(response => res.json(response));
})
app.post('/postcontent', (req, res) => {
  db.transaction(trx => {
    trx.insert({
      tipo: req.body.tipo,
      contenuto: req.body.contenuto
    })
    .into('content')
    .returning('content')
    .then(response => res.json(response))
    .then(trx.commit)
    .catch(trx.rollback)
  })
})
app.post('/signin', (req, res) => { signin.handleSignIn(req, res, db, bcrypt) })
app.post('/register', (req, res) => { register.handleRegister(req, res, db, bcrypt, jwt, nodemailer) }) //dependency injection
app.get('/profile/:id', (req, res) => { profile.handleProfile(req, res, db) }) //cancella?

app.listen(process.env.PORT || 3001, () => {
	console.log(`app is running on port ${process.env.PORT}`)
})