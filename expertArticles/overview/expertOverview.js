/**
 * Created by riccardo.carano on 21.03.2016.
 */
(function () {

	'use strict';

	angular
		.module('app.expertArticles')
		.controller('ExpertOverview', ExpertOverview);

	ExpertOverview.$inject = ['$scope','$state', '$ionicNavBarDelegate', '$timeout', 'CONFIG', 'JamHelperFactory',  'LoaderFactory', 'JamExpertArticlesService', 'AnalyticsHelper', '$ionicHistory'];

	function ExpertOverview($scope, $state, $ionicNavBarDelegate, $timeout, CONFIG, JamHelperFactory, LoaderFactory, JamExpertArticlesService, AnalyticsHelper, $ionicHistory) {

		// set view model
		var vm = this;

		// set vars
		$scope.config = CONFIG;
		vm.pageTitle = 'Experten-Ratgeber';
		vm.isTablet = (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') ? true : false;
		vm.backButtonParams = {};
		vm.showError = false;
		vm.errorMessage = '';
		vm.hideMore = false;
		vm.apiTimeout = false;
		vm.isTabletPortrait = (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'portrait') ? true : false;

		vm.loading = true;
		vm.data;

		vm.goTo = goTo;
		vm.loadMoreArticles = loadMoreArticles;
		vm.reload = reload;

		vm.currentUrl = $ionicHistory.currentView().url;

		// before entering the scope
		$scope.$on('$ionicView.beforeEnter', function() {

			// show nav bar
			$ionicNavBarDelegate.showBar(true);

			if (window.ionic.Platform.version() < 4.6 && CONFIG.deviceOs == 'Android') {
				vm.hideMore = true;
			} else {
				vm.hideMore = false;
			}

			// init step variables
			_controller();

			// GATRACKING (mit CustomVar)
			AnalyticsHelper.setCustomVar({index: 8, name: 'Content-Kategorie', value: '-keine-', opt_scope: 3});
			AnalyticsHelper.trackPageview('/gesundheit/');
		});

		// after entering the scope
		$scope.$on('$ionicView.afterEnter', function() {

			// set back button
			JamHelperFactory.resetBackButton();
			$timeout(function () {
				JamHelperFactory.setBackButton(vm.backButtonParams.buttonType, vm.backButtonParams.buttonParams);
			}, CONFIG.backButtonDelay);

			vm.contentHeight = '';

			// Set height for tablet
			if (vm.isTablet) {
				$timeout(function() {
					vm.contentHeight = CONFIG.windowHeight - angular.element('.bar-stable').height();
					angular.element('.right-content .scroll').height(vm.contentHeight);
					angular.element('.left-content .scroll').height(vm.contentHeight);
				}, 200);
			}
		});


		// Before Leave
		$scope.$on('$ionicView.beforeLeave', function() {

			// lösche custom_vars wieder
			AnalyticsHelper.deleteCustomVar(8);
		});


		/**
		 * Controller
		 *
		 * @private
		 */
		function _controller() {

			LoaderFactory.showLoader(2);

			var forceReload = true,
				url = '';
			vm.showError = false;
			vm.loading = true;

			// Definiere Zurück-Button - Logik
			vm.backButtonParams = {
				buttonType: 'burger',
				buttonParams: {}
			};

			if (typeof vm.data != 'undefined' && typeof vm.data.articles != 'undefined') {
				vm.loading = false;
				LoaderFactory.hideLoader(800, true);
				return true;
			}

			// Hole Übersichtseite
			JamExpertArticlesService.getOverview(url, forceReload).success(function(resultData) {

				try {

					resultData.teaser.articles = [];
					for (var i = 0; i < 4; i++) {
						resultData.teaser.articles.push(resultData.articles[i]);
						resultData.teaser.articles[i].img.src = resultData.teaser.articles[i].img.src.replace('/medium/', '/big/');
						resultData.articles[i] = {};
					}

					var tmpData = angular.extend({}, resultData);

					tmpData.articles = [];
					for (var i = 0; i < resultData.articles.length; i++) {
						if (resultData.articles[i].name) {
							tmpData.articles.push(resultData.articles[i]);
						}
					}
					vm.data = tmpData;

				} catch(e) {

					vm.data = resultData;
				}
				
				if (vm.isTablet && vm.contentHeight == '') {
					$timeout(function() {
						vm.loading = false;
						LoaderFactory.hideLoader(800, true);
					}, 500);
				} else {
					vm.loading = false;
					LoaderFactory.hideLoader(800, true);
				}

				// set canonical
				JamHelperFactory.setCanonical('https://www.jameda.de/gesundheit/', true);

				// Setze Meta-Informationen
				JamHelperFactory.setMetaData(vm.data.meta);

			}).error(function(resultError) {

				vm.showError = true;
				vm.errorMessage = 'Leider ist ein Fehler aufgetreten und wir müssen die Seite aktualisieren.';

				LoaderFactory.hideLoader(400, true);

				if (typeof resultError.message != 'undefined' && resultError.message.indexOf('Zugriff ') > -1) {
					vm.apiTimeout = true;
					JamHelperFactory.showHashTimeout();
				} else {
					vm.loading = false;
				}
			});
		}


		/**
		 * Controller neu laden
		 *
		 */
		function reload() {
			_controller();
		}


		/**
		 * Gehe zur Seite (state.go)
		 *
		 * @param state
		 * @param params
		 */
		function goTo(state, params) {

			state = state || 'expertCategory';
			params = params || {categoryId: 'allergie'};

			$state.go(state, params);
		}


		/**
		 * Lade weitere Artikel
		 *
		 * @param page
		 */
		function loadMoreArticles(page) {

			// Hole Übersichtseite
			angular.element('.collection-repeat-after-container').removeAttr('style');

			JamExpertArticlesService.getOverview(page, true).success(function(resultData) {

				// Füge Artikel dem Element hinzu (kein array merge verwenden!)
				for (var i = 0; i < resultData.articles.length; i++) {
					vm.data.articles.push(resultData.articles[i]);
				}

				vm.data.nextPage = resultData.nextPage;
			});
		}
	}
})();