var mongoose = require("mongoose");

module.exports = {
  id: {
    type: Number,
    index: true
  },
  title: String,
  price: Number,
  description: String,
  images: [String],
  city: {
    type: String,
    index: true
  },
  criteria: {
    genre: String,
    shoesize: String,
    year: String,
    kilometers: String
  },
  created: {
    type: Date,
    default: Date.now
  }
};
