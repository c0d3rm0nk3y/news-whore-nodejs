var request      = require('request');
var User         = require('../app/models/user');
var q            = require('q');
var read         = require('node-readability');
var html_strip   = require('htmlstrip-native');
var sanitizeHtml = require('sanitize-html');

var options = {
        include_script : false,
        include_style : false,
        compact_whitespace : true
    };

// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
	  console.log('root');
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

  app.get('/submitArticle', function(req, res) {
    console.log('i am here..');
    console.warn('dum dee dum dum deeer');
    console.log('submitArticle: link: %s\ntoken: %s', req.query.link, req.query.token);
    var link = req.query.link;

    var token = req.query.token;
    isUser(token, link).then(
      function(art) {
        console.log('isUser().response()');
        res.json(art);
      },
      function(err) {
        console.log('isUser().reject()');
        res.json(err);
      });
    // request.post(
    //   'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + req.body.token,
    //   {},
    //   function(error, response, body) {
    //     if(!error && response.statusCode == 200) {
    //       var r = JSON.parse(body);
    //       User.findOneAndUpdate(
    //         {'google.id' : r.user_id},
    //         {$push: { "links" : req.body.link}},
    //         { safe: true, upsert: true},
    //         function(err, user) {
    //           console.log(err);d
    //           res.json(user);
    //         }
    //       );
    //     }
    //   }
    // );
  });

  isUser = function(token, link) {
    console.log('isUser()..');
    var d =  q.defer();
    try {
      request.post(
      'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token,
      {},
      function(error, response, body) {
        if(!error && response.statusCode == 200) {
          var r = JSON.parse(body);
          User.findOne({'google.id' : r.user_id}, function(err, user) {
            if(err) {
              console.log(err);
              d.reject(err);
            } else {
              console.log('user found..');
              procArt(link).then(
                function(art) {
                  d.resolve(art);
                },
                function(err) {
                  d.reject(err);
                }
              );

            }
          });
        } else {
          d.reject(new Error("status code: " + response.statusCode));
        }
      });
      return d.promise;
    } catch(ex) {
      console.log(ex);
      d.reject(ex);
    }
    return d.promise;
  }

  procArt = function(link) {
    console.log('procArt()..');
    var d = q.defer();
    try {
      read(link, function(err, article, meta) {
        if(err) {
          console.log(err);
          d.reject(err);
        }

        var text = html_strip.html_strip(article.content,options);
        console.log('!--article start--!\n\n');
        console.log(article.title);
        console.log(text);
        console.log('\n\n!--article stop--!');
        var cnt = {
          "title" : article.title,
          "content" : article.content,
          "text" : text
        };
        d.resolve(cnt);
      });
      return d.promise;
    }catch(e) { d.reject(e); }
    return d.promise;
  }

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// GOOGLE ROUTES =======================
	// =====================================
	// send to google to do the authentication
	// profile gets us their basic information including their name
	// email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
            passport.authenticate('google', {
                    successRedirect : '/profile',
                    failureRedirect : '/'
            }));


	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}