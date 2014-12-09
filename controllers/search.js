var newswhore = require('./newswhore');
var gfeed     = require('google-feed-api');
var feed      = require('feed-read');
var url       = require('url');

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

exports.searchNews = function(req, res) {
  var keywords = req.query.keywords;
  var filter = req.query.filter;
  var scoring = req.query.scoring;
  var num = req.query.num;
  var when =req.query.when;
  var today = new Date();
  // for filters umm..
  // sort=o|n when=today|week|month 
  keywords = keywords.split(' ').join('+');
  
  console.log('when:' + when);
  // build link
  // include in the url parameters for num and scoring
  var link = 'https://news.google.com/news?q='+ keywords + '&num=' + num + '&output=rss&scoring=' + scoring;
  
  try {
    // get rss
    feed(link, function(err, articles) {
      if(err) { res.send(err); }
      var result = [];

      for(var i=0; i<articles.length; i++) {
        console.log("Article Age: %s", daydiff(articles[i].published))
        var r = { "title" : articles[i].title, "published" : articles[i].published, "link" : gup('url', articles[i].link) };
        result.push(r);
      }
      res.json(result);
    });
    // convert to rss
       
    // return to user..
  } catch(ex) {
    console.log(ex);
    res.send(ex);
  }
  
}

function daydiff(dateToTest) {
  var second = new Date(dateToTest);
  var today = new Date();
  return (today -second)/(1000*60*60*24);
}

function gup( name, link ) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( link );
  if( results === null )
    return null;
  else
    return results[1];
}