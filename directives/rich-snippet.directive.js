(function () {
	'use strict';
	angular.module('app.jamDirectives').directive('richSnippet', function($sce, $filter, $state, $location) {

		return {
			restrict: 'EA',
			replace: true,
			template: function() {
				return '<script type="application/ld+json" ng-bind-html="onGetJson()"></script>';
			},
			scope: {
				profileData: '=?profileData',
				reviewData: '=?reviewData',
				articleData: '=?articleData'
			},
			link: function(scope) {

				var richSnippetObject = {};
				scope.$watchGroup(['profileData', 'articleData'], function() {
					if (typeof scope.profileData !== 'undefined' || typeof scope.articleData !== 'undefined') {
						richSnippetObject = getRichSnippet(scope);
					}
				});

				/**
				 * Hole das Rich-Snippet für Suchmaschinen
				 *
				 * @param scope
				 * @returns {{@context: string, @type: string, name: *, jobTitle: (*|string|string|string), affiliation: *, additionalName: *, url: string, aggregateRating: {@type: string, ratingValue: *, ratingCount: *}}}
				 */
				function getRichSnippet(scope) {

					var url, richSnippetObject;

					if (typeof scope.profileData !== 'undefined') {
						url = 'https://www.jameda.mobi'+scope.profileData.url,
						richSnippetObject = {
							"@context": "http://schema.org",
							"@type": "LocalBusiness",
							"name": scope.profileData.name_nice,
							"jobTitle": scope.profileData.fachStringComplete,
							"affiliation": scope.profileData.inst_name_nice,
							"additionalName": scope.profileData.name_kurz,
							"url": url+'uebersicht/'+scope.profileData.url_hinten,
							"aggregateRating": {
								"@type": "AggregateRating",
								"ratingValue": scope.profileData.gesamt_note,
								"ratingCount": scope.profileData.bewertungen
							}
						};
					} else if (typeof scope.articleData !== 'undefined' && Object.keys(scope.articleData).length != 0) {

						var date = new Date(scope.articleData.article.datum * 1000),
							ratingValue = parseFloat(Math.round(scope.articleData.article.total_value/scope.articleData.article.total_votes * 100) / 100).toFixed(1),
							ratingCount = scope.articleData.article.total_votes;

						ratingCount = +ratingCount || 0;
						ratingValue = +ratingValue || 0;
						date.setDate(date.getDate() + 1);

						richSnippetObject = {
							"@context": "http://schema.org",
							"@type": "Article",
							"mainEntityOfPage": {
								"@type": "WebPage",
								"@id": $location.absUrl()
							},
							"datePublished": date.toISOString(),
							"dateModified": date.toISOString(),
							"publisher": {
								"@type": "Organization",
								"name": "jameda GmbH",
								"logo": {
									"@type": "ImageObject",
									"url": "https://www.jameda.mobi/img/jameda-Logo-ohne-Claim@2x.png",
									"width": 204,
									"height": 59
								}
							},
							"image": {
								"@type": "ImageObject",
								"url": scope.articleData.image.url,
								"height": scope.articleData.image.height,
								"width": scope.articleData.image.width
							}
						};

						if (ratingCount > 0 && ratingValue > 0) {
							richSnippetObject.aggregateRating = {
								"@type": "AggregateRating",
								"ratingValue": ratingValue,
								"reviewCount": ratingCount
							};
						}

						if (scope.articleData.article.titel) {
							richSnippetObject.headline = scope.articleData.article.titel;
						}

						if (scope.articleData.autor.name_nice) {
							richSnippetObject.author = {
								"@type": "Person",
								"name": scope.articleData.autor.name_nice
							};
						}

					} else {
						return {};
					}

					// Sind die Daten für eine Einzelbewertung vorhanden? => Füge weitere Elemente hinzu
					if (typeof scope.reviewData != 'undefined' && typeof scope.reviewData.b_date != 'undefined') {
						richSnippetObject.review = {
							"@type": "Review",
							"author": {
								"@type": "Person",
								"name": "Patient "+$filter('date')(new Date(scope.reviewData.b_date*1000), 'dd.MM.yyyy')
							}
						};

						// Bereite die URL für die Einzelbewertung vor (bzw. Überschreibe die Profil-URL)
						richSnippetObject.url = url+'bewertung/';
						if (typeof $state.params.fullRefRateId != 'undefined' && $state.params.fullRefRateId != '') {
							richSnippetObject.url += $state.params.fullRefRateId + '/';
						} else {
							richSnippetObject.url += scope.profileData.fullRefId + '_' + scope.reviewData.b_id + '/';
						}

						// Füge das Rating hinzu, wenn die Bewertung aktiv ist (mit Note)
						if (scope.reviewData.b_stand == 1 || scope.reviewData.b_stand == 2) {
							richSnippetObject.review.reviewRating = {
								"@type": "Rating",
								"ratingValue": scope.reviewData.gesamt_note
							};
						}
					}
					url = undefined;
					return richSnippetObject;
				}

				scope.onGetJson = function() {
					return $sce.trustAsHtml($filter('json')(richSnippetObject));
				}
			}
		};
	});
})();