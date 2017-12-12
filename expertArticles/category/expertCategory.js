/**
 * Created by riccardo.carano on 21.03.2016.
 */
(function () {

	'use strict';

	angular
		.module('app.expertArticles')
		.controller('ExpertCategory', ExpertCategory);

	ExpertCategory.$inject = ['$scope', '$ionicScrollDelegate', '$ionicNavBarDelegate', 'CONFIG', 'JamHelperFactory', '$state', 'LoaderFactory', '$ionicHistory', 'JamExpertArticlesService','$location', '$timeout', 'AnalyticsHelper'];

	function ExpertCategory($scope, $ionicScrollDelegate, $ionicNavBarDelegate, CONFIG, JamHelperFactory, $state, LoaderFactory, $ionicHistory, JamExpertArticlesService, $location, $timeout, AnalyticsHelper) {

		// set view model
		var vm = this;

		// set vars
		vm.JamHelperFactory = JamHelperFactory;
		vm.config = CONFIG;
		vm.pageTitle = 'Kategorie';
		vm.isLoggedIn = false;
		vm.isTablet = (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') ? true : false;
		vm.backButtonParams = {};
		vm.popup = null;
		vm.hideMore = false;
		vm.twoLines = true;

		vm.userFormData = {};
		vm.showError = '';
		vm.errorMessage = '';
		vm.currentUrl = '';

		vm.category;
		vm.goTo = goTo;
		vm.gotoProfile = gotoProfile;
		vm.gotoArticle = gotoArticle;
		vm.loadMoreArticles = loadMoreArticles;
		vm.changeTwoLines = changeTwoLines;

		// show nav bar
		$ionicNavBarDelegate.showBar(true);

		// before entering the scope
		$scope.$on('$ionicView.beforeEnter', function() {

			// init step variables
			initCategory();

			if (window.ionic.Platform.version() < 4.6 && CONFIG.deviceOs == 'Android') {
				vm.hideMore = true;
			} else {
				vm.hideMore = false;
			}

			// reset error
			vm.showError = '';
			vm.errorMessage = '';
		});

		// Before Leave
		$scope.$on('$ionicView.beforeLeave', function() {

			// lösche custom_vars wieder
			AnalyticsHelper.deleteCustomVar(8);
			AnalyticsHelper.deleteCustomVar(9);
		});

		// after entering the scope
		$scope.$on('$ionicView.afterEnter', function() {

			JamHelperFactory.resetBackButton();

			// set back button
			$timeout(function() {

				vm.backButtonParams.buttonType = 'back';
				vm.backButtonParams.buttonParams.title = '';
				vm.backButtonParams.buttonParams.url = getBackButtonUrl();

				if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') {
					vm.backButtonParams.buttonParams.title = 'zurück';
				}

				JamHelperFactory.setBackButton(vm.backButtonParams.buttonType, vm.backButtonParams.buttonParams);

			}, CONFIG.backButtonDelay);

			// Set height for tablet
			if (vm.isTablet) {
				$timeout(function() {
					var contentHeight = CONFIG.windowHeight - angular.element('.bar-stable .title').height();
					angular.element('.right-content').height(contentHeight);
				}, 200);
			}
		});

		function initCategory() {
			
			vm.currentUrl = $ionicHistory.currentView().url;

			if (typeof vm.category != 'undefined' && typeof vm.category.currentCategory != 'undefined') {
				// Google Analytics Tracking
				track(vm.category);
				LoaderFactory.hideLoader(600);
				return true;
			}

			// get article data
			JamExpertArticlesService.getCategory(vm.currentUrl)

				.success(function(data) {

					// get current category data
					vm.category = data;
					vm.category.currentCategory = $location.path().split("/")[2];

					// set canonical
					JamHelperFactory.setCanonical(CONFIG.apiUrl + $location.path(), true);

					// set page title
					$timeout(function() {
						if (vm.category.title != null) {
							JamHelperFactory.setHeadTitle(vm.category.title);
						}

						$ionicScrollDelegate.$getByHandle('mainScroll').resize();

						if (CONFIG.deviceType == 'tablet') {
							$ionicScrollDelegate.$getByHandle('rightScroll').resize();
						}

						// Setze Meta-Informationen
						JamHelperFactory.setMetaData(vm.category.meta);

						// Collection-repeat after korregieren
						var elem = angular.element('[nav-view="active"] .collection-repeat-after-container');
						elem.css({'transform': 'translate3d(0px, 2160px, 0px)'});

						elem = undefined;

						// hide loader
						LoaderFactory.hideLoader(600);
					}, 300);

					// Google Analytics Tracking
					track(vm.category);
				})

				.error(function(errorResponse) {

					// hide loader
					LoaderFactory.hideLoader(600);
					JamHelperFactory.showHashTimeout();
				});

			// set default back button
			if (true || vm.isTablet) {
				vm.backButtonParams = {
					buttonType: 'burger',
					buttonParams: {}
				};
			} else {
				vm.backButtonParams = {
					buttonType: 'back',
					buttonParams: {
						title: 'zurück',
						url: '/mein-jameda/'
					}
				};
			}
		}

		/**
		 * Tracking für Google Analytics mit Custom Vars
		 * @param data
		 */
		function track(data) {
			if (typeof data != 'undefined' && typeof data.adParams != 'undefined') {
				if (typeof data.adParams.adsc_kategorie != 'undefined') {
					AnalyticsHelper.setCustomVar({index: 8, name: 'Content-Kategorie', value: data.adParams.adsc_kategorie, opt_scope: 3});
				}
				if (typeof data.adParams.adsc_fachgebiet != 'undefined') {
					AnalyticsHelper.setCustomVar({index: 9, name: 'Fachgebiet', value: data.adParams.adsc_fachgebiet, opt_scope: 3});
				}
			}

			// GATRACKING
			AnalyticsHelper.trackPageview('/gesundheit/thema/');
		}

		/**
		 * Go To State
		 * (Profile or SearchResult)
		 *
		 * @param type
		 * @param data
		 */
		function goTo(type, data) {

			event.preventDefault();

			var defaultState = 'profile',
				defaultParams = {};

			// Gehe zum Profil
			if (type == 'profile') {

				defaultParams.path = 'profil';
				defaultParams.fullRefId = data.ref_id + '_' + data.art;
				defaultParams.backLinkType = 'expertCategories';
				defaultParams.isSearch = false;

			} else {

				// Suchergebnisliste
				if (vm.category.link.substr(-1) == '/') {
					vm.category.link = vm.category.link.substr(0, vm.category.link.length - 1);
				}

				if (vm.category.link.indexOf('tier') > -1) {
					defaultState = 'searchResultList.gruppe';
				} else {
					defaultState = 'searchResultList.fachgebiet';
				}

				defaultParams.path = vm.category.link;
				defaultParams.params = {
					gruppe: vm.category.premiumPartners[0].typ,
					historyBack: true
				};
			}
			$state.go(defaultState, defaultParams);
		}

		function gotoProfile(teaserDetails, event) {

			event.stopPropagation();

			if (angular.isNumber(+teaserDetails.autor_id)) {

				var fullRefId = teaserDetails.autor_id + '_1';

				$state.go('profile', {
					path: 'profil',
					fullRefId: fullRefId,
					backLinkType: 'expertCategories',
					isSearch: false
				});

				return false;
			}

			if (teaserDetails.autor_url != null) {
				// auf desktop url verlinken
				if (CONFIG.environment == 'app') {
					window.open(CONFIG.apiUrl + teaserDetails.autor_url, '_system', 'location=yes');
				} else {
					window.location.href = CONFIG.apiUrl + teaserDetails.autor_url;
				}
			}

			return false;
		}

		function gotoArticle(url) {

			$state.go('expertArticle', {
				categoryId: vm.currentCategory,
				articleId: url
			});
		}


		function loadMoreArticles(page) {

			var currentUrl = $ionicHistory.currentView().url + 'seite-' + page + '/';

			angular.element('.collection-repeat-after-container').removeAttr('style');

			// get article data
			JamExpertArticlesService.getCategory(currentUrl)

				.success(function(data) {

					// hide loader
					LoaderFactory.hideLoader(600);

					vm.category.currentCategory = $location.path().split("/")[2];

					for (var i = 0; i < data.articles.length; i++) {
						vm.category.articles.push(data.articles[i]);
					}

					vm.category.nextPage = data.nextPage;
				})

				.error(function(errorResponse) {

					// hide loader
					LoaderFactory.hideLoader(600);

					if (status === 404 || status == '404') {
						JamHelperFactory.pageNotFound();
					} else {
						JamHelperFactory.showHashTimeout('', true, false, status);
					}
				});
		}

		function changeTwoLines() {
			event.stopPropagation();
			event.preventDefault();

			if (vm.config.deviceType == 'tablet') return false;
			
			vm.twoLines = (vm.twoLines) ? false : true;
			$ionicScrollDelegate.resize();
		}

		function getBackButtonUrl() {
			var urlParts = '',
				url = '';

			// Über Google gekommen, zurück zur Übersichtsseite
			if ($ionicHistory.backView() == null) {

				urlParts = $location.path().split("/");

				switch (urlParts.length) {
					case 6:
						urlParts.splice(4, 1);
						urlParts.splice(3, 1);
						break;
					case 4:
						urlParts.splice(2, 1);
						break;
				}

				url = urlParts.join('/');

			} else if($ionicHistory.backView().stateName == 'expertOverview') {

				url = '';

			} else {

				urlParts = $ionicHistory.currentView().url.split("/");
				
				if (urlParts.length == 4) {
					urlParts.splice(2, 1);
					url = urlParts.join('/') + '/';
				}
				
				// von Übersichtsseite gekommen
				if (urlParts.length == 3) {
					urlParts.splice(2, 1);
					url = urlParts.join('/') + '/';
				}
			}

			return url;
		}
	}
})();