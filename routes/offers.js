var express = require('express');
var router = express.Router();
var OfferModel = require('../models').Offer;
var multer = require('multer');
var upload = multer({ dest: 'public/uploads/' });
var fs = require('fs');
var User = require("../models").User; // same as: var User = require('./models/user');
var mongoose = require("mongoose");

mongoose.connect(
    process.env.MONGODB_URI ||
      "mongodb://localhost:27017/lebonplan",
    {
      useNewUrlParser: true,
      useCreateIndex: true
    }
  );


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


//Submit new offer 
router.get("/submit", function(req, res) {
    res.render('submit-offer', {
        stylesheets: stylesheets,
        scripts: scripts
    })
});

router.post('/submit', upload.single('image'), function(req, res) {
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
                        id: 1468,
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

router.get('/:id', function(req, res) {
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

module.exports = router;