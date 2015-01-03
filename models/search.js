var mongoose = require('mongoose');

var SearchSchema = new mongoose.Schema({
  keywords  : String,
  submitted : Date,
  userId    : String,
  state     : String,
  status    : String
});

module.exports = mongoose.model('Search', SearchSchema);

/*
  state: this field will be used in conjunction with polling from the client
         available states are created|running|finished
         
  status: string detailing status while running (eg: processing 5:100)
*/