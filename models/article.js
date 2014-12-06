var mongoose = require('mongoose');

var ArticleSchema = new mongoose.Schema({
  title: String,
  link: String,
  content: String,
  html: String,
  text: String,
  submitted: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  userId : String
});

module.exports = mongoose.model('Article', ArticleSchema);