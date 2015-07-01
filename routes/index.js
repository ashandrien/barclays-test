var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var Member = mongoose.model('Member');
var User = mongoose.model('User');
var Space = mongoose.model('Space');
var passport = require('passport');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

router.param('space', function(req, res, next, id) {
  var query = Space.findById(id);

  query.exec(function (err, space){
    if (err) { return next(err); }
    if (!space) { return next(new Error('can\'t find space')); }

    req.space = space;
    return next();
  });
});


router.post('/posts', auth, function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

// router.get('/spaces', auth, function(req, res, next) {
//   var query = Space.find({position: req.params.position}, function(err,space) {
//     if(err){ return next(err); }
//     res.json(space);
//   });
// });

router.post('/login', function(req, res, next){
  if(!req.body.memberNo){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      console.log('have user');
      return res.json({token: user.generateJWT()});
    } else {
      console.log('nope');
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.post('/register', function(req, res, next){
  if(!req.body.memberNo){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var user = new User();

  user.memberNo = req.body.memberNo;

  user.save(function (err){
    if(err){ console.log(err); return next(err); }
    return res.json({token: user.generateJWT()})
  });
});

router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;

  comment.save(function(err, comment){
    if(err){ return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});

router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});



router.get('/posts/:post', function(req, res) {
  res.json(req.post);
});

router.get('/members', function(req, res, next) {
  Member.find(function(err, members){
    if(err){ return next(err); }

    res.json(members);
  });
});

router.post('/members', function(req, res, next) {
  var member = new Member(req.body);

  member.save(function(err, member){
    if(err){ return next(err); }

    res.json(member);
  });
});

router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.post('/spaces', auth, function(req, res, next) {
  var space = new Space(req.body);

  space.save(function(err, space){
    if(err){ return next(err); }

    res.json(space);
  });
});

router.get('/spaces', function(req, res, next) {
  Space.find(function(err, spaces){
    if(err){ return next(err); }

    res.json(spaces);
  });
});

router.get('/spaces/:space', function(req, res) {
  res.json(req.space);
});

router.put('/spaces/:space/edit', auth, function(req, res, next) {
  req.space.clockIn(function(err, space){
    space.timeLeave = req.body.timeLeave;
    space.user = req.body.user;
    space.save(function(err, space) {
      if (err) { return next(err); }
      res.json(space);
    });
    
  });
});

router.put('/spaces/:space/leave', auth, function(req, res, next) {
  
  req.space.leave(function(err, space) {
    space.save(function(err, space) {
      if (err) { return next(err); }
      res.json(space);
    });
  })
});

module.exports = router;