(function () {
	'use strict';

	angular
		.module('app.jamDirectives',[])
		.directive('jamFooter', footer)
		.controller('Footer', Footer);


	function footer($http, $templateCache, $compile) {

		var directive = {
			restrict: 'E',
			link: function(scope, element) {

				var templateUrl = 'app/directives/footer.html';

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					$compile(element.contents())(scope);
				});
			}
		};
		return directive;
	}

	Footer.$inject = ['$state', '$ionicHistory', 'CONFIG', 'AnalyticsHelper'];

	function Footer($state, $ionicHistory, CONFIG, AnalyticsHelper) {

		// set view model
		var vm = this;
		vm.changeState = changeState;
		vm.curState = $state.current.name || '';
		
		// desktop switch
		vm.showDesktopSwitch = false;
		vm.config = CONFIG;

		if (CONFIG.environment == 'web') {

			if (vm.curState != 'home' && vm.curState != 'searchByName') {
				vm.showDesktopSwitch = true;
			}
		}

		/**
		 * Change State
		 *
		 * @param params
		 * @returns {boolean}
		 */
		function changeState(params) {
			event.preventDefault();
			event.stopPropagation();

			if (typeof params.stateName == 'undefined') {
				params.stateName = 'staticContents';
			}

			$state.go(params.stateName, params);
			return false;
		}

		function trackDesktopKlick() {

			var currentView = $ionicHistory.currentView().stateName;

			// GATRACKING
			AnalyticsHelper.trackEvent('Sitewide - Klicks', 'Desktop-Ansicht geklickt', currentView, null, true);
			//console.log('Sitewide - Klicks', 'Desktop-Ansicht geklickt', currentView);
		}
		vm.trackDesktopKlick = trackDesktopKlick;
	}
})();