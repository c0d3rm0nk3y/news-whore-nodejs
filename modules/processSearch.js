var Article    = require('../models/article');
var mongoose   = require('mongoose');
var read       = require('node-readability');
var html_strip = require('htmlstrip-native');
var feed       = require('feed-read');
var options = {
        include_script : false,
        include_style : false,
        compact_whitespace : true };

mongoose.connect('mongodb://datawhore:badCodeMonkey01!@ds027799.mongolab.com:27799/news');


process.on('message', function(data) {
  console.log('processSearch.process.on(): %s', JSON.stringify(data,null, 2));
  begin(data.keywords, data.userId, data.searchId);
});

function begin(keywords, userId, searchId) {
  console.log('%s: searchForArticles().worker().begin()..', new Date().toTimeString());
  // build link
  var link = 'https://news.google.com/news?q='+ keywords.split(' ').join('+') + '&num=100&output=rss&scoring=n';
  // call feed and get results
  feed(link, function(err, results) {
    console.log('%s: searchForArticle().feed(): %s results found', new Date().toTimeString(), results.length);
    // loop through results
    for(var i=0; i<results.length; i++) {
      //console.log('%s: processing %s of %s', new Date().toTimeString(), (i+1), results.length);
      //console.log(gup('url', results[i].link));
      var l = gup('url', results[i].link);
      processArticleFromSearch(l, results[i].published, userId, searchId);
    }
  });
}

processArticleFromSearch = function(link, published, userId, searchId) {
  try {
    console.log('%s: processArticleFromSearch()..',new Date().toTimeString());
    Article.findOne({userId: userId, searchId: searchId, link: link}, function(err, found) {
      //**  code never seems to make it in here**//
      console.log('%s: processArticleFromSearch().Article.findOne()', new Date().toTimeString());
      if(err) { console.log("%s: processArticleFromSearch().Article.findOne() err: ", new Date().toTimeString(), err); } 
      else {
       if(found === null) { // isn't in the db.. 
         console.log('%s: found === null, not in db', new Date().toTimeString());
         read(link, function(err, article) {
           console.log('%s: processArticleFromSearch().Article.findOne().read()', new Date().toTimeString());

           if(err) {  console.log('%s: processArticleFromSearch().Article.find().feed(): err\n%s', new Date().toTimeString(), err, link);  } 
           else    {
             if(typeof article.content !== 'undefined') {
              if(article.content !== false) {  buildArticle(userId, searchId, link, published, article); }
             } else {
               console.log('%s: article %s skipped', new Date().toTimeString(), article.title);
             }
           }
         });
       } else {
         console.log('%s: %s already in db..', new Date().toTimeString(), link);
       } 
      }
    });
  } catch(ex) { console.log('%s: exception: %s', new Date().toTimeString(), ex); }
}

buildArticle = function(userId, searchId, link, published, article) {
  console.log('%s: buildArticle(): %s', new Date().toTimeString(),article.title);
  var a = new Article();
  a.userId = userId;
  a.searchId = searchId;
  a.title = article.title;
  a.link = link;
  a.published = published;
  try       { a.text = html_strip.html_strip(article.content,options); } 
  catch(ex) { a.text = "parse failure"; }
  a.save(function(err) {
    if(err) { console.log('%s: article failed: %...', new Date().toTimeString(), err); } 
    else    { console.log('%s: article %s saved...', new Date().toTimeString(), a.title); }
  });
}

gup = function( name, link ) {
  console.log('%s: gup()..',new Date().toTimeString());
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( link );
  if( results === null )
    return null;
  else
    return results[1];
}