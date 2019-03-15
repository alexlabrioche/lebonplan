var mongoose = require("mongoose");
var json = require("./offers.json");

var mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/lebonplan";

var db = mongoose.connect(mongoUri, {
  useNewUrlParser: true
});

var getRange = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var time = new Date().getTime();
var HALF_DAY_IN_MILLISECONDS = 12 * 60 * 60 * 1000;
var THREE_DAY_IN_MILLISECONDS = HALF_DAY_IN_MILLISECONDS * 6;

json = json.map(function(offer, index) {
  time += getRange(HALF_DAY_IN_MILLISECONDS, THREE_DAY_IN_MILLISECONDS);
  var date = new Date(time);
  offer.created = date;

  offer.city = index % 2 === 0 ? "paris" : "marseille";

  return offer;
});
var offerSchema = require("./models/schemas").Offer;
var OfferModel = mongoose.model("Offer", offerSchema);

OfferModel.insertMany(json, function(err, docs) {
  if (err !== null) {
    console.log("Insert error:", err);
    mongoose.connection.close();
    return;
  }
  console.log("Imported successfully", docs.length, "offers");
  mongoose.connection.close();
});
