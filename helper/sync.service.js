(function(){
	'use strict';

	angular.module('app.helper').service('JamSyncService', function ($http, $q, CONFIG) {

		return {
			ajax: ajaxCall
		};
		
		////////////////////////////////////////////////////////
		/**
		 * Zentrale Ajax-Funktion um die Requests zentral pflegen zu können
		 *
		 * @param url		string		required	URL die aufgerufen werden soll
		 * @param params	object		required
		 * @param type		string		optional
		 * @returns {*|promise}
		 */
		function ajaxCall (url, params, type) {

			var deferred = $q.defer(),
				promise = deferred.promise,
				resultData = {
					error: true,
					code: 0,
					message: ''
				};

			// Default method params
			url = url || '';
			params = params || {};
			type = type || 'jsonp';

			// valid params object?
			if (typeof params == 'object' && url != '') {

				// create ajax Call
				window.setHash(CONFIG);

				var httpRequest,
					ajaxParams = {
						partner: CONFIG.partner,
						output: 'json',
						hash: CONFIG.hash,
						version: CONFIG.appVersion,
						t: CONFIG.hashTime,
						jsonp: 'JSON_CALLBACK'
				};

				// merge params object
				angular.extend(ajaxParams, params);

				// Lösche alle Parameter, die nicht zur Abfrage gehören sollten (bsp: 'ls_otbData')
				ajaxParams = deleteParams(ajaxParams);

				// Add url prefix
				if (url.indexOf('http') === -1) {
					url = CONFIG.apiUrlMobi + url;
				}

				switch (type) {

					case 'post': // post request
						ajaxParams.jsonp = undefined;
						httpRequest = $http.post(url, ajaxParams, {handleError: true});
						break;

					default: // 'jsonp'
						httpRequest = $http.jsonp(url, {"params" : ajaxParams}, {handleError: true});
						break;
				}

				httpRequest
					.then(function successCallback(response) {

						// we've got real data
						resultData.code = response.status || 403;
						resultData.data = response.data || [];

						// Error returned?
						if (resultData.data.error || resultData.code == 403) {
							deferred.reject(resultData);
							return false;
						}

						// Everything was ok!
						resultData.error = false;
						resultData.message = 'OK';

						deferred.resolve(resultData);

					}, function errorCallback(response) {

						// Server or client error => something went wrong
						resultData.code = response.status || 403;
						resultData.message = 'Zugriff fehlgeschlagen (2)';
						resultData.result = response;

						if (resultData.code == '404') {
							// Tracking? overwrite Errormessage?
							resultData.message = 'Seite nicht gefunden (1)';
						}

						deferred.reject(resultData);
					});

			} else {

				// No valid request!
				resultData.code = 403;
				resultData.message = 'Zugriff verweigert (403)';
				deferred.reject(resultData);
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
		 * Lösche alle unnötigen Paramter aus dem Request um die Sicherheit zu erhöhen
		 *
		 * @param params object required 	enthält die ajax-Parameter übergeben werden
		 * @returns object
		 */
		function deleteParams(params) {
			if (typeof params == 'object') {
				Object.keys(params).forEach(function(key) {
					if (key.indexOf('ls_') === 0) {
						params[key] = undefined;
						delete params[key];
					}
				});
			}
			return params;
		}
	});
})();