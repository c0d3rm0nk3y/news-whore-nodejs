var Article    = require('../models/article');
var q          = require('q');
var read       = require('node-readability');
var html_strip = require('htmlstrip-native');
var options = {
        include_script : false,
        include_style : false,
        compact_whitespace : true };


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