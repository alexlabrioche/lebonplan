var mongoose = require("mongoose");

module.exports = {
  offerId: {
      type: Number,
      index: true
  },
  isActive: {
      type: Boolean
  }
};
