  var express     = require('express');
var mongoose    = require('mongoose');
var bodyParser  = require('body-parser');
var articleCtrl = require('./controllers/article');
var userCtrl    = require('./controllers/user');
var srchCtrl    = require('./controllers/search');
var passport    = require('passport');
var authCtrl    = require('./controllers/auth');
var cors        = require('cors');

mongoose.connect('mongodb://datawhore:badCodeMonkey01!@ds027799.mongolab.com:27799/news');

var app = express();

app.use(bodyParser.urlencoded( { extended: true }));
// app.use(cors);

app.use(passport.initialize());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:33208");  //http://127.0.0.1:51792
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Credentials");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

var router = express.Router();

// Create endpoint handler for /findFeeds
router.route('/findFeeds').get(authCtrl.isAuthenticated, srchCtrl.findFeeds);

// Create endpoint handler for /findFeed
router.route('/getFeed').get(authCtrl.isAuthenticated, srchCtrl.getFeed);

// Create endpoint handler for /processFeed
router.route('/processFeed').get(authCtrl.isAuthenticated, srchCtrl.processFeed);

// Create endpoint handler for /searchNews
router.route('/searchNews').get(authCtrl.isAuthenticated, srchCtrl.searchNews);

// Create endpoint handler for /scrubArticle 
router.route('/scrubArticle').get(authCtrl.isAuthenticated, srchCtrl.scrubArticle);

// Create endoint handler for /users
router.route('/users')
  .post(userCtrl.postUsers)
  .get(authCtrl.isAuthenticated, userCtrl.getUsers);

// create endpoint handlder for /articles
router.route('/articles')
  .post(authCtrl.isAuthenticated, articleCtrl.postArticles)
  .get(authCtrl.isAuthenticated, articleCtrl.getArticles);

// create endpoint handlers for /articles/:articles_id
router.route('/articles/:article_id')
  .delete(authCtrl.isAuthenticated, articleCtrl.deleteArticle)
  .get(authCtrl.isAuthenticated, articleCtrl.getArticle)
  .put(authCtrl.isAuthenticated, articleCtrl.putArticle);
  

// Register all our routes with /api
app.use('/api', router);

// start listening
app.listen(8080);

console.log('party on 8080..');