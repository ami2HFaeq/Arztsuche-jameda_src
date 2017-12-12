(function () {
	'use strict';

	var popup = null,
		popupForm = null;

	angular
		.module('app.core',[
			'ionic',
			'ngCordova',
			'angular-md5',
			'LocalStorageModule',
			'ion-datetime-picker'
		])
		.run(runApp)
		.service('APIInterceptor', function($q, CONFIG, AnalyticsHelper) {

			return {

				'request': function(requestConfig) {

					if ((typeof requestConfig.data != 'undefined' && requestConfig.data.hash != 'undefined') || (typeof requestConfig.params != 'undefined' && requestConfig.params.hash != 'undefined' )) {
						window.setHash(CONFIG);
					}

					// Change URL only on web environment (not relative!)
					if (requestConfig.url.indexOf('http') === -1 && CONFIG.environment == 'web') {
						requestConfig.url = CONFIG.apiUrlMobi + requestConfig.url;
					}

					return requestConfig;
				},

				'response': function(response) {

					var url = response.config.url || '',
							api = 'API',
							status = 'UNKNOWN',
							label = url;

					if (url.indexOf('www.jameda.de') === -1) {
						api = 'INTERN';
					}

					if (url.indexOf('json-api.php') !== -1) {

						if (response.config.data && response.config.data.params) {
							label = response.config.data.params.aktion || url;
						} else if(response.config.params){
							label = response.config.params.aktion || url;
						} else {
							label = response.config.aktion || url;
						}
					}

					if (typeof response.status != 'undefined' && response.status != 0) {
						status = response.status;
					}

					if (typeof response != 'undefined' && typeof response.data != 'undefined' && response.data != null && typeof response.data.error != 'undefined' && response.data.error == true) {

						// GATRACKING
						AnalyticsHelper.trackEvent('Sitewide - Fehlermeldungen', '403 - ' + api, label);
						return $q.reject(response.data);

					} else if (typeof response == 'undefined') {

						// GATRACKING
						AnalyticsHelper.trackEvent('Sitewide - Fehlermeldungen', '400 - ' + api, label);
						return $q.reject({error: true, status: 400, statusText: 'Bad Request'});
					}

					if (typeof response.data == 'string' && typeof window.cordova == 'undefined') {
						
						var tmp = response.data.match(/<script>(.*?)<\/script>/g),
							hash = false,
							hashTime = false;

						if (tmp != null) {

							for (var i = 0; i < tmp.length; i++) {
								if (tmp[i].indexOf('setHash') > -1) {
									var tmp2 = tmp[i].match(/"(.*?)"/g);
									for( var y = 0; y < tmp2.length; y++) {
										if (y == 0) {
											hash = tmp2[y].replace(/"/gi,'');
										} else if(y == 1) {
											hashTime = tmp2[y].replace(/"/gi,'');
										}
									}
								}
							}

							if (hash && CONFIG.hashTime < hashTime) {

								CONFIG.hash = hash;
								CONFIG.hashTime = hashTime;

								window.setHash = function(CONFIG) {
									CONFIG.hash = hash;
									CONFIG.hashTime = hashTime;
								};
							}
							tmp = tmp2 = undefined;
						}
					}

					return $q.resolve(response);
				},

				'responseError': function(errorResponse) {

					try {

						var url = errorResponse.config.url || '',
							api = 'API',
							status = 'UNKNOWN',
							label = url;

						if (url.indexOf('www.jameda.de') === -1) {
							api = 'INTERN';
						}

						if (url.indexOf('json-api.php') !== -1) {
							label = errorResponse.config.params.aktion || url;
						}

						if (typeof errorResponse.status != 'undefined' && errorResponse.status != 0) {
							status = errorResponse.status;
						}

						// GATRACKING
						AnalyticsHelper.trackEvent('Sitewide - Fehlermeldungen', status + ' - ' + api, label);

						if (typeof errorResponse.data != 'undefined' && errorResponse.data != null && typeof errorResponse.data.error != 'undefined') {
							$q.reject(errorResponse.data);
						}

					} catch(e) {}


					return $q.reject(errorResponse);
				}
			};
		})

		.config(configure);

	function configure($urlRouterProvider, $ionicConfigProvider, $locationProvider, localStorageServiceProvider, CONFIG, $httpProvider){

		// Add initial config stuff here such as view caching refinements.
		$ionicConfigProvider.views.maxCache(10);
		$ionicConfigProvider.views.swipeBackEnabled(false);
		//$ionicConfigProvider.views.transition('none');

		// set cookie lifetime
		localStorageServiceProvider
			.setStorageCookie(0, '/');


		// determine os and os version
		setAppConfig(CONFIG);


		//$locationProvider.hashPrefix('!');
		if (CONFIG.environment == 'web') $locationProvider.html5Mode(true);


		// check for old android browsers
		if (CONFIG.deviceOs == 'Android' && (CONFIG.deviceOsVersion < 4.5 || CONFIG.deviceBrowser != 'chrome')) {
			$ionicConfigProvider.scrolling.jsScrolling(false);
		} else {
			$ionicConfigProvider.scrolling.jsScrolling(true);
		}
		$ionicConfigProvider.platform.android.views.maxCache(5);

		// Perfomrance Hack for rendering
		$ionicConfigProvider.templates.maxPrefetch(0);

		// whitelist
		//$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|geo):/);

		// Default route for ui-router
		$urlRouterProvider.otherwise('/home/');

		// Bugfix for pending request on Dr. No's profile???
		// http://stackoverflow.com/questions/21630534/node-js-angular-js-caution-provisional-headers-are-shown
		//$httpProvider.defaults.headers.post = {};
		//$httpProvider.defaults.headers.get = {};

		// set post content type
		$httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';


		//
		var param = function(obj) {
			var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

			for (name in obj) {
				value = obj[name];

				if (value instanceof Array) {
					for (i=0; i<value.length; ++i) {
						subValue = value[i];
						fullSubName = name + '[' + i + ']';
						innerObj = {};
						innerObj[fullSubName] = subValue;
						query += param(innerObj) + '&';
					}
				}else if (value instanceof Object) {
					for (subName in value) {
						subValue = value[subName];
						fullSubName = name + '[' + subName + ']';
						innerObj = {};
						innerObj[fullSubName] = subValue;
						query += param(innerObj) + '&';
					}
				}
				else if(value !== undefined && value !== null) {
					query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
				}
			}

			return query.length ? query.substr(0, query.length - 1) : query;
		};

		// Override $http service's default transformRequest
		$httpProvider.defaults.transformRequest = [function(data) {
			return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
		}];

		$httpProvider.defaults.withCredentials = true;
		$httpProvider.interceptors.push('APIInterceptor');

	}

	function runApp($rootScope, $ionicPlatform, $location, $ionicPopup, $cordovaSplashscreen, $timeout, $ionicPickerI18n, LoaderFactory, CONFIG, JamLoginFactory, JamBannerService/*, JamOverlayBannerService*/) {

		// Kalender Konfiguration
		$ionicPickerI18n.weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
		$ionicPickerI18n.months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
		$ionicPickerI18n.ok = "OK";
		$ionicPickerI18n.cancel = "Abbrechen";
		$ionicPickerI18n.okClass = "button-positive";
		$ionicPickerI18n.cancelClass = "button-gray";

		// Remove initial loader
		angular.element('.init-jamLoader').remove();

		angular.element(document).ready(function () {
			angular.element('.app-container').css({'opacity':1});
		});

		popup = $ionicPopup;

		// Popup Formdata
		$rootScope.popupForm = {};

		$ionicPlatform.ready( function() {

			// Falls Wartungsarbeiten nötig sein sollten, wird der Benutzer immer auf "Wartungsarbeiten" weitergeleitet
			if (CONFIG.maintenance) {
				$location.path('/wartungsarbeiten/');

				// Android Fix für Wartungsarbeiten
				if (CONFIG.environment == 'app' && CONFIG.deviceOs == 'Android' && typeof $cordovaSplashscreen != 'undefined') {
					$cordovaSplashscreen.hide();
				}
				return false;
			}

			// App Teaser for Android and iOS < 6 and only in web environment
			if (CONFIG.environment != 'app') {

				JamBannerService.show($rootScope);

			} else {

				if (CONFIG.deviceOs == 'Android' && typeof $cordovaSplashscreen != 'undefined') {
					setTimeout(function() {
						$cordovaSplashscreen.hide()
					}, 500);
				}

				/*
				// Add Off-Online Events
				// @todo: check where we need this info and how it works
				updateOnlineStatus();
				window.addEventListener('online',  updateOnlineStatus);
				window.addEventListener('offline', updateOnlineStatus);
				*/
			}
		});

		// Global Loader
		// hier kann der Loader für bestimmte Seiten deaktiviert werden => standard aktiviert
		$rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {

			if ($location.hash() != '') {
				$location.hash(undefined);
			}

			var authorised, type = 2,
				notShowLoaderonStart = [
					'',
					'home',
					'subjects',
					'otb',
					'profileFavourites',
					'searchByName',
					'review',
					'staticContents',
					'userLogin',
					'userForgotPassword',
					'userRegister',
					'userEvaluatesSingle',
					'userMainMenu',
					'userObservation',
					'userAppointments',
					'premiumLogin',
					'premiumAppointments',
					'premiumAppointmentAction',
					'expertArticle'
				];

			if (notShowLoaderonStart.indexOf(toState.name) == -1) {

				if (toState.name == 'searchByName' || toState.name == 'searchResultList') {
					type = 0;
				}

				LoaderFactory.showLoader(type);
			}

			// Authorization
			if (toState.access !== undefined && fromState.name != toState.name) {

				JamLoginFactory.authorize(toState.access.requiresLogin, toState.access.permissions, toState.access.permissionType).error(function() {

					// Benutzerlogin wird benötigt, leite ihn auf die Anmelde Seite weiter
					// Danach wieder auf die "alte" Seite
					$rootScope.returnToState = toState;
					$rootScope.returnToStateParams = toParams;

					// Soll zu Premium-Login weitergeleitet werden (Nur für Kunden)?
					if (toState.access.premium) {
						$location.path('/premium/');
					} else {
						$location.path('/mein-jameda/anmelden/');
					}
				});
			}

			// 404 robots handling
			if (fromState.name == 'pageNotFound') {
				angular.element('[name="robots"]').attr('content','index, nofollow');
			}

			// Load fresh user reviews
			if (fromState.name != 'userEvaluates' && fromState.name != 'userEvaluatesSingle' && (toState.name == 'userEvaluates' || toState.name != 'userEvaluatesSingle')) {
				toParams.loadFresh = true;
			}

			if (CONFIG.environment != 'app') {
				// Setze Meta-Description auf Default-Wert
				var metaElem = document.querySelector('meta[name="description"]'),
					content = metaElem && metaElem.getAttribute('content');

				if (content !== false) {
					metaElem.setAttribute('content', 'jameda – Deutschlands größte Arztempfehlung ✓ Finden Sie den passenden Arzt für sich ✓ Über 1,5 Mio. Arztbewertungen ✓ Arzttermine online buchen');
				}
				metaElem = content = undefined;
			}
		});

		$rootScope.$on('$stateChangeSuccess', function(event, toState) {
			// Prüfe bei Seiten, die einen Login benötigen, ob das Passwort erneuert werden muss
			if (toState.access !== undefined && CONFIG.userProfile && typeof CONFIG.userProfile.user != 'undefined' && typeof CONFIG.userProfile.user.passwort_auto != 'undefined') {
				if ((CONFIG.deviceType != 'tablet' && $location.url() != '/mein-jameda/meine-daten/passwort-aendern/') || (CONFIG.deviceType == 'tablet' && $location.url() != '/mein-jameda/meine-daten/uebersicht/')) {
					$timeout(function() {
						if (CONFIG.deviceType == 'tablet') {
							if (CONFIG.deviceOrientation == 'portrait') {
								$location.url('/mein-jameda/meine-daten/passwort-aendern/?type=auto');
							} else {
								$location.url('/mein-jameda/meine-daten/uebersicht/?type=auto');
							}
						} else {
							$location.url('/mein-jameda/meine-daten/passwort-aendern/?type=auto');
						}
					}, 0);
				}
			}

			// Zeige das Overlay Arztsuche Template an (einmalig, nach der 3. Seite)
			// if (CONFIG.environment == 'web') {
             //    JamOverlayBannerService.show();
			// }
		});
	}


	function setAppConfig(CONFIG) {

		if (CONFIG.isLoaded) return false;

		if (typeof window.cordova != 'undefined') {
			CONFIG.environment = 'app';
		}

		setOsDetails(CONFIG);
		setDeviceDetails(CONFIG);
		
		CONFIG.isLoaded = true;

		return true;
	}


	function setDeviceDetails(CONFIG) {

		// is dev? / set apiUrlMobi
		var origin = window.location.origin;

		if (typeof origin != 'undefined') {

			if (origin.indexOf('mobi.local.dev') > -1) {
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://mobi.local.dev/';
			} else if (origin.indexOf('mobi.jameda.dev') > -1) {
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://mobi.jameda.dev/';
			} else if (origin.indexOf('staging.jameda.mobi') > -1) {
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'https://staging.jameda.mobi/';
			} else if (origin.indexOf('master.jameda.mobi') > -1) {
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'https://master.jameda.mobi/';
			} else if (origin.indexOf('192.168.0.220') > -1) { // Tiemo
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://192.168.0.220/';
			} else if (origin.indexOf('192.168.0.221') > -1) { // Ricky
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://192.168.0.221/';
			} else if (origin.indexOf('192.168.0.222') > -1) {
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://192.168.0.222/';
			} else if (origin.indexOf('192.168.0.223') > -1) {
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://192.168.0.223/';
			} else if (origin.indexOf('192.168.0.224') > -1) {
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://192.168.0.224/';
			} else if (origin.indexOf('192.168.0.225') > -1) { // Joni
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://192.168.0.225/';
			} else if (origin.indexOf('192.168.0.226') > -1) { // Frieder
				CONFIG.isDev = true;
				CONFIG.apiUrlMobi = 'http://192.168.0.226/';
			}

		} else {
			CONFIG.isDev = false;
		}


		// analytics // Web: UA-26741000-8 // App: UA-26741000-7 // Dev: UA-26741000-9
		// google keys
		if (CONFIG.environment == 'app') {

			CONFIG.urlTarget = '_system';
			CONFIG.urlPopupTarget = CONFIG.urlTarget;

			if (CONFIG.isDev) {
				CONFIG.googleMapsApiKey.current = CONFIG.googleMapsApiKey.app;
				CONFIG.gaTrackingCode = 'UA-26741000-9';
			} else {
				CONFIG.googleMapsApiKey.current = CONFIG.googleMapsApiKey.app;
				CONFIG.gaTrackingCode = 'UA-26741000-7';
			}

			if (CONFIG.deviceOs != 'unknown') {
				CONFIG.appVersionDetail = CONFIG.deviceOs + '-App ' + CONFIG.appVersion;
			}
		} else {

			if (CONFIG.isDev) {
				CONFIG.googleMapsApiKey.current = CONFIG.googleMapsApiKey.dev;
				CONFIG.gaTrackingCode = 'UA-26741000-9';
			} else {
				CONFIG.googleMapsApiKey.current = CONFIG.googleMapsApiKey.live;
				CONFIG.gaTrackingCode = 'UA-26741000-8';
			}

			CONFIG.appVersionDetail = CONFIG.appVersionDetail + ' ' + CONFIG.appVersion
		}

		var w = window,
			d = document,
			e = d.documentElement,
			g = document.body,
			x = w.innerWidth || e.clientWidth || g.clientWidth,
			y = w.innerHeight|| e.clientHeight|| g.clientHeight;

		// set other config values
		CONFIG.windowWidth = x;
		CONFIG.windowHeight = y;
		CONFIG.contentHeight = CONFIG.windowHeight - 55;
		CONFIG.deviceType = (CONFIG.windowWidth >= 900 || (CONFIG.windowHeight > 850 && CONFIG.windowWidth > 700)) ? 'tablet' : 'phone';
		CONFIG.deviceOrientation = getDeviceOrientation(window.ionic.viewport.orientation());
		CONFIG.devicePixelDensity = (window.devicePixelRatio) ? window.devicePixelRatio : '';
		CONFIG.partner = 'jam_' + ((CONFIG.environment == 'app') ? 'app' : 'mobi') + '_' + (CONFIG.deviceOs).toLowerCase() + '_' + (CONFIG.deviceType).toLowerCase();
		CONFIG.urlPrefix = (CONFIG.environment == 'app') ? '#' : '';


		// set ua
		CONFIG.ua = '';
		if (typeof navigator != 'undefined' && typeof jQuery != 'undefined') {
			if (navigator.userAgent) {
				CONFIG.ua = navigator.userAgent;
			}
		}

		origin = w = d = e = g = x = y = undefined;
		return true;
	}


	/**
	 * Return the Device Orientation from the window.ionic object
	 *
	 * @param value
	 * @returns {string}
	 */
	function getDeviceOrientation(value) {

		if (Math.abs(value) === 90) {
			return 'landscape';
		}
		return 'portrait';
	}

	function setOsDetails(CONFIG) {

		var userAgent = navigator.userAgent,
			userAgentIndex;

		// check if config is already set
		if (CONFIG.deviceOs !== false) return true;

		// determine OS
		if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {

			CONFIG.deviceOs = 'iOS';
			userAgentIndex  = userAgent.indexOf('OS ');

			CONFIG.deviceOsVersion = Number(userAgent.substr(userAgentIndex + 3, 3).replace('_', '.'));

		} else if (userAgent.match(/Android/i)) {

			CONFIG.deviceOs = 'Android';
			userAgentIndex  = userAgent.indexOf( 'Android ' );

			// set Browser
			if (userAgent.match(/Chrome/i)) CONFIG.deviceBrowser = 'chrome';

			CONFIG.deviceOsVersion = Number(userAgent.substr(userAgentIndex + 8, 3));

		} else {

			CONFIG.deviceOs = 'unknown';
			CONFIG.deviceOsVersion = 'unknown';
		}

		// determine IE Version
		if (false && userAgent.match(/Windows Phone/i)) {
			CONFIG.deviceOs = 'Windows Phone';
			userAgentIndex  = userAgent.indexOf('MSIE ');
			CONFIG.deviceOsVersion = userAgent.substr(userAgentIndex + 5, 3);
		}

		userAgent = userAgentIndex = undefined;
		return true;
	}


	/**
	 * Update Online Status
	 *
	 * @param ev
	 * @returns {boolean}
	 */
	function updateOnlineStatus(ev) {

		if (typeof navigator.onLine != 'undefined') {

			var connectionStatus = navigator.onLine;

			if (popupForm != null) {
				popupForm.close();
			}

			if (!connectionStatus) {
				//alert('No Internet - Connection')

				//rootScope

				popupForm = popup.alert({
					cssClass: 'alert-popup',
					title: '<strong>Keine Internetverbindung</strong>',
					template: "Bitte prüfen Sie Ihr<br>Mobilfunknetz oder WLAN.",
					buttons: []
				});


				return false;
			}
		}
	}
})();