(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('jamAgb', agb);


	function agb($http, $templateCache, $compile, CONFIG) {

		var directive = {
			restrict: 'E',
			link: function(scope, element) {

				var templateUrl = 'app/directives/agb.html';

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					$compile(element.contents())(scope);

					$http.get(CONFIG.apiUrlMobi + '_php/ajax.php?action=load-agb',{cache: $templateCache}).then(function(response) {
						scope.agbContent = response.data;
					});
				});
			}
		};
		return directive;
	}
})();