(function(){
	'use strict';

	angular
		.module('app.helper')
		.service('JamBannerService', JamBannerService)
		.controller('JamBannerController', JamBannerController);

	JamBannerService.$inject = ['$compile', 'CONFIG', 'JamHelperFactory'];

	function JamBannerService($compile, CONFIG, JamHelperFactory) {

		var vm = this;
		vm.show = true;

		vm.template =
			'<div ng-controller="JamBannerController as banner">' +
				'<div class="banner-container" ng-if="banner.show" ng-class="{\'open\': banner.addClass}">' +
					'<div class="logo"></div>' +
					'<div class="banner-content">' +
						'<h3>{{banner.appName}}</h3>' +
						'<i class="icons ion-star" ng-repeat="i in getNumber(banner.countStars) track by $index" ng-class="{\'filled\': $index < banner.starsFull}"></i>' +
						'<p>{{banner.appCompany}}<br>{{banner.appPrice}} - In Google Play</p>' +

						'<a href="market://details?id=de.jameda.android.arztsuche" ng-click="banner.track(1);">Anzeigen</a>' +
					'</div>' +
					'<div class="close" ng-click="banner.closeBanner()"><i class="icons ion-android-close"></i></div>' +
				'</div>' +
			'</div>';

		return {
			show: show
		};

		////////////////////////////////////////////////////////

		/**
		 * Show SmartAppBanner
		 * @param scope
		 */
		function show(scope) {

			window.setTimeout(function() {

				vm.hide = JamHelperFactory.getFromCache('androidBanner', 0);

				// Only for development
				//vm.hide = false;

				if (CONFIG.environment == 'web' && CONFIG.deviceOs == 'Android' && !vm.hide) {

					angular.element('body').append($compile(vm.template)(scope));
				}
			},1);
		}
	}

	JamBannerController.$inject = ['$state', '$scope', 'JamHelperFactory', 'AnalyticsHelper'];

	function JamBannerController($state, $scope, JamHelperFactory, AnalyticsHelper) {

		var vm = this;
		vm.appName = 'Arztsuche jameda';
		vm.appLink = 'de.jameda.android.arztsuche';
		vm.appCompany = 'jameda GmbH';
		vm.appPrice = 'GRATIS';
		vm.show = true;
		vm.addClass = false;

		vm.countStars = 5;
		vm.starsFull = 4;

		vm.closeBanner = closeBanner;
		vm.track = track;
		vm.checkState = checkState;

		// init
		vm.checkState($state.current.name, 1);


		/**
		 * Close Smart App Banner
		 * close (slide down - animation via css) and remove element
		 */
		function closeBanner() {

			hideBanner();

			window.setTimeout(function() {

				vm.track();
				JamHelperFactory.setIntoCache('androidBanner', true);
			}, 1200);
		}


		/**
		 * Hide Banner
		 * @returns {*}
		 */
		function hideBanner() {
			vm.addClass = false;
		}


		/**
		 * Show Banner with timeout
		 */
		function showBanner() {

			var hidden = JamHelperFactory.getFromCache('androidBanner', 0);

			if (!hidden) {

				vm.show = true;

				setTimeout(function() {
					vm.addClass = true;
				}, 300);

			} else {

				vm.show = false;
				vm.addClass = false;
			}
		}


		/**
		 * Track EventHandler
		 * @param typ
		 */
		function track(typ) {

			typ = typ || 0;

			var msg = (typ == 0) ? 'Geschlossen' : 'Store geöffnet';
			AnalyticsHelper.trackEvent('Smart-App-Banner', msg);
			msg = undefined;

			// Close Banner!
			if (typ == 1) {
				closeBanner();
			}
		}


		/**
		 * Check State if we show or hide banner
		 *
		 * @param stateName
		 */
		function checkState(stateName, type) {

			var notShowInState = [
				'home',
				'otb',
				'review',
				'searchByName',
				'userLogin',
				'userForgotPassword',
				'userRegister',
				'userProfileData',
				'userMainMenu',
				'userAppointments',
				'userEvaluates',
				'userEvaluatesSingle',
				'userFavourites'
			];

			if (notShowInState.indexOf(stateName) > -1) {

				if (vm.show) vm.show = false;
				vm.addClass = false;

			} else {

				if (type == 1) {
					showBanner();
				}
			}

			notShowInState = undefined;
		}

		// Do we need the banner?
		$scope.$on("$stateChangeStart",function(event, toState, toParams, fromState, fromParams) {

			vm.checkState(toState.name, 0);
		});

		$scope.$on("$stateChangeSuccess",function(event, toState, toParams, fromState, fromParams) {

			vm.checkState(toState.name, 1);
		});

		// Create Array of number
		$scope.getNumber = function(num) {
			return new Array(num);
		}
	}
})();