(function () {
	'use strict';

	angular
		.module('app.searchByName',[])
		.config(function($stateProvider) {

			$stateProvider
				.state('searchByName', {
					url: "/namenssuche/",
					views: {
						'menuContent': {
							templateUrl: "app/searchByName/searchByName.html"
						}
					}
				});
		});
})();