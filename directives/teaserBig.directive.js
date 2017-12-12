/**
 * Created by tiemo.ingrisch on 12.04.2016.
 */

(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('jamTeaserBig', teaserBig)
		.controller('TeaserBig', TeaserBig);


	function teaserBig($http, $templateCache, $compile, CONFIG) {

		var directive = {
			restrict: 'E',
			scope: {
				teaserData: '=teaserData'
			},
			link: function(scope, element) {

				var templateUrl = 'app/directives/teaserBig.html';

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					scope.config = CONFIG;
					scope.isTabletPortrait = (CONFIG.deviceType == 'tablet') ? true : false;
					$compile(element.contents())(scope);
				});
			}
		};
		return directive;
	}

	TeaserBig.$inject = ['$state', '$location', 'CONFIG', 'AnalyticsHelper'];

	function TeaserBig($state, $location, CONFIG, AnalyticsHelper) {

		// set view model
		var vm = this;

		vm.gotoArticle = gotoArticle;
		vm.gotoProfile = gotoProfile;
		vm.stringFormat = stringFormat;

		vm.currentCategory = $location.path().split("/")[2];
		

		function gotoArticle(item) {

			var categoryId = vm.currentCategory;

			if (typeof item == 'undefined') {
				return '';
			}
			if (typeof categoryId != 'undefined' && categoryId == '') {
				categoryId = item.category_url;
			}

			// Beispiele, wie die Url von der API kommt:
			// 1. /gesundheit/augen-sehen/was-tun-wenn-die-sehkraft-nachlaesst/
			// 2. /krankheiten-lexikon/augenentzuendungen/
			// 3. was-tun-wenn-die-sehkraft-nachlaesst
			// 4. /landing/subdomains/kinderwunsch/Kinderwunsch-Whitepaper.pdf
			// 5. /gesundheit/downloads/pollen-allergie-selbsttest/
			if (item.url.indexOf('/') != -1) {

				var urlParts = item.url.split("/").filter(Boolean),
					lastUrlItem = urlParts[urlParts.length-1];
				
				if (urlParts[0].indexOf('gesundheit') != -1 && urlParts[1].indexOf(categoryId) != -1) {
					// interne Url

					$state.go('expertArticle', {
						categoryId: categoryId,
						articleId: lastUrlItem
					});
				} else {
					// externe Url
					window.open(CONFIG.apiUrl + item.url, CONFIG.urlPopupTarget, 'location=yes');
				}
			} else {
				// interne Url
				
				$state.go('expertArticle', {
					categoryId: categoryId,
					articleId: item.url
				});
			}
		}


		function gotoProfile(teaserDetails, event) {

			event.stopPropagation();

			if (angular.isNumber(+teaserDetails.autor_id) && !isNaN(teaserDetails.autor_id)) {

				var fullRefId = teaserDetails.autor_id + '_1';

				$state.go('profile', {
					path: 'profil',
					fullRefId: fullRefId,
					backLinkType: 'expertCategories',
					isSearch: false
				});
				return false;
			}

			if (teaserDetails.autor_url != null) {
				// auf desktop url verlinken
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