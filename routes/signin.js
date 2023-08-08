const express = require('express');
const fs = require('fs');
const router = express.Router();

router.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('signin');
    }
});

router.post('/', (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync('users.json'));

    if (users[username]) {
        if (users[username] === password) {
            req.session.user = { email: username };
            res.redirect('/home');
        } else {
            res.render('signin', { errorMessage: 'Invalid password' });
        }
    } else {
        res.render('signin', { errorMessage: 'Not a registered username' });
    }
});

module.exports = router;
