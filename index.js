//npm Require
var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var expressSession = require("express-session");
var MongoStore = require("connect-mongo")(expressSession);
var mongoose = require("mongoose");
var passport = require("passport");
var expValChecker = require("express-validator/check");
var bodyParser = require("body-parser");
var multer = require('multer');
var fs = require('fs');
var LocalStrategy = require("passport-local");
//npm local require
var offersRoutes = require('./routes/offers');
var citiesRoutes = require('./routes/cities');
var OfferModel = require('./models').Offer;
var upload = multer({ dest: 'public/uploads/' });
var User = require("./models").User; // same as: var User = require('./models/user');
var port = process.env.PORT || 3000;
var app = express();
var check = expValChecker.check; // get references to the 2 validation functions
var validationResult = expValChecker.validationResult;


//initialise app
mongoose.connect(
    process.env.MONGODB_URI ||
      "mongodb://localhost:27017/lebonplan",
    {
      useNewUrlParser: true,
      useCreateIndex: true
    }
  );
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use('/offers', offersRoutes);
app.use('/cities', citiesRoutes);

// enable session management
app.use(
    expressSession({
        secret: "konexioasso07",
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({ mongooseConnection: mongoose.connection })
    })
);
// enable Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); // JSON.stringify
passport.deserializeUser(User.deserializeUser()); // JSON.parse


//Scripts&stylesheets
var stylesheets = [
    {
        href: "https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css",
        integrity: "sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
    },
    {
        href: "https://fonts.googleapis.com/css?family=Nova+Mono|Open+Sans:300,400,600",
    },
    {
        href: "/css/styles.css"
    }
];
var scripts = [
    {
        src: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"
    },
    {
        src: "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.6/umd/popper.min.js",
        integrity: "sha384-wHAiFfRlMFy6i5SRaxvfOCifBUQy1xHdJ/yoi7FRNXMRBu5WHdZYu1hA6ZOblgut",
        crossorigin: "anonymous",
    },
    {
        src: "https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/js/bootstrap.min.js",
        integrity: "sha384-B0UglyR+jN6CkvvICOB2joaf5I4l3gm9GU6Hc1og6Ls7i6U/mkkaduKaBhlAXv9k",
        crossorigin: "anonymous",
    },
    {
        src: "/js/main.js"
    }
];

//Functions 
function getDateInFrench(str) {
    var date = new Date(str)
    var day = date.getDate();
    var month = parseInt(date.getMonth()) + 1;
    if (month < 10) {
        month = "0" + month;
    };
    var year = date.getFullYear();
    var hours = date.getHours();
    if (hours < 10) {
        hours = "0" + hours;
    };
    var mins = date.getMinutes();
    if (mins < 10) {
        mins = "0" + mins;
    };
    return day + '/' + month + '/' + year + ' à ' + hours + ':' + mins
  };

//homePage
app.get('/', function(req, res) {
    console.log('isauth?',req.isAuthenticated())
    var authenticated = req.isAuthenticated();
    var user = req.user;
    res.render('home', {
        stylesheets: stylesheets,
        scripts: scripts,
        authenticated: authenticated,
        user: user
    })
});

//Sign-up
app.get('/signup', function(req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/profile");
    } else {
        res.render('signup', {
            stylesheets: stylesheets,
            scripts: scripts
        });
    };
});
app.post('/signup', [
    check('email').isEmail(),
    check('password').isLength({ min: 8 })
    ], function(req, res) { // recupère les infos du sign-up, valide le mail et le mot de passe
        var errors = validationResult(req);
        // console.log('errors array', errors.array()[0].msg);
        if (!errors.isEmpty()) {
            return res.render('signup', {
                stylesheets: stylesheets,
                scripts: scripts,
                errors: errors.array()[0].msg
            });
        } else {
            // console.log('sign-up');
            User.register( // défini un nouvel utilisateur dans la base de donnée
                new User({ 
                    username: req.body.username,
                    email: req.body.email,
                    password: req.body.pasword,
                    confirm: req.body.confirm
                }),
                password, // hash le mot de passe
                function(err, user) {
                    if (err) {
                        console.log('Sign Up error: ', err);
                    } else {
                        console.log('sign up details', user);
                        if (user.password != user.confirm) {
                            console.log('wrong confirmation password');
                            return res.render('/signup');
                        } else {
                            passport.authenticate("local")(req, res, function() {
                                res.redirect("/profile")
                            });
                        };
                    };
                });
        };
});
//Login
app.get('/login', function(req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/profile");
    } else {
        res.render('login', {
            stylesheets: stylesheets,
            scripts: scripts
        });
    };
});
app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/"
    })
);
//Profile page
app.get('/profile', function(req, res) {
    var user = req.user;
    var authenticated = req.isAuthenticated();
    // console.log(user.username)
    res.render('profile', {
        stylesheets: stylesheets,
        scripts: scripts,
        user: user,
        authenticated: authenticated
        
    });
});
//Logout
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});




app.get('/add/favorites/:offerId', function(req, res) {
    var offerId = req.params.offerId
    console.log(offerId)
    res.json({
        isFavorite: true
    })
});
app.get('/remove/favorites/:offerId', function(req, res) {
    var offerId = req.params.offerId
    res.json({
        isFavorite: false
    })
});


//errorPage
app.get('/*', function(req, res) {
    res.render('e404', {
        stylesheets: stylesheets,
        scripts: scripts
    })
});
//listenPort
app.listen(port, function(req, res) {
    console.log('server Started on port: ', port)
});




// Du dossier Workspace
// mongod --dbpath=db/data

// Du dossier CSS
// sass --watch in out