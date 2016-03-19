var app = angular.module('flapperNews', ['ngRoute']);

app.controller('MainCtrl',[
	'$scope', 'posts','auth',function($scope,posts,auth){
		$scope.test = "Hello World";
		$scope.posts = [
            {title: 'post 1', upvotes: 4},
            {title: 'post 2', upvotes: 2},
            {title: 'post 3', upvotes: 1},
            {title: 'post 4', upvotes: 8},
            {title: 'post 5', upvotes: 5}
        ];
		$scope.posts = posts.posts;
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.addPost = function(){
			if(!$scope.title || $scope.title===""){
				return;
			}
			//call service
			posts.create({
				title:$scope.title,
				link:$scope.link
			});
			$scope.title="";
			$scope.link="";
		};
		$scope.incrementVotes=function(post){
			posts.upvote(post);
		};
		$scope.decrementVotes=function(post){
			posts.downvote(post);
		};
	}
]);;



				// upvotes:0,
				// downvotes:0,
				// comments:[
				// 	{author:'Tony',body:'Iron Man',upvotes:0,downvotes:0},
				// 	{author:'Stark',body:'Jarvis!',upvotes:0,downvotes:0}

//auth service
app.factory('auth',['$http','$window',function($http,$window){
	var auth = {};
	auth.saveToken = function(token){
		$window.localStorage['flapper-new-token'] = token;
	}
	auth.getToken = function(){
		return $window.localStorage['flapper-new-token'];
	}
	auth.isLoggedIn = function(){
		var token = auth.getToken();
		if(token){
			//convert base 64 encoded string
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			console.log('loggged in');
			return payload.exp > Date.now() / 1000;
		}
	}
	auth.currentUser = function(){
		var token = auth.getToken();
		if(auth.isLoggedIn()){
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.username;
		}
	}
	auth.register = function(user){
		return $http.post('/register',user).success(function(data){
			console.log(data.token);
			auth.saveToken(data.token);
		});
	}
	auth.logIn = function(user){
		return $http.post('/login',user).success(function(data){
			console.log(data.token);
			auth.saveToken(data.token);
		});
	}
	auth.logOut = function(user){
		$window.localStorage.removeItem['flapper-new-token'];
	}

	return auth;
}]);


//auth controller
app.controller('AuthCtrl', ['$location','$scope','auth', function($location,$scope,auth){
	$scope.user = {};
	$scope.register = function(){
		auth.register($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$location.path('/home');
		});
	}
	$scope.logIn = function(){
		auth.logIn($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$location.path('/home');
		});
	}
}]);




//service
app.factory('posts',['$http','auth',function($http,auth){
	var p = {
		posts:[{title:'Deadpool',links:'',upvotes:2,downvotes:0,
				comments:[
					{author:'Tony',body:'Iron Man',upvotes:1,downvotes:0},
					{author:'Stark',body:'Jarvis!',upvotes:0,downvotes:1}
				]},
				{title:'Captain America',links:'',upvotes:1,downvotes:1}]
	}
	p.getAll = function(){
		return $http.get('/posts').success(function(data){
			angular.copy(data,p.posts);
			console.log(p.posts);
		});
	};

	p.create = function(post){
		return $http.post('/posts',post,{
				headers:{Authorization:'Bearer ' + auth.getToken()}
			}).success(function(data){
			p.posts.push(data);
		});
	};

	p.upvote = function(post){
		return $http.put('/posts/'+ post._id + '/upvote', null, {
			headers:{Authorization:'Bearer ' + auth.getToken()}
		}).success(function(data){
			post.upvotes +=1;
		});
	};

	p.downvote = function(post){
		return $http.put('/posts/'+ post._id + '/downvote', null, {
			headers:{Authorization:'Bearer ' + auth.getToken()}
		}).success(function(data){
			post.downvotes +=1;
		});
	};

	p.get = function(id){
		return $http.get('/posts/'+id);
	};

	p.addComment = function(id, comment){
		return $http.post('/posts/'+id +'/comments',comment,{
			headers:{Authorization:'Bearer ' + auth.getToken()}
		});
	};

	p.upvoteComment = function(post,comment){
		return $http.put('posts/'+post._id+'/comments/'+comment._id+'/upvote', null, {
			headers:{Authorization:'Bearer ' + auth.getToken()}
		}).success(function(data){
						console.log(data);
				 comment.upvotes += 1;
		});
	};
	p.downvoteComment = function(post,comment){
		return $http.put('posts/'+post._id+'/comments/'+comment._id+'/downvote', null, {
			headers:{Authorization:'Bearer ' + auth.getToken()}
		}).success(function(data){
				comment.downvotes +=1;
		});
	};
	return p;
}]);

/**
*  Module
*
* Description
*/


//adding state -- if using ui-routing 
/*app.config(['$stateProvider','$urlRouterProvider',function($stateProvider,$urlRouterProvider) {
	$stateProvider.state('home',{
		url: '/home',
		templateUrl:'/home.html',
		controller: 'MainCtrl'
	});
	// access individual post
	$stateProvider.state('posts',{
		url: '/posts/{id}',
		templateUrl:'/posts.html',
		controller: 'PostsCtrl'
	});
	$urlRouterProvider.otherwise('htmlome'); //default
}])*/


//routing
app.config(function($routeProvider){
	$routeProvider.when('/login',{
			   templateUrl:'/login.html',
			   controller: 'AuthCtrl',
			   onEnter:['$location','auth',function($location,auth){
			   		if(auth.isLoggedIn()){
			   			console.log('Logged here');
			   			$location.path('/home');
			   		}
			   }]
		})
		.when('/register',{
			templateUrl:'/register.html',
			controller: 'AuthCtrl',
			 onEnter:['$location','auth',function($location,auth){
			   		if(auth.isLoggedIn()){
			   			$location.path('/home');
			   		}
			   }]
		})
		.when('/home',{
				templateUrl:'/home.html',
				controller: 'MainCtrl',
				resolve:{
					postPromise:['posts',function(posts){
						return posts.getAll();
					}]
				}	
		})
		.when('/posts/:id',{
			templateUrl:'/posts.html',
			controller: 'PostsCtrl'
		})
		.otherwise({
			redirectTo:'/login'
		})
});

/*
resolve: {
				post:['$routeParams','posts',function($routeParams,posts){
					return posts.get($routeParams.id);
				}]
			}
*/

app.controller('PostsCtrl', function($scope,$routeParams,posts,auth){
	posts.get($routeParams.id).then(function(res){
		$scope.post = res.data;	
	});
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.addComment = function(){
		if($scope.body === ''){
			return;
		}
		posts.addComment($routeParams.id,{
				body: $scope.body,
    			author: 'user',
			}).success(function(comment){
				console.log(comment);
				if($scope.post.comments == undefined){
					$scope.post.comments = [];
				}
				$scope.post.comments.push(comment);
			});
		$scope.body = '';
	};
	
	$scope.incrementUpVotes = function(comment){
		console.log('test');
		posts.upvoteComment($scope.post,comment);
	};

	$scope.incrementDownVotes = function(comment){
		posts.downvoteComment($scope.post,comment);
	}
});

app.controller('NavCtrl', ['$scope','auth',function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);