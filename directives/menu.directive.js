(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('jamMenu', menu)
		.controller('JamMenu', JamMenu);

	function menu($http, $templateCache, $compile) {

		var directive = {
			restrict: 'E',
			link: function(scope, element) {

				var templateUrl = 'app/directives/menu.html';

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					$compile(element.contents())(scope);
				});
			}
		};
		return directive;
	}

	JamMenu.$inject = ['$scope', '$state', '$ionicHistory', 'CONFIG', 'JamLoginFactory', 'AnalyticsHelper'];
	function JamMenu ($scope, $state, $ionicHistory, CONFIG, JamLoginFactory, AnalyticsHelper) {

		var vm = this;
		vm.config = CONFIG;
		vm.isTablet = (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') ? true : false;

		vm.userName = 'Mein jameda';
		vm.showFooter = true;
		vm.userUiSref = 'userMainMenu';

		vm.goHome = goHome;

		if (typeof CONFIG.userProfile.user != 'undefined') {
			vm.userName = CONFIG.userProfile.user.email;
		}

		createMenu();

		$scope.$parent.$on('$ionicView.afterEnter', function() {

			JamLoginFactory.checkLogin().success(function() {
				createMenu();
			}).error(function() {
				createMenu();
			});
		});

		$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

			JamLoginFactory.checkLogin().success(function() {
				createMenu();
			}).error(function() {
				createMenu();
			});
		});


		// GATRACKING
		function trackMenuClick(clickTarget) {

			var currentView = $ionicHistory.currentView().stateName;
			var pageSource = 'Unbekannt';
			var pageTarget = 'Unbekannt';

			// get source
			switch (currentView) {
				case 'home':
					pageSource = 'Seitenmenu Klicks - Home';
					break;
				case 'searchByName':
					pageSource = 'Seitenmenu Klicks - Namenssuche';
					break;
				case 'profileFavourites':
					pageSource = 'Seitenmenu Klicks - Gemerkte Ärzte';
					break;
				case 'lastSearchList':
					pageSource = 'Seitenmenu Klicks - Letzte Suchen';
					break;
				case 'staticContents':
					pageSource = 'Seitenmenu Klicks - Über jameda';
					break;
				case 'searchResultList':
					pageSource = 'Seitenmenu Klicks - Suchergebnis';
					break;
			}

			// get target
			switch (clickTarget) {
				case 'home':
					pageTarget = 'Home';
					break;
				case 'searchByName':
					pageTarget = 'Namenssuche';
					break;
				case 'profileFavourites':
					pageTarget = 'Gemerkte Ärzte';
					break;
				case 'lastSearchList':
					pageTarget = 'Letzte Suchen';
					break;
				case 'staticContents':
					pageTarget = 'Über jameda';
					break;
				case 'searchResultList':
					pageTarget = 'Suchergebnis';
					break;
			}

			// track
			AnalyticsHelper.trackEvent(pageSource, pageTarget);

			// ciao
			return true;
		}
		vm.trackMenuClick = trackMenuClick;

		/**
		 * Create Menu
		 */
		function createMenu() {

			vm.config = CONFIG;

			if (typeof CONFIG.userProfile.user != 'undefined') {
				vm.userName = CONFIG.userProfile.user.email;
			} else {
				vm.userName = 'Mein jameda';
			}

			if (vm.isTablet) {
				// Für Kunden eine andere Weiterleitung
				if (typeof CONFIG.userProfile.premium != 'undefined' && CONFIG.userProfile.premium != false) {
					vm.userUiSref = 'premiumAppointmentsSingle';
				} else {
					vm.userUiSref = 'userEvaluates';
				}
			}

			vm.menuData = [
				{
					name: 'Neue Suche',
					link: '',
					iconL: 'ion-ios-search-strong',
					iconR: 'ion-chevron-right',
					sref: 'home',
					hide: false
				},
				{
					name: 'Bewertung schreiben',
					link: '',
					iconL: 'ion-ios-compose-outline',
					iconR: 'ion-chevron-right',
					sref: 'searchByName',
					hide: false
				},
				{
					name: 'Meine gemerkten Ärzte',
					link: '',
					iconL: 'ion-ios-star-outline',
					iconR: 'ion-chevron-right',
					sref: 'profileFavourites',
					hide: false
				},
				{
					name: 'Meine letzten Suchen',
					link: '',
					iconL: 'ion-ios-clock-outline',
					iconR: 'ion-chevron-right',
					sref: 'lastSearchList',
					hide: false
				},
				{
					name: 'Experten-Ratgeber',
					link: '',
					iconL: 'ion-ios-paper-outline',
					iconR: 'ion-chevron-right',
					sref: 'expertOverview',
					hide: false
				},
				{
					name: 'Über jameda',
					link: '',
					iconL: 'ion-ios-information-outline',
					iconR: 'ion-chevron-right',
					sref: 'staticContents',
					hide: false
				}
			];

			vm.footerMenuData = [
				{
					name: 'Mein jameda',
					iconLBadge: 'NEU',
					link: '',
					iconL: 'ion-ios-contact-outline',
					iconR: 'ion-chevron-right',
					sref: 'userLogin',
					needLogin: false,
					hide: false
				},
				{
					name: vm.userName,
					link: '',
					image: (typeof CONFIG.userProfile.premium != 'undefined' && CONFIG.userProfile.premium != false && CONFIG.userProfile.premium.portrait) ? CONFIG.apiUrl+'/'+CONFIG.userProfile.premium.portrait : false,
					iconL: 'ion-ios-contact-outline',
					iconR: 'ion-chevron-right',
					bubble: (typeof CONFIG.userProfile.premium != 'undefined' && CONFIG.userProfile.premium != false) ? CONFIG.userProfile.bubbles.appointments.open : 0,
					sref: vm.userUiSref,
					needLogin: true,
					hide: false
				}
			];
		}

		/**
		 * go to home
		 */
		function goHome() {

			event.preventDefault();
			event.stopPropagation();

			$state.go('home',{});
		}
	}
})();