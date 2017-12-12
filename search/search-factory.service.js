(function(){
	'use strict';

	angular
		.module('app.search',[])
		.factory('SearchFactory', SearchFactory);

	SearchFactory.$inject = ['$q', 'CONFIG', '$location', 'JamHelperFactory', 'JamSyncService'];

	function SearchFactory($q, CONFIG, $location, JamHelperFactory, JamSyncService) {

		return {
			getSearchData: getSearchData
		};

		////////////////////////////////////////////////////////

		function getSearchData(stateParams) {

			var deferred = $q.defer();
			var url = '';
			var currentUrl = $location.url();


			if (currentUrl.indexOf("ergebnisliste") >= 0 || (angular.isObject($location.search()) && Object.keys($location.search()).length > 0 &&
				(typeof $location.search().was != 'undefined' || typeof $location.search().address != 'undefined' || typeof $location.search().geo != 'undefined' || typeof $location.search().fsid != 'undefined'))) {

				// Suche mit API-URL '/arztsuche/'
				stateParams.new_search = 1;
				url = CONFIG.apiUrl + '/arztsuche/';

			} else {

				// Suchanfrage, wenn Request von Google & Co über Speaking-URL
				url = CONFIG.apiUrl + currentUrl;
			}

			if (typeof stateParams.geo != 'undefined') {
				stateParams.geo = decodeURIComponent(stateParams.geo);
			}

			// Bugfix für OTB-Liste (url: /aerzte/termin-anfrage/fachaerzte/)
			if (stateParams.path == 'aerzte/termin-anfrage' || $location.url().indexOf('/termine/') != -1) {
				stateParams.path = '';
				stateParams.new_search = 1;
				stateParams['ajaxparams[]'] = ['add|merkmale|otb_status'];

				url = CONFIG.apiUrl + '/arztsuche/';
			}

			url = decodeURI(url);
			url = url.replace(/\%252F/gi, '/');
			url = url.replace(/\%2F/gi, '/');

			JamSyncService.ajax(url, stateParams).success(function(resultData) {

				var data = {};
				if (!resultData.error && typeof resultData.data != 'undefined') {

					data = resultData.data;
					JamHelperFactory.addPreloadedProfilesToCache(data);

					deferred.resolve(data);
				} else {

					deferred.reject(resultData.message);
				}
			}).error(function(errorResponse) {

				if (errorResponse.code == 404 || errorResponse.code == '404') {
					JamHelperFactory.pageNotFound();
				} else {
					JamHelperFactory.showHashTimeout('', true, false, errorResponse.code);
				}

				deferred.reject(errorResponse);
			});

			return deferred.promise;
		}
	}
})();