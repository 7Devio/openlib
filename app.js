/* Vitor Ferreira Gomes | Id: 157963190 */
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const exphbs = require('express-handlebars');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.engine('.hbs', exphbs.engine({ extname: '.hbs', defaultLayout: "main"}));
app.set('view engine', 'hbs');

app.get('/', (req, res) => {
  res.render('landing');
});

app.get('/signin', (req, res) => {
  res.render('signin');
});

app.post('/signin', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync('users.json'));
  
  if (users[username]) {
    if (users[username] === password) {
      res.render('home', { email: username });
    } else {
      res.render('signin', { errorMessage: 'Invalid password' });
    }
  } else {
    res.render('signin', { errorMessage: 'Not a registered username' });
  }
});

app.post('/borrow', (req, res) => {
  const bookNames = {
    "1": "How to cook for Dummies",
    "2": "The History of Spain",
    "3": "Canadian Economics 101",
    "4": "A Guide to Gardening",
    "5": "Understanding Astrophysics",
    "6": "Learning to Blend: A Blender guide",
    "7": "The World of Philosophy",
    "8": "Secrets of a Happy Life",
    "9": "Modern Architecture Explained",
    "10": "Mastering the Art of Negotiation"
  };

  const borrowedBooks = [];

  for (let key in req.body) {
    const bookId = req.body[key];
    if (bookNames.hasOwnProperty(bookId)) {
      borrowedBooks.push(bookNames[bookId]);
    }
  }

  const message = borrowedBooks.length > 0
    ? `You borrowed ${borrowedBooks.join(", ")}.`
    : "No books were selected.";

  res.render('borrowed', { message });
});


// signout
app.get('/signout', (req, res) => {
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
