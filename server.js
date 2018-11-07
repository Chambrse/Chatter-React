// Environment constiables
require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Authentication
const session = require("express-session");
const MongoStore = require('connect-mongo')(session);
const passport = require("passport");
const expressValidator = require("express-validator");
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const sharedsession = require("express-socket.io-session");

const PORT = process.env.PORT || 3001;

// Models
const dbConnection = require('./database');
var user = require("./database/models/user");


// Make the server
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
    app.use(express.static("client/build"));
}

// Middleware
app.use(cookieParser());
app.use(session({ secret: "keyboard cat", resave: false, store: new MongoStore({ mongooseConnection: dbConnection }), saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(expressValidator());

io.use(sharedsession(session({ secret: "keyboard cat", resave: false, store: new MongoStore({ mongooseConnection: dbConnection }), saveUninitialized: false })));

// Routes
var authRoutes = require('./routes/auth.js');
app.use('/', authRoutes);

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function (req, email, password, done) {

    user.findOne({ email: email }).then(function (results, err) {

        console.log("sequelize error", err);

        if (err) { return done(err); };

        if (!results) {
            console.log("no results from database");
            // done(null, false, req.flash('message', "Email not found."));
            done(null, false, { message: "Email not found." });
        } else {

            const returnedUser = new user(results);

            if (returnedUser.checkPassword(password)) {
                return done(null, { loggedIn: true, user: results});
            } else {
                return done(null, false, { message: 'incorrect password.'});
            }
        }
    });
}));

// Send every request to the React app
// Define any API routes before this runs
app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

server.listen(PORT, function () {
    console.log('Server listening on port: ' + PORT);
});

require("./routes/socket_functions")(io);
