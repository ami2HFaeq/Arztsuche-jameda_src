(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.controller('JamAdsController', JamAdsController)
		.directive('jamAds', googleAds);

	
	JamAdsController.$inject = ['CONFIG', '$timeout'];

	function JamAdsController(CONFIG, $timeout) {

		if (typeof window.google_iframe_oncopy != 'undefined') {

			// set counter
			CONFIG.gaCounter = Object.keys(window.google_iframe_oncopy.handlers).length;

			// return false if >3 elements exist
			if (Object.keys(window.google_iframe_oncopy.handlers).length > 6) {
				
				window.setTimeout(function() {

					var navView = angular.element('[nav-view="active"]');
					if (navView.length == 0) {
						navView = angular.element('[nav-view="staged"]');
						if (navView.length == 0) {
							navView = angular.element('[nav-view="entering"]');
						}
					}

					var curAds = navView.find('.adsbygoogle');
					curAds.parent().remove();

				}, 500);

				return false;


				/*var tmp1 = angular.element('ion-view[nav-view="active"] .adsbygoogle');
				var tmp2 = angular.element('ion-view[nav-view="staged"] .adsbygoogle');
				var tmp3 = angular.element('ion-view[nav-view="entering"] .adsbygoogle');

				tmp1.css('border', '5px solid #f00');

				console.log('tmp1', tmp1);
				console.log('tmp2', tmp2);
				console.log('tmp3', tmp3);

				// get elements
				var navView = $('[nav-view="active"]');
				if (navView.length == 0) {
					navView = $('[nav-view="staged"]');
					if (navView.length == 0) {
						navView = $('[nav-view="entering"]');
					}
				}*/



				//return false;
			}

			/*if (false) {
				angular.element('ion-view[nav-view="active"] .adsbygoogle').html('');

				Object.keys(window).filter(function(k) { return /google/.test(k) }).forEach(
					function(key) {
						delete(window[key]);
					}
				);

				$('script[src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').remove();
				$('body').append('<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>');
			}*/
		}

		// Add Ads now
		$timeout(function() {
			try {
				//noinspection JSUnresolvedVariable
				(adsbygoogle = window.adsbygoogle || []).push({});
			} catch(e) {}
		},500);
	}

	function googleAds() {

		var directive = {
			restrict: 'E',
			replace: true,
			template: '<ins class="adsbygoogle" style="display: block;" data-ad-client="ca-pub-6619721971448052"></ins>',
			controller : JamAdsController
		};
		return directive;
	}
})();