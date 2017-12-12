(function() {
	'use strict';

	angular.module('app.starRating', []).controller('RatingController', RatingController).directive('starRating', starRating);

	function RatingController() {

		this.isReadonly = true;
		this.rateFunction = function(rating) {};
	}

	function starRating() {
		return {
			restrict: 'EA',
			template:
				'<ul class="star-rating" ng-class="{readonly: readonly}">' +
				'  <li ng-repeat="star in stars" class="star" ng-class="{filled: ((star.filled || star.halfStar) && !star.init), filled2: ((star.filled || star.halfStar) && star.init)}" ng-click="toggle($index)">' +
				'    <i class="icons" ng-class="{\'ion-star\':!star.halfStar,\'ion-ios-star-half\': star.halfStar}" data="{{star.halfStar}}"></i>' + // or &#9733
				'  </li>' +
				'</ul>',

			scope: {
				ratingValue: '=ngModel',
				init: '=?',
				max: '=?', // optional (default is 5)
				onRatingSelect: '&?',
				readonly: '=?'
			},

			link: function(scope) {

				scope.max = scope.max || 5;
				scope.init = scope.init || false;
				scope.readonly = scope.readonly || false;

				if (scope.max >= 5) scope.max = 5;

				/**
				 * Aktualisiere die Sterne und das Objekt
				 */
				function updateStars() {

					var tmpRatingValue = parseFloat(scope.ratingValue).toFixed(1).split('.'),
						halfStar = false,
						ratingValue = parseInt(scope.ratingValue),
						showHalfStar = false;

					scope.stars = [];

					if (typeof tmpRatingValue[1] != 'undefined' && tmpRatingValue[1] != 0) {
						halfStar = true;
					}

					for (var i = 0; i < scope.max; i++) {

						showHalfStar = (i == ratingValue && halfStar);

						scope.stars.push({
							filled: i < ratingValue,
							halfStar: showHalfStar,
							init: scope.init
						});
					}
				}

				// Toggle Sterne
				scope.toggle = function(index) {
					if (scope.readonly === false){
						scope.ratingValue = index + 1;
						scope.onRatingSelect({
							rating: index + 1
						});
					}
				};

				// Überwache die Änderungen
				scope.$watch('ratingValue', function(oldValue, newValue) {
					if (newValue || newValue == 0) {
						updateStars();
					}
				});
			}
		};
	}
})();
