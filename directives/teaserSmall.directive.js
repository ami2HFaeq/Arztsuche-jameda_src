/**
 * Created by tiemo.ingrisch on 12.04.2016.
 */

(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('jamTeaserSmall', teaserSmall)
		.controller('TeaserSmall', TeaserSmall);


	function teaserSmall($http, $templateCache, $compile) {

		var directive = {
			restrict: 'E',
			scope: {
				teaserData: '=teaserData'
			},
			link: function(scope, element) {

				var templateUrl = 'app/directives/teaserSmall.html';

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					$compile(element.contents())(scope);
				});
			}
		};
		return directive;
	}

	TeaserSmall.$inject = ['$state', 'CONFIG', '$location', 'JamHelperFactory'];

	function TeaserSmall($state, CONFIG, $location, JamHelperFactory) {

		// set view model
		var vm = this;
		vm.gotoArticle = gotoArticle;
		vm.gotoProfile = gotoProfile;
		vm.stringFormat = stringFormat;

		vm.currentCategory = $location.path().split("/")[2];

		vm.hideMore = false;

		if (window.ionic.Platform.version() < 4.6 && CONFIG.deviceOs == 'Android') {
			vm.hideMore = true;
		}

		/**
		 * Route zum Artikel
		 * @param item
		 */
		function gotoArticle(item) {

			var categoryId = vm.currentCategory;

			if (typeof categoryId != 'undefined' && categoryId == '') {
				categoryId = item.category_url;
			}

			if (item.url.indexOf('/') != -1) {

				var urlParts = item.url.split("/").filter(Boolean),
					lastUrlItem = urlParts[urlParts.length-1];

				if (urlParts[0].indexOf('gesundheit') != -1 && urlParts[1].indexOf(categoryId) != -1) {
					// interne Url
					$state.go('expertArticle', {
						categoryId: categoryId,
						articleId: lastUrlItem,
						goToOverview: (vm.currentCategory) ? false : true
					});
				} else {
					// externe Url
					window.open(CONFIG.apiUrl + item.url, CONFIG.urlPopupTarget, 'location=yes');
				}
			} else {
				// interne Url

				$state.go('expertArticle', {
					categoryId: categoryId,
					articleId: item.url,
					goToOverview: (vm.currentCategory) ? false : true
				});
			}
		}


		/**
		 * Ruft Profil oder externe Seite auf
		 * @param teaserDetails
		 * @param event
		 * @returns {boolean}
		 */
		function gotoProfile(teaserDetails, event) {

			event.stopPropagation();

			// Profil aufrufen
			if (angular.isNumber(+teaserDetails.autor_id) && !isNaN(teaserDetails.autor_id)) {

				var urlParts = teaserDetails.autor_url.split("/"),
					fullRefId = urlParts[urlParts.length-2],
					params = {
						state: 'profile',
						stateGoParams: {
							path: 'profil',
							fullRefId: fullRefId,
							backLinkType: 'expertCategories',
							isSearch: false
						},
						data: teaserDetails
					};
				JamHelperFactory.goToProfileUrl(params);

				return false;
			}

			// auf desktop url verlinken
			if (teaserDetails.autor_url != null) {

				if (CONFIG.environment == 'app') {
					window.open(CONFIG.apiUrl + teaserDetails.autor_url, CONFIG.urlPopupTarget, 'location=yes');
				} else {
					window.location.href = CONFIG.apiUrl + teaserDetails.autor_url;
				}
			}
			return false;
		}

		function stringFormat(val) {
			return (typeof val != 'undefined') ? val.replace(/\\"/gi,'"') : '';
		}
	}
})();