(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('jamMiniProfile', miniProfile);
	
	function miniProfile($http, $templateCache, $compile, $timeout, JamHelperFactory, CONFIG) {

		var directive = {
			restrict: 'E',
			link: function(scope, element, attrs) {

				$timeout(function() {

					// change application template
					var templateUrl = 'app/directives/miniProfile-phone.html';

					if (attrs.templateType) {
						if (attrs.templateType == 'jam-is-tablet') {
							templateUrl =  'app/directives/miniProfile-tablet.html';
						}
					}

					$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
						element.html(response.data);
						$compile(element.contents())(scope);
					});

					// default settings
					scope.showMiniProfileButtons = true;
					scope.portraitClass = (scope.config.deviceType == 'tablet' && scope.config.deviceOrientation == 'landscape') ? 'portrait-medium' : 'portrait-small';
					scope.showProfileDetails = true;
					scope.profileHeader = (scope.data && scope.data.name_nice) ? scope.data.name_nice : '-';
					scope.subType = 'unknown';
					scope.config = CONFIG;

					// check mini profile type
					if (attrs.templateSubType) {

						scope.subType = attrs.templateSubType;

						switch (attrs.templateSubType) {
							case 'review':
								// mini profile
								scope.portraitClass = 'portrait-mini';

								// Extend Header
								if (typeof scope.data  != 'undefined' && typeof scope.data.name_nice != 'undefined') {
									scope.profileHeader = 'Bewerten Sie<br />' + scope.data.name_nice;
								} else {
									$timeout(function() {
										if (typeof scope.data  != 'undefined' && typeof scope.data.name_nice != 'undefined') {
											scope.profileHeader = 'Bewerten Sie<br />' + scope.data.name_nice;
										}
									}, 500);
								}

								// Hide stuff
								scope.showMiniProfileButtons = false;
								scope.showProfileDetails = false;
								break;
							default:

								// Set Header
								if (typeof scope.data  != 'undefined' && typeof scope.data.name_nice != 'undefined') {
									scope.profileHeader = scope.data.name_nice;
								} else {
									$timeout(function() {
										if (typeof scope.data  != 'undefined' && typeof scope.data.name_nice != 'undefined') {
											scope.profileHeader = scope.data.name_nice;
										}
									}, 500);
								}
								break;
						}
					} else {

						// Set Header
						if (typeof scope.data  != 'undefined' && typeof scope.data.name_nice != 'undefined') {
							scope.profileHeader = scope.data.name_nice;
						} else {
							$timeout(function() {
								if (typeof scope.data  != 'undefined' && typeof scope.data.name_nice != 'undefined') {
									scope.profileHeader = scope.data.name_nice;
								}
							}, 500);
						}
					}

					// go To Profile
					scope.miniGoToProfile = function() {

						var params = {
							state: 'profile',
							stateGoParams: {
								backToPrevPage: true,
								fullRefId: scope.data.fullRefId
							},
							data: scope.data
						};
						JamHelperFactory.goToProfileUrl(params);
					}
				}, 200);
			}
		};
		return directive;
	}
})();