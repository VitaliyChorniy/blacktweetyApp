(function () {
	'use strict';

	/**
	 * Main controller of blacktweetyApp
	 */
	angular.module('blacktweetyApp').controller('MainCtrl', MainCtrl);

	MainCtrl
		.$inject = [
		'$scope',
		'$routeSegment',
		'$translate',
		'$cookies',
		'$rootScope',
		'$location',
		'DEFAULT_AVATAR',
		'ngDialog',
		'searchFactory'
	];

	function MainCtrl(
		$scope,
		$routeSegment,
		$translate,
		$cookies,
		$rootScope,
		$location,
		DEFAULT_AVATAR,
		ngDialog,
		searchFactory
		) {

		$scope.lang = $translate.use();

	  $scope.init = function(){
			$scope.user = $rootScope.user;
		  $scope.userName = $rootScope.user.name.first + ' ' + $rootScope.user.name.last || '';
		  if(!$scope.user.avatar){
		  	$rootScope.user.avatar = DEFAULT_AVATAR;
		  }
		  hideCollapsedMenu();
	  };

	  $scope.init();

		// change language
		$scope.changeLanguage = function (langKey) {
			$translate.use(langKey);
			$scope.lang = $translate.use();
		};

		$scope.logOut = function(){
			$rootScope.user = {};
			$cookies.remove('user');
			$location.path('/login');
		};

		angular.element('.btapp-mobile-menu .collapse-link').on('click', function(){
			angular.element('.btapp-mobile-menu').collapse('hide');
		});

		function hideCollapsedMenu(){
			var elem = angular.element('.sidebar-nav.navbar-collapse');
			if(!elem.hasClass('collapse')){
				elem.addClass('collapse');
			}
		}
	}

}());
