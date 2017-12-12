(function(){
	'use strict';

	angular
		.module('app.cache',[])
		.factory('CacheFactory', CacheFactory);

	CacheFactory.$inject = ['$q', 'CONFIG', '$ionicPopup', 'localStorageService', 'md5'];

	function CacheFactory($q, CONFIG, $ionicPopup, localStorageService, md5) {

		// private

		var _localStorageMessageShown = false,
			_storageKey = '',
			_currentSearch = {},
			_maxItemsInCacheObject = 10;

		var setStorageKey = function(data, stateParams) {
			var storageKey = '';
			storageKey += 'gruppe=' + ((data.suche && data.suche.params && data.suche.params.gruppe)? data.suche.params.gruppe : '') + ' | ';
			storageKey += 'fachgebiet=' + ((data.suche && data.suche.params && data.suche.params.fachgebiet)? data.suche.params.fachgebiet : '') + ' | ';
			storageKey += 'lat=' + ((data.suche.geo && data.suche.geo.lat)? (Math.round((data.suche.geo.lat*10000))/10000) : '') + ' | ';
			storageKey += 'lng=' + ((data.suche.geo && data.suche.geo.lng)? (Math.round((data.suche.geo.lng*10000))/10000) : '') + ' | ';
			storageKey += 'namen=' + ((data.suche && data.suche.params && data.suche.params.namen)? data.suche.params.namen : '') + ' | ';
			storageKey += 'sortAndFiler=' + ((stateParams['ajaxparams[]'])? stateParams['ajaxparams[]'] : '');
			storageKey = md5.createHash(storageKey);

			_storageKey = storageKey;
		};

		var getStorageKey = function() {
			return _storageKey;
		};

		var getSearch = function() {
			return _currentSearch;
		};

		// public
		return {
			setIntoCache: setIntoCache,
			getFromCache: getFromCache,
			lastSearchList: lastSearchList,
			lastSearchWhatSuggest: lastSearchWhatSuggest,
			lastSearchPersonSuggest: lastSearchPersonSuggest,
			lastSearchWhereSuggest: lastSearchWhereSuggest,
			setSearch: setSearch,
			setPersonSearch: setPersonSearch,
			clearLocalStorageKey: clearLocalStorageKey,
			isCacheLimitAchieved: isCacheLimitAchieved
		};

		////////////////////////////////////////////////////////

		function isCacheLimitAchieved(searchFromCache) {
			var value = false;
			var itemsInCacheObject = Object.keys(searchFromCache).length;

			if (itemsInCacheObject >= _maxItemsInCacheObject) {
				value = true;
			}

			itemsInCacheObject = undefined;

			return value;
		}

		/**
		 * Creates a new object with last searches for what-suggest
		 *
		 * @param obj
		 * @returns {Object}
		 */
		function lastSearchList(obj) {
			var tmpObj = {};

			Object.keys(obj).forEach(function(key) {

				// alle Fachgebiets- und Ortssuchen (aber keine reinen Ortssuchen)
				if (typeof obj[key].stateParams !== 'undefined' && typeof obj[key].stateParams.was !== 'undefined' && obj[key].stateParams.was != '') {
					var address = obj[key].stateParams.address;

					if (typeof address === 'undefined') {
						address = obj[key].city;
					}

					tmpObj[key] = obj[key];
					tmpObj[key].what_name_nice = { what: obj[key].stateParams.was, address: address };

					address = undefined;
				}

				// Personen-Suchen
				if (typeof obj[key].stateParams === 'undefined' && typeof obj[key].name_nice !== 'undefined' && obj[key].name_nice != '') {
					tmpObj[key] = obj[key];
					tmpObj[key].what_name_nice = { name_nice: obj[key].name_nice, refId: key };
				}

				// nur reine Ortssuchen
				if (typeof obj[key].stateParams !== 'undefined' && typeof obj[key].stateParams.address !== 'undefined' && obj[key].stateParams.address != '' && typeof obj[key].stateParams.was === 'undefined') {
					tmpObj[key] = obj[key];
					tmpObj[key].what_name_nice = { what: '', address: obj[key].stateParams.address };
				}

			});

			if (Object.keys(tmpObj).length == 0) {
				return false;
			}

			return tmpObj;
		}

		/**
		 * Creates a new object with last searches for what-suggest
		 *
		 * @param obj
		 * @returns {Object}
		 */
		function lastSearchWhatSuggest(obj) {
			var tmpObj = {};

			Object.keys(obj).forEach(function(key) {

				// alle Fachgebiets- und Ortssuchen (aber keine reinen Ortssuchen)
				if (typeof obj[key].stateParams !== 'undefined' && typeof obj[key].stateParams.was !== 'undefined' && obj[key].stateParams.was != '') {
					var address = obj[key].stateParams.address;
					tmpObj[key] = obj[key];

					if (typeof address === 'undefined') {
						address = obj[key].city;
					}
					tmpObj[key].what_name_nice = { what: obj[key].stateParams.was, address: address };

					address = undefined;
				}

				// Personen-Suchen
				if (typeof obj[key].stateParams === 'undefined' && typeof obj[key].name_nice !== 'undefined' && obj[key].name_nice != '') {
					tmpObj[key] = obj[key];
					tmpObj[key].what_name_nice = { name_nice: obj[key].name_nice, refId: key };
				}

			});

			if (Object.keys(tmpObj).length == 0) {
				return false;
			}

			return tmpObj;
		}

		/**
		 * Creates a new object with last searches for person-suggest in the name search modul
		 *
		 * @param obj
		 * @returns {Object}
		 */
		function lastSearchPersonSuggest(obj) {
			var tmpObj = {};

			Object.keys(obj).forEach(function(key) {

				// Personen-Suchen
				if (typeof obj[key].stateParams === 'undefined' && typeof obj[key].name_nice !== 'undefined' && obj[key].name_nice != '') {
					tmpObj[key] = obj[key];
					tmpObj[key].what_name_nice = { name_nice: obj[key].name_nice, refId: key };
				}

			});

			if (Object.keys(tmpObj).length == 0) {
				return false;
			}

			return tmpObj;
		}

		/**
		 * Creates a new object with last searches for where-suggest
		 *
		 * @param obj
		 * @returns {Object}
		 */
		function lastSearchWhereSuggest(obj) {
			var tmpObj = {};

			Object.keys(obj).forEach(function(key) {

				// nur reine Ortssuchen
				if (typeof obj[key].stateParams !== 'undefined' && typeof obj[key].stateParams.address !== 'undefined' && obj[key].stateParams.address != '' && typeof obj[key].stateParams.was === 'undefined') {
					tmpObj[key] = obj[key];
				}

			});

			if (Object.keys(tmpObj).length == 0) {
				return false;
			}

			return tmpObj;
		}

		function setPersonSearch(data) {
			var tmpProfil	= {};
			_currentSearch = {};

			tmpProfil.date = new Date().getTime();
			tmpProfil.art = data.art;
			tmpProfil.name_nice = data.name_nice;
			tmpProfil.portrait = data.portrait;
			tmpProfil.fach_string = data.fach_string;
			tmpProfil.zfach_string = data.zfach_string;

			_storageKey = data.ref_id + '_' + data.art;
			_currentSearch[_storageKey] = tmpProfil;
		}

		/**
		 * Sets the search-object that will be stored later
		 *
		 * @param search
		 * @param stateParams
		 * @returns {boolean}
		 */
		function setSearch(search, stateParams) {

			var city = false;

			if (typeof search.suche.geo !== 'undefined' && search.suche.geo) {

				if (typeof search.suche.geo.stadt !== 'undefined' && search.suche.geo.stadt) {
					city = search.suche.geo.stadt;
				}
			}

			_currentSearch = {};

			setStorageKey(search, stateParams);

			_currentSearch[getStorageKey()] = {
				date: new Date().getTime(),
				search: search.suche.url.split('/arztsuche/?search=')[1],
				stateParams: stateParams,
				city: city
			};
		}

		/**
		 * Does Client support localStorage?
		 * (private mode?)
		 *
		 * @param showMessage
		 * @returns {boolean}
		 */
		function localStorageSupport() {

			var lsIsSupported = true;
			if (!localStorageService.isSupported) {
				lsIsSupported = false;
			} else {
				if (localStorage.length === 0) {
					lsIsSupported = false;
				}
			}
			return lsIsSupported;
		}

		/**
		 * Get data from localeStorage
		 * call => getFromCache('test',86400)
		 *
		 * @param key
		 * @param timeout
		 * @returns {boolean|object|string}
		 */
		function getFromCache(key, timeout) {
			var deferred = $q.defer();

			// key not set, or localStorage is not supported
			if (key == '' || typeof key == 'undefined' || !localStorageSupport()) {
				deferred.reject("key not set, or localStorage is not supported");
				return deferred.promise;
			}

			// set needed variables
			var timeoutStorage = localStorageService.get(key + 'timeout');

			var tmpDate = (+new Date());
			var tmpTimeout = (tmpDate/1000-timeoutStorage/1000);
			var data = [];

			// no valid key found or cache is not validated anymore
			if (timeout != 0) {

				if (!timeoutStorage || (tmpTimeout > timeout)) {
					deferred.reject("no valid key found or cache is not validated anymore");
				}
			}

			var storageData = localStorageService.get(key);

			// no data found to this key
			if (!storageData) {
				deferred.reject("no data found to this key");
				return deferred.promise;
			}

			// parse data into json object or return it as a string
			try {

				data = JSON.parse(storageData);
				data = sortStorageData(data);
				deferred.resolve(data);

			} catch(e) {

				data = storageData;
				data = sortStorageData(data);
				deferred.resolve(data);
			}

			return deferred.promise;
		}


		function sortStorageData(obj) {
			if (typeof obj === 'undefined' || !obj) {
				return;
			}

			var referenceObj = {},
				sortedKeys = new Array(),
				sortedObj = {};

			Object.keys(obj).forEach(function(key) {
				referenceObj[obj[key].date] = key;
			});

			// Separate keys and sort them
			for (var i in referenceObj) {
				sortedKeys.push(i);
			}

			sortedKeys.sort();
			sortedKeys.reverse();

			// Reconstruct sorted obj based on keys
			for (var i in sortedKeys) {
				sortedObj[referenceObj[sortedKeys[i]]] = obj[referenceObj[sortedKeys[i]]];
			}

			return sortedObj;
		}

		/**
		 * Set data into localStorage
		 *
		 * @param key
		 * @param data
		 * @returns {boolean}
		 */
		function setIntoCache(key, data) {

			var dataForCache = false;

			// key not set, or localStorage is not supported
			if (key == '' || typeof key == 'undefined' || !localStorageSupport()) {
				return false;
			}

			// Daten kommen bereits aus dem Cache
			if (angular.isObject(data) && Object.keys(data).length > 0) {
				// wenn der Key noch nicht vorkommt, im LocalStorage speichern
				if (!data.hasOwnProperty(getStorageKey())) {

					// wenn limit erreicht, dann lösche ältesten Eintrag
					if (isCacheLimitAchieved(data)) {

						var tmpData = {
							timestamp: [],
							key: []
						};

						Object.keys(data).forEach(function(key) {
							tmpData.timestamp.push(data[key].date);
							tmpData.key.push(key);
						});

						var oldestTimestamp = Math.min.apply(Math, tmpData.timestamp),
							index = tmpData.timestamp.indexOf(oldestTimestamp),
							keyToDelete = tmpData.key[index];

						delete data[keyToDelete];
					}
					
					dataForCache = angular.extend({}, data, getSearch());
				}
			}

			// Initiales Speichern der ersten Suche
			if (!angular.isObject(data) && data == true) {
				dataForCache = angular.extend({}, data, getSearch());
			}

			if (!dataForCache) {
				return false;
			}

			if (typeof dataForCache != 'string') {
				dataForCache = JSON.stringify(dataForCache);
			}

			// everything was ok, insert into localStorage now
			var timeoutDate = (+ new Date());
			localStorageService.set(key+'timeout', timeoutDate);

			return localStorageService.set(key, dataForCache);
		}


		function clearLocalStorageKey(key) {

			// key not set, or localStorage is not supported
			if (key == '' || typeof key == 'undefined' || !localStorageSupport()) {
				return false;
			}

			return localStorageService.remove(key, key + 'timeout', key+'ItemCounter');
		}
	}

})();