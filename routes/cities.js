var express = require('express');
var router = express.Router();
var OfferModel = require('../models').Offer;

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


router.get('/:city', function(req, res) {
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

module.exports = router;