(function () {
	'use strict';

	angular
		.module('app.otb',[])
		.config(function($stateProvider) {

			$stateProvider
				.state('otb', {
					url: "/{path:.*}/:curStepId/termin-buchen/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/otb/otb.html"
						}
					}
				});
		});
})();