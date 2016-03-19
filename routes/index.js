var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var mongoose = require('mongoose');
var passport = require('passport');
var ejwt = require('express-jwt');

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

// express json web token for secure endpoints
var auth = ejwt({secret:'SECRET',userProperty:'payload'});




//auth end points for passport middleware

router.post('/register',function(req,res,next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message:'Please fill all details'});
	}

	var user = new User();
	console.log(req.body);
	user.username = req.body.username;
	console.log(user);
	
	user.setPassword(req.body.password);

	console.log(user.hash);
	user.save(function(err){
		if(err){
			return next(err);
		}
		return res.json({token: user.generateJWT()});
	});

});

router.post('/login',function(req,res,next){
	if(!req.body.username || !req.body.password){
		return res.status(400).json({message:'Please fill all details'});
	}
	
	passport.authenticate('local',function(err,user,info){
		if(err){
			//return next(err);
			return res.send({'status':'err','message':err.message});
		}
		if(user){
			return res.json({token:user.generateJWT()});
		}
		else{
			return res.status(401).json(info);
		}
	})(req,res,next);
});




router.get('/posts',function(req,res,next){
	Post.find(function(err,posts){
		if(err){
			return next(err);
		}
		return res.json(posts);
	})
});
 
router.post('/posts',auth,function(req,res,next){
	var post = new Post(req.body);
	console.log(req.payload.username);
	post.author = req.payload.username;
	post.save(function(err,post){
		if(err){
			return next(err);
		}
		res.json(post);
	})
});

router.param('post',function(req,res,next,id){
	console.log(id);
	var query = Post.findById(id);
	query.exec(function(err,post){
		if(err){
			return next(err);
		}
		if(!post){
			return next(new Error('Can\'t find post'));
		}
		req.post = post;
		return next();
	});
});

/*router.get('/posts/:post', function(req, res) {
  res.json(req.post);
});
*/
router.get('/posts/:post',function(req,res){
	req.post.populate('comments',function(err,post){
		if(err){
			return next(err);
		}
		res.json(post);
	});
});


router.put('/posts/:post/upvote',auth,function(req,res,next){
	req.post.upvote(function(err,post){
		if(err){
			return next(err);
		}
		res.json(post);
	});
	
});

router.put('/posts/:post/downvote',auth,function(req,res,next){
	req.post.downvote(function(err,post){
		if(err){
			return next(err);
		}
		res.json(post);
	});
});



router.post('/posts/:post/comments',auth,function(req,res,next){
	var comment = new Comment(req.body);
	comment.post = req.post;
	comment.author = req.payload.username;
	
	comment.save(function(err,comment){
		if(err){
			return next(err);
		}
		req.post.comments.push(comment);
		req.post.save(function(err,post){
			if(err){
				return next(err);
			}
			res.json(comment);
		});
	});
});


router.param('comment',function(req,res,next,id){
	console.log(id);
	var query = Comment.findById(id);
	query.exec(function(err,comment){
		if(err){
			return next(err);
		}
		if(!comment){
			return next(new Error('Can\'t find comment'));
		}
		req.post.comments.push(comment);
		req.comment = comment;
		return next();
	});
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req,res,next){
	req.comment.upvote(function(err,comment){
		if(err){
			return next(err);
		}
		res.json(comment);
	});
});

router.put('/posts/:post/comments/:comment/downvote', auth,function(req,res,next){
	req.comment.downvote(function(err,comment){
		if(err){
			return next(err);
		}
		res.json(comment);
	});
});

 module.exports = router;