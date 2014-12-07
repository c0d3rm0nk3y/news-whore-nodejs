var express     = require('express');
var mongoose    = require('mongoose');
var bodyParser  = require('body-parser');
var articleCtrl = require('./controllers/article');
var userCtrl    = require('./controllers/user');
var srchCtrl    = require('./controllers/search');
var passport    = require('passport');
var authCtrl    = require('./controllers/auth');

mongoose.connect('mongodb://datawhore:badCodeMonkey01!@ds027799.mongolab.com:27799/news');

var app = express();

app.use(bodyParser.urlencoded( { extended: true }));

app.use(passport.initialize());

var router = express.Router();

// Create endpoint handler for /findFeeds
router.route('/findFeeds').get(authCtrl.isAuthenticated, srchCtrl.findFeeds);

// Create endpoint handler for /findFeed
router.route('/getFeed').get(authCtrl.isAuthenticated, srchCtrl.getFeed);

// Create endpoint handler for /processFeed
router.route('/processFeed').get(authCtrl.isAuthenticated, srchCtrl.processFeed);

// Create endpoint handler for /searchNews
router.route('/searchNews').get(authCtrl.isAuthenticated, srchCtrl.searchNews);

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
  .get(authCtrl.isAuthenticated, articleCtrl.getArticle)
  .put(authCtrl.isAuthenticated, articleCtrl.putArticle)
  .delete(authCtrl.isAuthenticated, articleCtrl.deleteArticle);

// Register all our routes with /api
app.use('/api', router);

// start listening
app.listen(8080);

console.log('party on 8080..');