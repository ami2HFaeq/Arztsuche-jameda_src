(function () {
	'use strict';

	angular
		.module('app.premiumContents',[])
		.config(function($stateProvider) {

			$stateProvider

				.state('premiumContents', {
					url: "/{path:.*}/:sectionId/info/:fullRefId/",
					views: {
						menuContent: {
							templateUrl: "app/premiumContents/premiumContents.html"
						}
					}
				});
		});
})();