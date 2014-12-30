var mongoose = require('mongoose');

var ArticleSchema = new mongoose.Schema({
  title: String,
  link: String,
  content: String,
  html: String,
  published: Date,
  text: String,
  submitted: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  searchId : String,
  userId : String
});

module.exports = mongoose.model('Article', ArticleSchema);