var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy(
	function(username,password,done){
		console.log(password);
		User.findOne({username:username}, function(err,user){
			if(err){
				console.log(err);
				return done(err);
			}
			if(!user){
				return done(null, false,{message:'Incorrect Username.'});
			}
			if(!user.validPassWord(password)){
				console.log(password);
				return done(null, false,{message:'Incorrect Password.'});	
			}
			return done(null,user);
		});
	}

));



