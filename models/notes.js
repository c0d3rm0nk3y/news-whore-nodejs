var mongoose = require('mongoose');

var NotesSchema = new mongoose.Schema({
  content: String,
  created: { type: Date, default: Date.now },
  searchId: String,
  articleId : String,
  userId : String
});

module.exports = mongoose.model('Notes', NotesSchema);