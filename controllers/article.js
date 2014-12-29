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
    if(err) { 
      res.send(err); 
    } else { res.json(artFnd); }  // found
  });
};

// Create endpoint /api/scrubArticle
exports.scrubArticle = function(req,res) {
  var index = req.query.index;
  var uId   = req.user._id;
  var link  = req.query.link;
  console.log('%s: scrubArticle(req, res)..\n%s\n%s\n', new Date().toTimeString(), uId, req.query.link);
  Article.findOne({ userId: uId, link: link }, function(err, artFnd) {
    if(err) { // not found
      console.log('err found.. %s', err);
      res.json({type: 'skip', content :{ index: index, title: "", link : "", body : err }});
    } else { 
      if(artFnd === null) {
        console.log('artFnd is null...');
        newswhore.buildAndSaveArticle(link, uId).then(
          function(result) {
            //console.log(JSON.stringify(result,null,2));
            //**article**
            var article = {
              type: 'article',
              content: {
                index : index,
                title : result.title,
                link : link,
                body : result.text
              }
            };
            res.json(article);
            //res.json(result);
          }, function(err) {
            console.log(JSON.stringify(err, null, 2));
            res.json({type: 'skip', content :{ index: index, title: "", link : "", body : err }});
            //res.send(err);
          }
        );
      } else {
        console.log('artFnd found..');
        //console.log(JSON.stringify(artFnd, null, 2));
        var article = {
          type: 'article',
          content: {
            index : index,
            title : artFnd.title,
            link : link,
            body : artFnd.text
          }
        };
        res.json(article);
      }
    }
      
  });
}

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