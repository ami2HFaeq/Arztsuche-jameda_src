(function(){
	'use strict';

	angular
		.module('app.maps',[])
		.factory('GoogleMaps', GoogleMaps);

	GoogleMaps.$inject = ['$q', 'CONFIG', '$window'];

	function GoogleMaps($q, CONFIG, $window) {

		return {

			// methods
			loadAPI: loadAPI
		};

		function loadAPI() {

			var deferred = $q.defer();

			$window.initMap = function() {
				deferred.resolve();
			}

			if ($window.google && $window.google.maps) {

				deferred.resolve();

			} else {

				var script = document.createElement('script');
				var tmpKey = "&key=" + CONFIG.googleMapsApiKey.current;
				if (CONFIG.environment == 'app') tmpKey = '';
				script.src = "https://maps.googleapis.com/maps/api/js?v=3" + tmpKey +"&sensor=false&callback=initMap";
				document.body.appendChild(script);
			}

			return deferred.promise;
		}
	}
})();