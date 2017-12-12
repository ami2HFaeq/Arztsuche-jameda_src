(function () {
	'use strict';

	angular
		.module('app.lastSearchList')
		.controller('LastSearchList', LastSearchList);

	LastSearchList.$inject = ['$scope', '$ionicConfig', 'CONFIG', 'JamHelperFactory', '$state', 'LoaderFactory',
							  '$timeout', 'AnalyticsHelper' ,'OrientationchangeFactory', 'CacheFactory', '$ionicPopup'];

	function LastSearchList($scope, $ionicConfig, CONFIG, JamHelperFactory, $state, LoaderFactory,
							$timeout, AnalyticsHelper, OrientationchangeFactory, CacheFactory, $ionicPopup) {

		/* ViewModel */
		var vm = this;

		// set back button txt
		$ionicConfig.backButton.text("zurück");

		// variables
		vm.pageTitle = 'Letzte Suchen';
		vm.lastSearch = [];

		vm.isTablet = (CONFIG.deviceType == 'tablet') ? true : false;

		// config
		vm.config = CONFIG;
		$scope.JamHelperFactory = JamHelperFactory;

		// methods
		vm.getLastSearch = getLastSearch;
		vm.clearCache = clearCache;

		vm.lastSearchList = false;
		vm.loadLastSearch = loadLastSearch;
		vm.searchParamsObject = {};

		///////////////////////////////


		$scope.$on('$ionicView.beforeEnter',function() {
			LoaderFactory.hideLoader();
		});

		$scope.$on('$ionicView.afterEnter', function() {

			vm.lastSearch = vm.getLastSearch();

			// add event listener
			OrientationchangeFactory.initListener();

			// set back button?
			if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') {
				$timeout(function() {
					JamHelperFactory.resetBackButton();
				}, CONFIG.backButtonDelay);
			} else {
				$timeout(function() {
					JamHelperFactory.setBackButton('burger');
				}, CONFIG.backButtonDelay);
			}

			// GATRACKING
			AnalyticsHelper.trackPageview('/letzte-suchen/');

			// set canonical
			JamHelperFactory.setCanonical('https://www.jameda.de/arztsuche/', false);
		});

		$scope.$on('$ionicView.beforeLeave', function() {
			JamHelperFactory.resetBackButton();
		});

		// #####################
		// methods
		// #####################

		/**
		 * Get last search object from cache
		 *
		 * @returns {Array}
		 */
		function getLastSearch() {

			CacheFactory.getFromCache('searchCache').then(function(searchFromCache) {
				vm.lastSearchList = CacheFactory.lastSearchList(searchFromCache);
			}, function() {
				vm.lastSearchList = false;
			});
		}

		/**
		 * Loads the klicked last search
		 *
		 */
		function loadLastSearch(params) {

			// Profil
			if (typeof params.objFromCache.what_name_nice.refId !== 'undefined' && params.objFromCache.what_name_nice.refId != '') {
				// direkt auf das Profil leiten
				$state.go('profile', {
					fullRefId: params.objFromCache.what_name_nice.refId,
					path: 'profil',
					backLinkType: 'deeplink',
					isSearch: true
				});
			} else {
				// Fach-/ Ortssuche
				vm.searchParamsObject.search = params.objFromCache.search;
				vm.searchParamsObject.was = params.objFromCache.stateParams.was;
				vm.searchParamsObject.was_i = params.objFromCache.stateParams.was_i;
				vm.searchParamsObject.was_sel = params.objFromCache.stateParams.was_sel;
				vm.searchParamsObject.address = params.objFromCache.stateParams.address;
				vm.searchParamsObject.address_i = params.objFromCache.stateParams.address_i;
				vm.searchParamsObject.address_sel = params.objFromCache.stateParams.address_sel;
				vm.searchParamsObject.gruppe = params.objFromCache.stateParams.gruppe;
				vm.searchParamsObject.geo = params.objFromCache.stateParams.geo;
				vm.searchParamsObject.dist = params.objFromCache.stateParams.dist;
				vm.searchParamsObject.fachgebiet = params.objFromCache.stateParams.fachgebiet;

				$state.go('searchResultList', vm.searchParamsObject);
			}
		}

		function clearCache() {

			var confirmPopup = $ionicPopup.confirm({
				cssClass: 'confirm-last-search',
				title: 'Suchverlauf löschen',
				template: 'Möchten Sie den kompletten Verlauf Ihrer letzten Suchen löschen?',
				cancelText: 'Abbrechen',
				okText: 'Löschen'
			});
			confirmPopup.then(function(res) {
				if(res) {
					CacheFactory.clearLocalStorageKey('searchCache');
					$state.go('lastSearchList', {}, { reload: true });
				}
			});
		}
	}
})();