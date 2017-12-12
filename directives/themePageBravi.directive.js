/**
 * Created by tiemo.ingrisch on 28.04.2016.
 */

(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('jamThemePageBravi', bravi)
		.controller('Bravi', Bravi);


	function bravi($http, $templateCache, $compile, LoaderFactory) {

		var directive = {
			restrict: 'E',
			scope: {
				currentKatId: '=?'
			},
			link: function(scope, element) {

				var templateUrl = 'app/directives/themePageBravi.html';
				scope.currentKatId = scope.currentKatId || 0;

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					$compile(element.contents())(scope);
				});

				scope.$watch('currentKatId', function(id) {

					if (typeof id != 'undefined' && id != '') {

						$http.get(templateUrl, { cache: $templateCache}).then( function(response) {
							element.html(response.data);
							$compile(element.contents())(scope);

							LoaderFactory.hideLoader(600, true);
						});
					}
					id = undefined;
				});
			}
		};
		return directive;
	}

	Bravi.$inject = ['$q', '$scope', '$window', '$state', '$ionicHistory', '$ionicModal', 'CONFIG', 'JamHelperFactory', 'JamExpertArticlesService', 'LoaderFactory', '$timeout', '$ionicScrollDelegate', '$ionicViewSwitcher'];

	function Bravi($q, $scope, $window, $state, $ionicHistory, $ionicModal, CONFIG, JamHelperFactory, JamExpertArticlesService, LoaderFactory, $timeout, $ionicScrollDelegate, $ionicViewSwitcher) {

		// set view model
		var vm = this;
		vm.showBravi = showBravi;
		vm.hideBravi = hideBravi;
		vm.braviData = [];
		vm.isGroupShown = isGroupShown;
		vm.toggleGroup = toggleGroup;
		vm.goTo = goTo;
		vm.goBack = goBack;
		vm.braviPreviousPage = {};
		vm.braviPreviousPageText = '';
		vm.braviNextPage = '';
		vm.braviNextPageText = '';
		vm.currentBraviObj = {};
		vm.type = '';
		vm.isGoBack = false;
		vm.braviWidthPrev = 0;
		vm.braviWidthNext = 0;
		vm.loaded = false;
		vm.open = false;
		vm.katId = 0;

		initPreviousPageUrl();


		function initPreviousPageUrl() {

			var currentURL = $ionicHistory.currentView().url.split('#')[0],
				urlParts = currentURL.split("/").filter(Boolean),
				params = {};

			// Default / Übersichtsseite
			vm.braviPreviousPage = {
				prevPage: ''
			};
			vm.braviPreviousPageText = 'Übersicht';

			$timeout(function () {
				switch (urlParts.length) {

					// Themenseite
					case 2:
						vm.braviPreviousPage.prevPage = 'expertOverview';

						params.urlParts = urlParts;
						params.id = '';

						break;

					// Artikel
					case 3:
						vm.braviPreviousPage.prevPage = 'expertCategory';
						vm.braviPreviousPage.categoryId = urlParts[1];
						vm.braviPreviousPage.articleId = urlParts[2];

						params.urlParts = urlParts;
						params.id = $scope.currentKatId || 0;

						break;

					// Kategorienseite (Specials)
					case 4:
						vm.type = 'kat';
						vm.braviPreviousPage.prevPage = 'expertCategory';
						vm.braviPreviousPage.categoryId = urlParts[1];
						vm.braviPreviousPage.specialId = urlParts[2];

						params.urlParts = urlParts;
						params.id = '';

						break;
				}

				var timeout = 0;
				if (params.id == 0) {
					timeout = 300;

				}

				$timeout(function() {

					if (params.id == 0) {
						params.id = $scope.currentKatId;
					}

					if (urlParts.length != 1) {

						vm.isGoBack = true;

						getCurrentPageNameFromBravi(params)
							.success(function (pageText) {

								vm.braviPreviousPageText = pageText.prev;
								vm.braviNextPageText = pageText.next;

								if ((pageText.prev != '' && pageText.next != '') || (pageText.prev != '' && pageText.next == '')) {
									vm.loaded = true;
								}

								$timeout(function() {
									vm.open = true;
								}, 10);
							})
							.error(function (errorResponse) {
								vm.braviPreviousPageText = '';
								vm.braviNextPageText = '';
							});
					} else {
						vm.loaded = true;

						$timeout(function() {
							vm.open = true;
						}, 10);
					}
				}, timeout);
			}, 400);
		}


		/**
		 * Gibt ein Objekt mit der vorherigen und der nächsten Seite zurück
		 * @param params
		 * @returns {*| promise}
		 */
		function getCurrentPageNameFromBravi(params) {

			var deferred = $q.defer(),
				promise = deferred.promise,
				pageName = {
					prev: '',
					next: ''
				};

			JamExpertArticlesService.getBraviData('/_scripts/json-api.php')

				.success(function(data) {
					
					// Themenseite
					if (params.urlParts.length == 2) {
						for (var i = 0; i < data.bravi.length; i++) {
							if (data.bravi[i].url == params.urlParts[1]) {
								vm.currentBraviObj = data.bravi[i];
								pageName.prev = 'Übersicht';
								pageName.next = data.bravi[i].thema;
							}
						}
					}

					// Artikel
					if (params.urlParts.length == 3) {
						if (params.id) {
							for (var i = 0; i < data.bravi.length; i++) {

								if (data.bravi[i].url == params.urlParts[1]) {
									vm.currentBraviObj = data.bravi[i];
									pageName.prev = data.bravi[i].thema;
								}

								for (var j = 0; j < data.bravi[i].subKats.length; j++) {
									if (data.bravi[i].subKats[j].id == params.id) {
										pageName.next = data.bravi[i].subKats[j].kat;
									}
								}
							}
						}
					}

					// Kategorienseite
					if (params.urlParts.length == 4) {
						for (var i = 0; i < data.bravi.length; i++) {

							if (data.bravi[i].url == params.urlParts[1]) {
								pageName.prev = data.bravi[i].thema;
							}

							for (var j = 0; j < data.bravi[i].subKats.length; j++) {
								if (data.bravi[i].subKats[j].kat_url) {
									if (data.bravi[i].subKats[j].kat_url == params.urlParts[2]) {
										vm.currentBraviObj = data.bravi[i];
										pageName.next = data.bravi[i].subKats[j].kat;
									}
								}
							}
						}
					}

					deferred.resolve(pageName);
				})

				.error(function() {

					// hide loader
					LoaderFactory.hideLoader(600);
					JamHelperFactory.showHashTimeout();
				});


			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};

			return promise;
		}


		// Cleanup the modal when we're done with it!
		$scope.$on('$destroy', function() {
			if ($scope.modalBravi) {
				$scope.modalBravi.remove();
			}
		});


		/*
		 * if given group is the selected group, deselect it
		 * else, select the given group
		 */
		function toggleGroup(group) {
			if (isGroupShown(group)) {
				vm.shownGroup = null;
			} else {
				vm.shownGroup = group;
			}
		}


		function isGroupShown(group) {
			var groupShown = false;

			if (vm.shownGroup) {
				if (vm.shownGroup.id === group.id) {
					groupShown = true;
				}
			}
			return groupShown;
		}


		function showBravi(type) {
			event.preventDefault();
			event.stopPropagation();

			if (type == 'prev' && vm.type == 'kat') {
				vm.goTo(vm.braviPreviousPage);
			} else {

				// get article data
				JamExpertArticlesService.getBraviData('/_scripts/json-api.php')

					.success(function(data) {

						// hide loader
						LoaderFactory.hideLoader(600);

						vm.braviData = data;

						vm.shownGroup = vm.currentBraviObj;

						// Bravi Modal
						$scope.modalBravi = null;

						$ionicModal.fromTemplateUrl('app/expertArticles/bravi/bravi.html', {
							scope: $scope,
							animation: 'slide-in-down'
						}).then(function (modal) {
							$scope.modalBravi = modal;

							$scope.modalBravi.show().then(function() {
								if (typeof vm.shownGroup.id != 'undefined') {

									var baseUrl = $window.location.href.split('#')[0];
									if (CONFIG.environment == 'app') {
										baseUrl = baseUrl+'#'+$window.location.href.split('#')[1];
									}
									window.location.replace(baseUrl+'#bravi-item-'+vm.shownGroup.id);

									$timeout(function() {
										$ionicScrollDelegate.$getByHandle('bravi-container').anchorScroll();
									}, 100);
								}
							});
						});
					})

					.error(function(errorResponse) {

						// hide loader
						LoaderFactory.hideLoader(600);
						JamHelperFactory.showHashTimeout();
					});
			}
		}


		function hideBravi() {
			$scope.modalBravi.hide();
			$scope.modalBravi.remove();
		}

		function goTo(url) {

			var urlParts = url.split("/").filter(Boolean);

			// Bereits aktuelle Seite? Schließe das Modal wieder um Requests zu sparen und um Fehler zu vermeiden
			if ((urlParts.length == 1 && $state.params.categoryId == urlParts[0]) || (urlParts.length > 1 && $state.params.categoryId == urlParts[0] && $state.params.specialId == urlParts[1])) {
				hideBravi();
				urlParts = undefined;
				return true;
			}

			if (urlParts.length > 1) {
				// Kategorieseite
				$state.go('expertSpecial', {
					categoryId: urlParts[0],
					specialId: urlParts[1]
				});
			} else {
				// Themenseite
				$state.go('expertCategory', {
					categoryId: urlParts[0]
				});
			}

			// Modal-View schließen
			hideBravi();
			urlParts = undefined;
		}
		
		
		function goBack(page) {

			if (page.prevPage == 'expertCategory') {
				$ionicViewSwitcher.nextDirection('back');
				$state.go('expertCategory', {
					categoryId: page.categoryId
				});
			}

			if (page.prevPage == 'expertOverview') {
				$ionicViewSwitcher.nextDirection('back');
				$state.go('expertOverview');
			}
		}
	}
})();