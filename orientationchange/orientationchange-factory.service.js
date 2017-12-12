(function(){
	'use strict';

	angular
		.module('app.orientationchange',[])
		.factory('OrientationchangeFactory', OrientationchangeFactory);

	OrientationchangeFactory.$inject = ['$state', '$window', 'CONFIG', 'LoaderFactory'];


	function OrientationchangeFactory($state, $window, CONFIG, LoaderFactory) {

		return {
			initListener: initListener
		};


		////////////////////////////////////////////////////////

		function initListener() {

			// check / set ocIsSet
			if (CONFIG.ocIsSet) return true;
			CONFIG.ocIsSet = true;

			if (CONFIG.environment == 'app' && CONFIG.deviceOs == 'Android' && typeof screen != 'undefined') {
				if (CONFIG.deviceType == 'tablet') {
					screen.unlockOrientation();
				} else {
					screen.lockOrientation('portrait');
					return false;
				}
			}
			
			// add event listener
			$window.addEventListener('orientationchange', reload, false);

			// ciao
			return true;
		}


		function reload() {

			if ($state.current.name != 'review') {

				LoaderFactory.showLoader(2, '', '', true);

				// Reload Page, after 1 sec
				$window.setTimeout(function() {
					$window.location.reload(true);
				}, 1000);
			}
		}
	}
})();