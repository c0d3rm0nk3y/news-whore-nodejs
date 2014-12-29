var Article = require('../models/article');
var newswhore = require('./newswhore');

// Create endpoint /api/articles for POSTS
exports.postArticles = function(req, res) {  
  console.log('postArticles()..');
  var link = req.body.link;
  var uId = req.user._id;
  // check if article exists
  Article.findOne({ userId: uId, link: link }, function(err, foundArt) {
    if(err) { // not found or otheris
      res.send(err);
      // run article through the wash..
      
    } else {  // found
      if(foundArt !== null) {
        res.json({message: 'article already submitted', data: foundArt});
      } else {
        newswhore.buildAndSaveArticle(link, uId).then(
          function(result) {
            res.json(result);
          }, function(err) {
            res.send(err);
          }
        );
      }
    }
  });
};

// Create endpoint /api/articles for GET
exports.getArticles = function(req, res) {
  // add in sort, maybe?
  console.log('getArticles().. filter: ', req.query.filter);
  var filter = req.query.filter;
  
  if(filter !== undefined)
    filter = filter.replace('+', ' ');
    Article.find({userId: req.user._id}, filter , function(err, artsFnd) {
      if(err) { res.send(err); }
      else {
        res.json(artsFnd);
      }
  });
};

// Create endpoint /api/articles/:article_id for GET
exports.getArticle = function(req, res) { 
  console.log('getArticle():article_id');
  Article.find({ userId: req.user._id, _id: req.params.article_id }, function(err, artFnd) {
    if(err) { res.send(err); } // not found or otherise  
    else { res.json(artFnd); }  // found
  });
};

// Create endpoint /api/articles/:article_id for PUT
exports.putArticle = function(req, res) {
  console.log('putArticle():article_id');
  Article.update({ userId: req.user._id, _id: req.params.article_id }, { link: req.body.link }, function(err, link, raw) {
    if(err) { res.send(err); }
    else    { res.json({ message: link + updated}); }
  });
};

// Create endpoint /api/articles/:article_id for DELETE
exports.deleteArticle = function(req, res) {
  console.log('deleteArticle():article_id');
  console.log('params: %s', req.params);
  Article.remove( { userId: req.user._id, _id: req.params.article_id }, function(err) {
    if(err) { res.send(err); }
    else    { res.json({ message: 'Article removed from locker'}); }
  });
};