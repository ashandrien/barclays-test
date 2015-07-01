var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy(
  function(memberNo, password, done) {
    User.findOne({ memberNo: memberNo }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect member number.' });
      }
      return done(null, user);
    });
  }
));