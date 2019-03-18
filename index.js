var express = require('express');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var expressSession = require("express-session");
var MongoStore = require("connect-mongo")(expressSession);
var mongoose = require("mongoose");
var passport = require("passport");
var OfferModel = require('./models').Offer;
var bodyParser = require("body-parser");
var multer = require('multer');
var upload = multer({ dest: 'public/uploads/' });
var fs = require('fs');
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var User = require("./models").User; // same as: var User = require('./models/user');
var port = process.env.PORT || 3000;
var app = express();

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
app.post('/signup', function(req, res) { // recupère les infos du sign-up
    console.log('sign-up')
    var password = req.body.password;
    User.register( 
        new User({ // défini un nouvel utilisateur dans la base de donnée
            username: req.body.username,
            password: req.body.pasword,
            confirm: req.body.confirm
        }),
        password, // hash le mot de passe
        function(err, user) {
            if (err) {
                console.log('Sign Up error: ', err);
            } else {
                console.log(user)
                var pwdRegex = /^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+){8}$/;
                var foundPwd = password.match(pwdRegex);
                // var mailRegex = /^[^\W][a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*\@[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*\.[a-zA-Z]{2,4}$/;
                // var foundMail = user.email.match(mailRegex);
                if (foundPwd === null) {
                    console.log('password too short');
                    return res.render('/signup');
                }
                // if (foundMail === null) {
                //     console.log('invalid email');
                //     return res.render('/signup');
                // }
                if (user.password != user.confirm) {
                    console.log('wrong confirmation password');
                    return res.render('/signup');
                } else {
                    passport.authenticate("local")(req, res, function() {
                        res.redirect("/profile")
                    })
                };
            };
        }
    );
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


//Submit new offer 
app.get("/submit", function(req, res) {
    res.render('submit-offer', {
        stylesheets: stylesheets,
        scripts: scripts
    })
});

app.post('/submit', upload.single('image'), function(req, res) {
    // console.log('submit request file', req.file);
    var id = 303;
    fs.rename(
        req.file.path,
        "public/uploads/" + req.file.filename + ".jpg",
        function(err) {
            if (err) { console.log("Writing error", err) }
            User.
                findOne({id: id}, function(err, user) {
                    if (err) return handleError(err);
                    console.log('populateUser',user)
                    var city =  req.body.city
                    var newOffer = new OfferModel({
                        user: new mongoose.Types.ObjectId(user._id),
                        id: 1466,
                        title: req.body.title,
                        description: req.body.description,
                        images: "/uploads/" + req.file.filename + ".jpg",
                        price: req.body.price,
                        city: city.toLowerCase()
                    });
                    console.log('new offer', newOffer)
                    newOffer.save(function(err, offer) {
                        if (err) { console.log(err) }
                        else {
                            console.log('user saved with success', offer);
                            res.render('success', {
                                stylesheets: stylesheets,
                                scripts: scripts
                            });
                        };
                    });
                });
        });
});








//citiesListPage
app.get('/cities/:city', function(req, res) {
    var city = req.params.city;
    var currentPage = req.query.page; // defini la page courante .query recupere une variable "?clé:valeur" dans la route
    var itemsPerPages = 5; 
    var authenticated = req.isAuthenticated();
    var skip = ((currentPage - 1) * itemsPerPages); // pour passer le nombre d'items désiré.
    OfferModel.find({city: city}, null, {limit: 5, skip: skip}, function(err, offers) {
        var listedOffers = offers.map(function(offer) {
            return {
                title: offer.title,
                id: offer.id,
                price: offer.price,
                date: getDateInFrench(offer.created),
                thumbnail: offer.images[0],
                criteria: offer.criteria
            };
        });
        var totalOffers = listedOffers.length;
        var totalPages = Math.ceil(totalOffers / itemsPerPages);
        res.render('offers', {
            stylesheets: stylesheets,
            scripts: scripts,
            offers: listedOffers,
            city: city,
            authenticated: authenticated
            }
        );
    });
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

//offerPage
app.get('/offers/:id', function(req, res) {
    var id = req.params.id;
    var authenticated = req.isAuthenticated();
    OfferModel.
        findOne({id: id}).
        populate('user').
        exec(function(err, offer) {
            if (err) return handleError(err);
            console.log(offer.user.firstName);
            var images = offer.images.map(function(image, index) {
                return {
                    isActive: index === 0,
                    image: image
                }
            })
            res.render('offer', {
                stylesheets: stylesheets,
                scripts: scripts,
                offer: offer,
                date: getDateInFrench(offer.created),
                images, images,
                authenticated: authenticated
            
            });
        });
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