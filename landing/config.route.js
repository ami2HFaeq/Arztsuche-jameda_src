(function () {
	'use strict';
	angular.module('app.landing',[]).config(function($stateProvider) {

		$stateProvider
			.state('landingProblem', {
				cache: false,
				url: "/landing/problemmeldung/status/:reviewId/:pmId/?hash",
				views: {
					'menuContent': {
						templateUrl: "app/landing/reviewProblemStatus.html"
					}
				},
				params: {
					reviewId: 0,
					pmId: 0,
					hash: null
				}
			});
	});
})();