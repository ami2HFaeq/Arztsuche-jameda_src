(function(){
	'use strict';

	angular
		.module('app.geoLocation',[])
		.factory('GeoLocationFactory', GeoLocationFactory);

	GeoLocationFactory.$inject = ['$q'];

	function GeoLocationFactory($q) {

		return {
			getCurrentGeoLocation: getCurrentGeoLocation
		};

		////////////////////////////////////////////////////////

		function getCurrentGeoLocation() {
			var deferred = $q.defer();
			var options = {
				maximumAge: 60000,
				timeout: 10000,
				enableHighAccuracy: true
			};

			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					function success(position) {
						deferred.resolve(position);
					},
					function error(msg) {
						deferred.reject(msg);
					},
					options
				);
			} else {
				deferred.reject('navigator.geolocation ist false');
			}

			return deferred.promise;
		}
	}
})();