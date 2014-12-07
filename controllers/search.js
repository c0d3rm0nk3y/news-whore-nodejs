var newswhore = require('./newswhore');
var gfeed     = require('google-feed-api');
var feed      = require('feed-read');

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
  keywords = keywords.split(' ').join('+');
  console.log('Keywords:' + keywords);
  // build link
  var link = 'https://news.google.com/news?q='+ keywords + '&num=0&output=rss';
  
  try {
    // get rss
    console.log('link:\n%s', link);
    feed(link, function(err, articles) {
      if(err) { res.send(err); }
      res.json(articles);
    });
    // convert to rss
       
    // return to user..
  } catch(ex) {
    console.log(ex);
    res.send(ex);
  }
  
}

buildGoogleNews = function(keywords) {
  try {
    var link = "https://news.google.com/news/story?ncl=dqfAgonXGJQTZEMPheUYg_A_ytaHM&q=" + keywords + "&lr=English&hl=en&sa=X&ei=GW6EVJLAMND9yQSTxIKoBQ&ved=0CCsQqgIwAA&output=rss";
    return link;
  } catch(ex) {
    console.log(ex);
    return ex;
  }
}