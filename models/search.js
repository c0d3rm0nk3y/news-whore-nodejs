var mongoose = require('mongoose');

var SearchSchema = new mongoose.Schema({
  keywords: String,
  submitted: { type: Date, default: Date.now },
  userId : String
});

module.exports = mongoose.model('Search', SearchSchema);