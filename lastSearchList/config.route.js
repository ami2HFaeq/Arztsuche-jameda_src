(function () {
	'use strict';

	angular
		.module('app.lastSearchList',[])
		.config(function($stateProvider) {

			$stateProvider
				.state('lastSearchList', {
					url: "/lastSearchList/",
					views: {
						'menuContent': {
							templateUrl: "app/lastSearchList/lastSearchList.html"
						}
					}
				});
		});
})();