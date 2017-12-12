/**
 * Created by riccardo.carano on 06.07.2016.
 */
(function () {
	'use strict';
	angular.module('app.jamDirectives').directive('jamDefaultTemplate', function ($http, $templateCache, $compile, CONFIG) {

		var directive = {
			restrict: 'E',
			scope: true,
			link: function (scope, element, attr) {
				var templateUrl = attr.phone;

				if (attr.tablet && CONFIG.deviceType == 'tablet') {
					if (attr.tabletPortrait && CONFIG.deviceOrientation == 'portrait') {
						templateUrl = attr.tabletPortrait;
					} else if (CONFIG.deviceOrientation == 'portrait') {
						templateUrl = attr.phone;
					} else {
						templateUrl = attr.tablet;
					}
				}

				// Template nur laden, wenn auch ein Wert gesetzt ist
				if (typeof templateUrl != 'undefined' && templateUrl != '' && templateUrl != null) {
					$http.get(templateUrl + '.html', {cache: $templateCache}).then(function (response) {
						element.html(response.data);
						$compile(element.contents())(scope);
					});
				}
			}
		};
		return directive;
	});
})();