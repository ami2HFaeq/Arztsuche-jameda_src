(function(){
	'use strict';

	angular
		.module('app.expertArticles')
		.service('JamExpertArticlesService', JamExpertArticlesService);

	JamExpertArticlesService.$inject = ['$q', 'JamSyncService', 'JamHelperFactory', 'CONFIG'];

	function JamExpertArticlesService($q, JamSyncService, JamHelperFactory, CONFIG) {

		return {
			getOverview: getOverview,
			getCategory: getCategory,
			getArticle: getArticle,
			getBraviData: getBraviData,
			getComments: getComments,
			saveComment : saveComment,
			saveRating: saveRating
		};


		////////////////////////////////////////////////////////

		function getOverview(page, force) {

			force = force || false;
			page = page || '';

			if (page != '') {
				page = 'seite-' + page + '/';
			}

			var deferred = $q.defer(),
				promise = deferred.promise;

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};
			
			JamSyncService.ajax(CONFIG.apiUrl + '/gesundheit/' + page).success(function(resultSuccess) {

				if (resultSuccess.error == false && resultSuccess.data.articles) {
					deferred.resolve(resultSuccess.data);
				} else {
					deferred.reject(resultSuccess);
				}

			}).error(function(resultError) {
				deferred.reject(resultError);
			});

			return promise;
		}


		function getCategory(url) {

			// todo: Für App noch anpassen (#/gesundheit/schmerzen/#Labortechnik)
			url = url.split('#');
			url = url[0];

			var categoryData = JamHelperFactory.getContentFromCache(url, 'categoryCache'),
				deferred = $q.defer(),
				promise = deferred.promise;

			if (!categoryData) {

				if (!isValidArticleUrl(url)) {

					deferred.resolve({});

				} else {

					// Kategorie-Daten per jsonp laden

					// create ajax Call
					JamSyncService.ajax(CONFIG.apiUrl + url)
						.success(function(result) {

							if (typeof result.error != 'undefined' && result.error) {
								JamHelperFactory.removeContentFromCache('categoryCache');
								deferred.reject(result);
							} else {

								JamHelperFactory.addContentToCache(url, result.data, 'categoryCache');
								deferred.resolve(result.data);
							}
						})
						.error(function(result) {
							JamHelperFactory.removeContentFromCache('categoryCache');
							deferred.reject(result);
						});
				}
			} else {
				deferred.resolve(categoryData);
			}


			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};


			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};


			return promise;
		}

		/**
		 * Artikel Daten abrufen
		 *
		 * @param url
		 * @returns {*|promise}
		 */
		function getArticle(url) {

			// todo: Für App noch anpassen (#/gesundheit/schmerzen/#Labortechnik)
			url = url.split('#');
			url = url[0];

			var articleData = JamHelperFactory.getContentFromCache(url, 'articleCache'),
				apiUrl = '',
				deferred = $q.defer(),
				promise = deferred.promise;

			if (!articleData) {

				if (!isValidArticleUrl(url)) {
					deferred.reject({});
				} else {

					// Artikel Daten per jsonp laden

					// create ajax Call
					JamSyncService.ajax(CONFIG.apiUrl + url)
						.success(function(result) {

							if (typeof result.error != 'undefined' && result.error) {
								JamHelperFactory.removeContentFromCache('articleCache');
								deferred.reject(result);

							} else {

								JamHelperFactory.addContentToCache(url, result.data, 'articleCache');
								deferred.resolve(result.data);
							}
						})
						.error(function(result) {
							JamHelperFactory.removeContentFromCache('articleCache');
							deferred.reject(result);
						});
				}

			} else {
				deferred.resolve(articleData);
			}


			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};


			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};
			return promise;
		}


		/**
		 * Bravi Daten abrufen
		 *
		 * @param url
		 * @returns {*|promise}
		 */
		function getBraviData(url) {

			var braviData = JamHelperFactory.getContentFromCache(url, 'braviCache'),
				deferred = $q.defer(),
				promise = deferred.promise,
				ajaxParams = {};

			if (!braviData) {

				ajaxParams.aktion = 'getBravi';

				// create ajax Call
				JamSyncService.ajax(CONFIG.apiUrl + url, ajaxParams)
					.success(function(result) {
						if (typeof result.error != 'undefined' && result.error) {
							deferred.reject(result);
						} else {
							JamHelperFactory.addContentToCache(url, result.data, 'braviCache');
							deferred.resolve(result.data);
						}
					})
					.error(function(result) {
						deferred.reject(result);
					});
			} else {
				deferred.resolve(braviData);
			}

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};

			return promise;
		}

		function getComments(id) {

			id = id || 0;

			var ajaxParams = {},
				deferred = $q.defer(),
				promise = deferred.promise;

			ajaxParams.aktion = 'getComments';
			ajaxParams.id = id;

			JamSyncService.ajax(CONFIG.apiUrl + '/_scripts/json-api.php', ajaxParams).success(function(result) {
				// Nur, wenn Kommentare gefunden worden sind (mehr als 1)
				if (typeof result.data != 'undefined' && typeof result.data.numFound != 'undefined' && result.data.numFound > 0) {
					deferred.resolve(result.data);
				} else {
					deferred.reject(result);
				}
			}).error(function(result) {
				deferred.reject(result);
			});

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};

			return promise;
		}

		function saveComment(id, data) {
			id = id || 0;

			var ajaxParams = {},
				deferred = $q.defer(),
				promise = deferred.promise;

			ajaxParams.aktion = 'addComment';
			ajaxParams.id = id;
			ajaxParams.data = data;

			JamSyncService.ajax(CONFIG.apiUrl + '/_scripts/json-api.php', ajaxParams).success(function(result) {
				if (typeof result.error != 'undefined' && result.error) {
					deferred.reject(result);
				} else {
					deferred.resolve(result.data);
				}
			}).error(function(result) {
				deferred.reject(result);
			});

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};

			return promise;
		}

		/**
		 * Speicher die Ratings für den Artikel
		 *
		 * @param id
		 * @param value
		 * @returns {*|promise}
		 */
		function saveRating(id, value) {

			var params = {
				which: 'rateContent',
				action: 'rateContent',
				content_id: id,
				value: value,
				table: 'content_artikel_ratings'
			};

			return JamSyncService.ajax(CONFIG.apiUrlMobi+'_php/ajax.php', params, 'post');
		}

		function isValidArticleUrl(url) {
			return (url.indexOf('/gesundheit/') == 0);
		}
	}
})();