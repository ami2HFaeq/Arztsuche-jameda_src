/**
 * Created by riccardo.carano on 11.03.2016.
 */
(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('ngCompileBindHtml', ['$compile', function($compile){
			return {
				restrict: 'A',
				replace: true,
				link: function (scope, element, attrs) {
					scope.$watch(attrs.ngCompileBindHtml, function(html) {
						if (typeof html != 'undefined' && html != '') {
							element[0].innerHTML = html;
							$compile(element.contents())(scope);
						}
						html = undefined;
					});
				}
			}
		}])
})();