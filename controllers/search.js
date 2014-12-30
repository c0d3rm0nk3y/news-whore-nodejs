var newswhore = require('./newswhore');
var gfeed     = require('google-feed-api');
var q         = require('q');
var feed      = require('feed-read');
var url       = require('url');
var html_strip = require('htmlstrip-native');
var read       = require('node-readability');
var options = {
        include_script : false,
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

/**
exports.scrubArticle = function(req, res) {
  console.log('%s: scrubArticle()', new Date().toTimeString());
  try {
    var link = req.query.link;
    var index = req.query.index;
    getReadability(link, index).then(function(response) {
      console.log(JSON.stringify(response, null, 2));
      res.json(response);
    });

  } catch(ex) { console.log('scrubArticle() ex: %s', ex); }
}
**/

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

exports.searchNews = function(req, res) {
  var keywords = req.query.keywords;
  console.log('searchNews()...\nkeywords: %s', keywords);
  var link = 'https://news.google.com/news?q='+ keywords.split(' ').join('+') + '&num=100&output=rss&scoring=n';

  try {
    // get rss
    feed(link, function(err, articles) {
      if(err) { res.send(err); }
      var results = { type: "search", content: [] };
      for(var i=0; i<articles.length; i++) {
        results.content.push(
          {
            title: '',
            link: gup('url', articles[i].link),
            published: articles[i].published,
            body: ''
          }

        );
      }
      res.json(results);
    });
  } catch(ex) {
    console.log(ex); res.send(ex);
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
