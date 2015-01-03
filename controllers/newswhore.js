var Article    = require('../models/article');
var q          = require('q');
var read       = require('node-readability');
var html_strip = require('htmlstrip-native');
var feed       = require('feed-read');
var cp         = require('child_process');
var Worker     = require('webworker-threads').Worker;
var options = {
        include_script : false,
        include_style : false,
        compact_whitespace : true };


exports.searchForArticles = function(keywords, userId, searchId) {
  console.log('%s: searchForArticles()...', new Date().toTimeString());
  
  //console.log(JSON.stringify(data,null,2));
  var n = cp.fork('./modules/processSearch.js');
  
  n.on('message',           function(m)    { console.log('incoming message: %s',m);      } );
  n.on('uncaughtException', function (err) { console.log('Caught exception: ' + err);    } );
  n.on('error',             function(err)  { console.log('process error: %s', err);      } );
  n.on('exit',              function(code) { console.log('process exit code: %s', code); } );
  n.on('close',             function(code) { console.log('process exit: %s', code);      } );
  n.on('disconnect',        function()     { console.log('process disconnect()..');      } );
  
  n.send({'keywords': keywords, 'userId': userId, 'searchId': searchId});
  //sfa(keywords, userId, searchId);
}

sfa = function(keywords, userId, searchId) {
  console.log('%s: sfa', new Date().toTimeString());
  var data = {keywords: keywords, userId: userId, searchId: searchId};
  
  var worker = new Worker(function() {
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
          console.log(gup('url', results[i].link));
          processArticleFromSearch(gup('url',results[i].link), results[i].published, userId, searchId);
        }
      });
    }
    
    onmessage = function(data) {
      var d = JSON.parse(data);
      console.log('%s: searchForArticles().worker.onmessage()\n%s', new Date().toTimeString(), JSON.stringify(d,null,2));
      begin(data.keywords, data.userId,data.searchId);
    };
  });
  console.log('postMessage()..');
  worker.postMessage();
}

processArticleFromSearch = function(link, published, userId, searchId) {
  Article.findOne({userId: userId, searchId: searchId, link: link}, function(err, found) {
    if(err) { console.log("%s: processArticleFromSearch().Article.findOne() err: ", new Date().toTimeString(), err); } 
    else {
     if(found === null) { // isn't in the db.. 
       read(link, function(err, article) {
         if(err) {  console.log('%s: processArticleFromSearch().Article.find().feed(): err\n%s', new Date().toTimeString(), err, link);  } 
         else    {
           if(typeof article.content !== 'undefined') {
             if(article.content !== false) {  buildArticle(userId, searchId, link, published, article); }
           }
         }
       });
     } 
    }
  });
}

buildArticle = function(userId, searchId, link, published, article) {
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

exports.buildAndSaveArticle = function(link, id) {
  console.log('%s: buildArticle()..\nLink: %s\nid: %s',new Date().toTimeString(), link, id);
  var d = q.defer();
  try {
    read(link, function(err, article, meta) {
      console.log('buildArticle().read()..');
      if(err) { d.reject(err); }
      else {  
        var art = new Article();
        art.link = link;
        art.userId = id;
        art.title = article.title;
        art.html = article.html;
        art.content = article.content;
        try {
          art.text = html_strip.html_strip(article.content,options);
        } catch(ex) {
          art.text = "parse failure";
        }
        art.save(function(err) {
          if(err) d.reject(err);
          d.resolve({messaage: 'article added', data: art});
        });
      }
    });
    
  }catch(e) {
    console.log('exports.buildArticle().. exception' + e);
  }
  return d.promise;
}

exports.daydiff = function(dateToTest) {
  var second = new Date(dateToTest);
  var today = new Date();
  return (today -second)/(1000*60*60*24);
}

gup = function( name, link ) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( link );
  if( results === null )
    return null;
  else
    return results[1];
}
