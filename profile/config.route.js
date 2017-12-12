(function () {
	'use strict';

	angular
		.module('app.profile',[])
		.config(function($stateProvider) {

			$stateProvider
				.state('profile', {
					url: "/{path:.*}/uebersicht/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profile.html"
						}
					},
					params: {
						backToPrevPage: false,
						backLinkType: false,
						backToRefId: false,
						isSearch: false,
						doAction: null,
						data: null
					}
				})
				.state('profilearticles', {
					url: "/{path:.*}/artikel/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileArticles.html"
						}
					}
				})
				.state('profilesubs01', {
					url: "/{path:.*}/klinik-abteilungen/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileSubs.html"
						}
					},
					data: {
						subUrl: 'klinik-abteilungen'
					}
				})
				.state('profilesubs02', {
					url: "/{path:.*}/abteilung-aerzte/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileSubs.html"
						}
					},
					data: {
						subUrl: 'abteilung-aerzte'
					}
				})
				.state('profilesubs03', {
					url: "/{path:.*}/geschaeftsstellen/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileSubs.html"
						}
					},
					data: {
						subUrl: 'geschaeftsstellen'
					}
				})
				.state('profilesubs04', {
					url: "/{path:.*}/gemeinschaftspraxis-aerzte/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileSubs.html"
						}
					},
					data: {
						subUrl: 'gemeinschaftspraxis-aerzte'
					}
				})
				.state('profilesubs05', {
					url: "/{path:.*}/praxisgemeinschaft-aerzte/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileSubs.html"
						}
					},
					data: {
						subUrl: 'praxisgemeinschaft-aerzte'
					}
				})
				.state('profilesubs06', {

					url: "/{path:.*}/arztinfos/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileInfo.html"
						}
					}
				})
				.state('profilesubs07', {
					url: "/{path:.*}/praxis-aerzte/:fullRefId/",
					views: {
						'menuContent': {
							templateUrl: "app/profile/profileSubs.html"
						}
					},
					data: {
						subUrl: 'praxis-aerzte'
					}
				})
			;
		});
})();