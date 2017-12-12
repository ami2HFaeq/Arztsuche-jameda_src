(function () {
	'use strict';

	angular
		.module('app.lastSearchList')
		.directive('jamLastSearchList', lastSearchList);

	function lastSearchList($http, $templateCache, $compile) {


		var directive = {
			restrict: 'E',
			scope: true,

			link: function(scope, element, attr) {

				var templateUrl = 'app/lastSearchList/lastSearchList-phone.html';

				if (attr.templateType) {
					if (attr.templateType == 'jam-is-tablet') {
						templateUrl =  'app/lastSearchList/lastSearchList-tablet.html';
					}
				}

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					$compile(element.contents())(scope);
				});

			}
		};
		return directive;
	}

})();