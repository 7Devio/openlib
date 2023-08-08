/* Vitor Ferreira Gomes | Id: 157963190 */
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const path = require('path');
const fs = require('fs');
const exphbs = require('express-handlebars');
const session = require('express-session');
const randomstring = require('randomstring');
const databaseName = 'S2023_vferreira-gomes';
const databaseUrl = 'mongodb+srv://dbUser:dbuser123!@senecaweb.qyntmkx.mongodb.net/S2023_vferreira-gomes/';
const signinRoutes = require('./routes/signin');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: randomstring.generate(),
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 180000 } // 3 minutes
}));

app.engine('.hbs', exphbs.engine({
  extname: '.hbs', 
  defaultLayout: "main",
  partialsDir: path.join(__dirname, 'views/partials')
}));

app.set('view engine', 'hbs');

app.get('/', (req, res) => {
  if (!req.session.user) {
    res.render('landing');
  } else {
    res.render('home');
  }
});

app.get('/home', async (req, res) => {
  if (req.session.user) {
    const mongoClient = await MongoClient.connect(
        databaseUrl);
    const db = await mongoClient.db(databaseName);
    const books = await db.collection('books').find().toArray((err, books) => {
      if (err) throw err;
      return books;
    });
    
    const client = await db.collection('clients').findOne({Username: req.session.user.email}, (err, client) => {
        if (err) throw err;
        return client;
    });
    const userbooks = books.filter(book => client.IDBooksBorrowed.includes(book.ID));

          res.locals.script = `
            const borrowCheckboxes = document.querySelectorAll('.borrowBook');
            const returnCheckboxes = document.querySelectorAll('.returnBook');
            const borrowBtn = document.getElementById('borrowBtn');
            const returnBtn = document.getElementById('returnBtn');

            function checkBorrowSelection() {
              let checked = [...borrowCheckboxes].some(checkbox => checkbox.checked);
              borrowBtn.disabled = !checked;
            }

            function checkReturnSelection() {
              let checked = [...returnCheckboxes].some(checkbox => checkbox.checked);
              returnBtn.disabled = !checked;
            }

            borrowCheckboxes.forEach(checkbox => {
              checkbox.addEventListener('change', checkBorrowSelection);
            });

            returnCheckboxes.forEach(checkbox => {
              checkbox.addEventListener('change', checkReturnSelection);
            });
          `;

    res.render('home', {email: req.session.user.email, books: books, userbooks: userbooks});
  } else {
    res.redirect('/');
  }
});



app.get('/signout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      throw err;
    } 
    res.redirect('/');
  });
});

app.use('/signin', signinRoutes);

app.post('/borrow', async(req, res) => {
  if (req.session.user) {
    const mongoClient = await MongoClient.connect(databaseUrl);
    const db = await mongoClient.db(databaseName);
    const client = await db.collection('clients').findOne({Username: req.session.user.email});

    if (req.body) {
      const bookIDs = Object.values(req.body);
      for (let i = 0; i < bookIDs.length; i++) {
        let bookID = parseInt(bookIDs[i]);

        const book = await db.collection('books').findOne({ID: bookID});
        
        if (book && book.Available) {
          await db.collection('books').updateOne({ID: bookID}, {$set: {Available: false}});
          await db.collection('clients').updateOne({Username: req.session.user.email}, {$push: {IDBooksBorrowed: bookID}});
        } else {
          res.send("Book not available for borrowing");
          return;
        }
      }
      res.redirect('/home'); // Redirect user to home page after successful borrowing
    } else {
      res.send("No book selected for borrowing");
    }
  } else {
    res.redirect('/');
  }
});


app.post('/return', async(req, res) => {
  if (req.session.user) {
    const mongoClient = await MongoClient.connect(databaseUrl);
    const db = await mongoClient.db(databaseName);

    if (req.body) {
      const bookIDs = Object.values(req.body);
      for (let i = 0; i < bookIDs.length; i++) {
        let bookID = parseInt(bookIDs[i]);

        const book = await db.collection('books').findOne({ID: bookID});
        if (book && !book.Available) {
          await db.collection('books').updateOne({ID: bookID}, {$set: {Available: true}});
          await db.collection('clients').updateOne({Username: req.session.user.email}, {$pull: {IDBooksBorrowed: bookID}});
        } else {
          res.send("Book not available for returning");
          return;
        }
      }
      res.redirect('/home'); // Redirect user to home page after successful return
    } else {
      res.send("No book selected for returning");
    }
  } else {
    res.redirect('/');
  }
});


app.get('/signout', (req, res) => {
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
