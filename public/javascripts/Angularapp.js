var app = angular.module('parkingGarage', ['ui.router']);
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
		url: '/',
    	templateUrl: '/dashboard.html',
    	controller: 'DashCtrl'
    })
    .state('login', {
    	url: '/login',
    	templateUrl: 'templates/login.html',
    	controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth){
		    if(auth.isLoggedIn()){
		    	$state.go('status');
		    }
		}]
    })
    .state('space', {
    	url: '/spaces/{id}',
    	controller: 'SpaceCtrl',
    	resolve: {
	    post: ['$stateParams', 'spaces', function($stateParams, spaces) {
	      return spaces.get($stateParams.id);
	    }]
	  }
    })
    .state('status', {
    	url: '/status',
    	templateUrl: 'templates/status.html',
    	controller: 'StatusCtrl',
    	resolve: {
		    postPromise: ['spaces', function(spaces){
		    	return spaces.getAll();
		    }]
		},
		onEnter: ['$state', 'auth', function($state, auth){
		    if(auth.isLoggedIn()){
		    	
		    } else {
		    	$state.go('register');
		    }
		}]
    })
    .state('register', {
	  url: '/register',
	  templateUrl: 'templates/register.html',
	  controller: 'AuthCtrl',
	  onEnter: ['$state', 'auth', function($state, auth){
	    if(auth.isLoggedIn()){
	      	$state.go('status');
	    }
	  }]
	});
}]);

app.factory('auth',['$http', '$window', function($http,$window) {
	var auth = {};
	auth.saveToken = function (token){
	  $window.localStorage['parking-garage-token'] = token;
	};

	auth.getToken = function (){
	  return $window.localStorage['parking-garage-token'];
	};

	auth.isLoggedIn = function(){
	  var token = auth.getToken();

	  if(token){
	    var payload = JSON.parse($window.atob(token.split('.')[1]));
	    return payload.exp > Date.now() / 1000;
	  } else {
	    return false;
	  }
	};
	auth.currentUser = function(){
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));
	    console.log('token is '+token);
	    return payload.memberNo;
	  }
	};

	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};
	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
		    auth.saveToken(data.token);
		});
	};
	auth.logOut = function(){
	  $window.localStorage.removeItem('parking-garage-token');
	};
	return auth;
}]);

app.factory('members', ['$http','auth', function($http,auth) {
	
	var o = {
		members: []
	};
	o.getAll = function() {
	    return $http.get('/members').success(function(data){
	      angular.copy(data, o.members);
	    });
	  };
	o.create = function(member) {
	  return $http.post('/members', member, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    o.members.push(data);
	  });
	};
	// o.upvote = function(post) {
	//   return $http.put('/posts/' + post._id + '/upvote')
	//     .success(function(data){
	//       post.upvotes += 1;
	//     });
	// };
	// o.upvoteComment = function(post, comment) {
	//   return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote')
	//     .success(function(data){
	//       comment.upvotes += 1;
	//     });
	// };
	// o.get = function(id) {
	//   return $http.get('/posts/' + id).then(function(res){
	//     return res.data;
	//   });
	// };
	// o.addComment = function(id, comment) {
	//   return $http.post('/posts/' + id + '/comments', comment);
	// };
	return o;
}]);

app.factory('spaces', ['$http', 'auth', function($http, auth) {
	var p = {
		spaces: [
			// {position: "1",taken: "false", timeIn: "00:00"},
			// {position: "2",taken: "false", timeIn: "00:00"},
			// {position: "3",taken: "false", timeIn: "00:00"},
			// {position: "4",taken: "false", timeIn: "00:00"},
			// {position: "5",taken: "false", timeIn: "00:00"},
			// {position: "6",taken: "false", timeIn: "00:00"},
			// {position: "7",taken: "false", timeIn: "00:00"},
			// {position: "8",taken: "false", timeIn: "00:00"},
			// {position: "9",taken: "false", timeIn: "00:00"},
			// {position: "10",taken: "false", timeIn: "00:00"}
		]
	};

	p.getAll = function() {
	    return $http.get('/spaces').success(function(data){
	      angular.copy(data, p.spaces);
	    });
	};
	p.create = function(space) {
	  return $http.post('/spaces', space, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    p.spaces.push(data);
	  });
	};
	p.get = function(id) {
		 return $http.get('/spaces/' + id).then(function(res){
	      	return res.data;
	    });
	};
	p.clockIn = function(space) {
		return $http.put('/spaces/' + space._id + '/edit' , space, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
			return data;
		});
	};
	p.leave = function(space) {
		return $http.put('/spaces/' + space._id + '/leave', space, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data) {
			return data;
		});
	};
	return p;
}])

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};
  $scope.register = function(){
  	if ($scope.user.memberNo > 100) {
  		$scope.errorMsg = 'membership number must be between 1 and 100';
  		return false;
  	}
    auth.register($scope.user).error(function(error){
      $scope.error = error;
      $scope.errorMessage = error;
    }).then(function(){
      $state.go('status');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
      $scope.errorMessage = error;
    }).then(function(){
      $state.go('status');
    });
  };
}])

app.controller('MainCtrl', [
'$scope', 'posts', 'auth',
function($scope, posts) {
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.posts = posts.posts;
	$scope.addPost = function(){
	  if(!$scope.title || $scope.title === '') { return; }
	  posts.create({
	    title: $scope.title,
	    link: $scope.link,
	  });
	  $scope.title = '';
	  $scope.link = '';
	};
	$scope.incrementUpvotes = function(post) {
	  posts.upvote(post);
	};
}]);

app.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	function($scope, posts, post) {
		$scope.post = post;
		$scope.addComment = function(){
		  if($scope.body === '') { return; }
		  posts.addComment(post._id, {
		    body: $scope.body,
		    author: 'user',
		  }).success(function(comment) {
		    $scope.post.comments.push(comment);
		  });
		  $scope.body = '';
		};
		$scope.incrementUpvotes = function(comment){
		  posts.upvoteComment(post, comment);
		};
	}
	]);

app.controller('DashCtrl', [
	'$scope', 
	function($scope) {
		$scope.lgbuttons = [
			{title: 'Park', link: '/#/register'},
			{title: 'Status', link: '/#/status'},
			{title: 'Leave', link: '/#/logout'}
		]
	}
]);

// app.controller('LoginCtrl', [
// 	'$scope','members', 'auth',
// 	function($scope, members, auth) {
// 		$scope.members = members.members;
// 		$scope.memberNo = '';
// 		$scope.memberLoggedIn = false;
// 		$scope.randomMemberNumber = function() {
// 			var rando = Math.floor((Math.random()*100) +1);
// 			return rando;
// 		}
// 		$scope.checkmemberNo = function() {
// 			var num = this.randomMemberNumber();
// 			var numfree=true;
// 			$scope.memberNo = '';
// 			if (this.members.length === 0) {
// 				members.create({
// 					memberNo: num
// 				});
// 			} 
// 			if (this.members.length <=99) {
// 				for(i=0;i<this.members.length;i++) {
// 					var memNo = parseInt(this.members[i].memberNo);
// 					if( memNo === num) {
// 						// this member number is already taken
// 						numfree=false;
// 					}
// 				}
// 				if(numfree===true) {
// 					members.create({memberNo: num});
// 					$scope.memberNo = num;
					
// 				} else {
// 					this.checkmemberNo();
// 				}
				
// 			} else {
// 				// members are full
// 				numfree=false;
// 				$scope.memberNo = '';
// 			}
// 		}
// 		$scope.memberValidate = function() {
// 			var memberList = $scope.members;
// 			if(typeof parseInt($scope.memberEntry) !== 'number') {
// 				$scope.errorMessage = 'Your entry must be a number';
// 				return false;
// 			}
// 			if($scope.memberEntry > 100 || $scope.memberEntry < 1) {
// 				$scope.errorMessage = 'That entry is incorrect!  Your member number should be between 1-100.';
// 				return false;
// 			}
// 			memberList.filter(function(item) {
// 				$scope.errorMessage = '';
// 				if(item.memberNo == $scope.memberEntry) {
// 					$scope.memberNo = $scope.memberEntry;
// 					$scope.memberLoggedIn = true;
// 				} else {
// 					$scope.errorMessage = 'We could not find that member number, please try again.';
// 				}
// 			})
// 		}
// 	}
// ]);

Date.prototype.addHours= function(h){
	var h2 = parseInt(this.getHours());
	var h1 = parseInt(h);
	var sum = h2+h1;
    this.setHours(sum);
    
    return this;
}
app.filter('getById', function() {
  return function(input, id) {
    var i=0, len=input.length;
    for (; i<len; i++) {
      if (+input[i].id == +id) {
        return input[i];
      }
    }
    return null;
  }
});

app.controller('StatusCtrl', [
	'$scope','$timeout', 'auth', 'spaces', '$state',
	function($scope, $timeout, auth, spaces, $state) {
		
		$scope.clock = "loading clock..."; // initialise the time variable
	    $scope.tickInterval = 1000; //ms
	    $scope.minuteTickInterval = 6000;
	    $scope.memberNo = auth.currentUser();
	    $scope.spaces = spaces.spaces;
	    $scope.isLoggedIn = auth.isLoggedIn;
	    $scope.user = auth.currentUser;
	    $scope.selectedSpace = {};
	    var tick = function() {
	        $scope.clock = Date.now() // get the current time
	        $timeout(tick, $scope.minuteTickInterval); // reset the timer
	    }

		$scope.showTimeChoice = function(space) {
			$scope.selecting = true;
			$scope.selectedSpace = space;

		}
		$scope.leaveCalc = function(space) {
			var now = new Date();
			var leaveTime = now.addHours($scope.duration);
			$scope.selectedSpace.taken = true;
			$scope.selectedSpace.timeLeave = leaveTime;
			$scope.selectedSpace.user = $scope.memberNo;
			console.log($scope.selectedSpace);
			spaces.clockIn($scope.selectedSpace);
			$scope.selecting=false;
			$scope.parked();
		}
		$scope.spacesInit = function(position) {
			spaces.create({
				user: '',
				position: position,
				taken: false,
				timeIn: Date.now(),
				timeLeave: '',
			});
		}
		$scope.parked = function() {
			var datehours = $scope.selectedSpace.timeLeave.getHours();
			var datemins = $scope.selectedSpace.timeLeave.getMinutes();
			$scope.parkMessage = "Thank you for parking here.  Your departure time is "+datehours+':'+datemins;
		}
		$scope.unPark = function(space) {
			space.taken=false;
			space.timeLeave = '';
			spaces.leave(space);
			$scope.parkMessage = "Thank you";
		}
		$scope.isUser = function(space) {
			var num = parseInt(space.user);
			var num2 = parseInt($scope.memberNo);
			if(num == num2) {
				return true;
			} else {
				return false;
			}

		}
		var memberSpaces = $scope.spaces;
		memberSpaces.filter(function(item) {
				var outTime = Date.parse(item.timeLeave);
				var now = Date.now();
				var nowParsed = Date.parse(now);
				
				if(isNaN(outTime)==false) {
					if(outTime < now) {
						var num = parseInt(item.user);
						var num2 = parseInt($scope.memberNo);
						console.log(num,num2);
						if(num == num2) {
							$scope.errorMessage = 'Your timer has expired!!!';
						}
					}
				}
			})
		if($scope.spaces.length == undefined || $scope.spaces.length == 0) {
			for (i=1;i<=8;i++) {
				$scope.spacesInit(i);
			}
		}
		$scope.logOut = function() {
			$scope.logOut = auth.logOut;
			$state.go('register');
			return auth.logOut;
		}
	    // Start the timer
	    $timeout(tick, $scope.tickInterval);
	}
]);
