var newswhore  = require('./newswhore');
var gfeed      = require('google-feed-api');
var q          = require('q');
var feed       = require('feed-read');
var url        = require('url');
var html_strip = require('htmlstrip-native');
var read       = require('node-readability');
var Worker     = require('webworker-threads').Worker;
var Search     = require('../models/search');
var options    = { include_script : false,
                   include_style : false,
                   compact_whitespace : true };

exports.findFeeds = function(req, res) {
  var keywords = req.query.keywords; // word+word+word
  console.log('api/findFeeds\nkeywords: %s', keywords);
  //res.json({message: 'coming soon..'});
  try {

    gfeed.findFeeds(keywords, function(feeds) {
      res.json(feeds);
      //console.log(feeds);
      var feed = new gfeed.Feed(feeds.entries[0].url);
      feed.listItems(function(items) {
        //console.log(items);
        res.json(items);
      });

    });
  } catch(e) { res.send(e);}
}

getReadability = function(link, index) {
  console.log('%s: getReadability()\nindex:%s\n%s\n', new Date().toTimeString(), index, link);
  var d = q.defer();
  try {
    read(link, function(err, article, meta) {
      try {
        if(article.content !== false || article.title === '404 Not Found') {
          var text = html_strip.html_strip(article.content,options);
          var result = {
            type: "article",
            content: {
              index: index,
              title: article.title,
              link: article.link,
              body: text
            }
          };
          d.resolve(result);
          article.close();
        }
      }catch( ex ) {
        console.log('%s: read() ex: skipping %s\nlink: %s', new Date().toTimeString(), ex, link);
        d.resolve({ type: 'skip', content : { index: index, title: "", body: ex}});
      }

    });
  } catch(ex) { console.log('%s: getReadability() ex: %s', new Date().toTimeString(), ex); }
  console.log('%s: getReadability(): returning promise..', new Date().toTimeString());
  return d.promise;
}

exports.getFeed = function(req,res) {
  var link = req.query.link;
  console.log('api/search/getFeed\nlink: %s', link);
  try {
    var feed = new gfeed.Feed(link);
    //console.log('gFeed.feed()\n%s',feed);
    feed.listItems(function(items) {
      //console.log(items);
      res.json(items);
    });
  } catch(ex) {
    res.send(ex);
  }
}

exports.processFeed = function(req, res) {
  var link = req.query.link;
  var num = req.query.num;

  try {
    var feed = new gfeed.Feed(link);
    gfeed.listItems(function(items) {

    });
  } catch(ex) {
    console.log(ex);
    res.send(ex);
  }
}

exports.getSearch = function(req, res) {
  var searchId = req.query.searchId;
  var uId = req.user._id;
  
  console.log('%s: getSearch()\nSearch Id: %s\nUser Id: %s', new Date().toTimeString(), searchId, uId );
  try {
    Search.findOne({userId: uId, searchId: searchId}, function(err,found) {
      if(err) { res.json({message: failure, error: err}); }
      
      if(found === null) {
        res.json({ message: "no matching search of keywords assigned to logged in user"});
      } else {
        res.json({ message: "search found!", search: found});
      }
    });
    
  } catch(ex) {
    console.log('%s: getSearch() ex:', new Date().toTimeString(), ex);
    res.json({exceptipon: ex});
  }
}

exports.getSearches = function(req, res) {
  var uId = req.user._id;
  console.log('%s: getSearches()..', new Date().toTimeString());
  Search.find({userId: uId}, function(err, results) {
    if(err) {
      console.log('%s: getSearches().Search.find() err: ', new Date().toTimeString(), err);
      res.json({message: 'search errored', err: err});
    } else {
      console.log('%s: getSearches().Search.find()\n', new Date().toTimeString(), results);
      res.json(results);
    }
  });
}

exports.searchNews = function(req, res) {
  console.log('%s: searchNews()...', new Date().toTimeString());
  var keywords = req.query.keywords;
  var uId = req.user._id;
  
  // check to see if search exists in db
  Search.findOne({userId: uId, keywords: keywords}, function(err, found) {
    if(err) { res.json({ message: "error detected in db search", err: err}); }
    console.log('%s: searchNews().Search.findOne()..', new Date().toTimeString());
    if(found === null) { // not found..
      console.log('%s: searchNews().Search.findOne(): not found,creating..', new Date().toString());
      // create search db entry
      var s = new Search();
      s.userId = uId;
      s.keywords = keywords;
      s.submitted = new Date();
      s.status = "";
      s.state = "";
      // save
      
      //newswhore.searchForArticles(keywords, uId, s._id);
      s.save(function(err) {
        if(err) { res.json({ message: "saving new search failed", err: err}); }
        // respond with search _id
        res.json({message: "new search saved..", search: s});
        console.log('%s: searchNews().Search.findOne().article.save() successful', new Date().toTimeString());
        // send searchId, userId, keywords off for processing
        newswhore.searchForArticles(keywords, uId, s._id);
      });
    } else {  // found!  
      console.log('%s: searchNews().Search.findOne(): found!', new Date().toTimeString());
      // respond with existing searchID,
      res.json({message: "search already exsists.. updating found articles", search: found});
      newswhore.searchForArticles(keywords, uId, found._id);
    }
  });
  
}

