
(function () {
	'use strict';

	angular
		.module('app.expertArticles')
		.directive('jamExpertArticle', expertArticle);


	function expertArticle($http, $templateCache, $compile) {

		var directive = {
			restrict: 'E',
			link: function(scope, element,attr) {

				var templateUrl = 'app/expertArticles/article/expertArticle-phone.html';
				if (attr.templateType && attr.templateType == 'jam-is-tablet') {
					templateUrl =  'app/expertArticles/article/expertArticle-tablet.html';
				}

				$http.get(templateUrl, {cache: $templateCache}).then( function(response) {
					element.html(response.data);
					$compile(element.contents())(scope);
				});

			}
		};

		return directive;
	}

})();