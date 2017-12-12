/**
 * Created by riccardo.carano on 11.03.2016.
 */
(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('textarea', function(){
			return {
				restrict: 'E',
				link: function(scope, element, attr){

					if (attr.allowscroll) {
						element.bind('touchend  touchmove touchstart', function(e){
							e.stopPropagation();
						});
					}

					/*if (attr.minlength) {

						if (element.next('.input-sub-label').length == 0) {

							element.after('<span class="input-sub-label light-font review-sub-label-comment">min. 30 Zeichen</span>');
						}

						element.bind('keyup', function(e){
							e.stopPropagation();


							console.log(element[0].innerHTML)
						});

					}*/
				}
			}
		})
})();