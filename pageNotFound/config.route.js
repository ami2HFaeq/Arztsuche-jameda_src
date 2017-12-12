(function () {
	'use strict';

	angular
		.module('app.pageNotFound',[])
		.config(function($stateProvider) {

			$stateProvider

				.state('pageNotFound', {
					url: "/fehler-404/",
					views: {
						'menuContent': {
							templateUrl: "app/pageNotFound/pageNotFound.html"
						}
					}
				})
				.state('serverError', {
					url: "/wartungsarbeiten/",
					views: {
						'menuContent': {
							templateUrl: "app/pageNotFound/pageNotFound.html"
						}
					}
				});
		});
})();