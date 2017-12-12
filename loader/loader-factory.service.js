(function(){
	'use strict';

	angular
		.module('app.loader', [])
		.factory('LoaderFactory', LoaderFactory);

	LoaderFactory.$inject = ['$ionicLoading', '$ionicPopup', 'AnalyticsHelper'];

	function LoaderFactory($ionicLoading, $ionicPopup, AnalyticsHelper) {

		return {

			// variables
			loaderStatus: false,
			loaderStartTime: null,
			loaderTimer: null,
			maxloadingTime: 30000,
			loaderTimeout: null,
			loaderTimeoutError: null,

			// methods
			showLoader: showLoader,
			hideLoader: hideLoader
		};

		////////////////////////////////////////////////////////

		/**
		 * Show Loader
		 *
		 * Default Loader call:
		 * LoaderFactory.showLoader(); => Displays "Ihre Suche wird ausgeführt..."
		 * LoaderFactory.showLoader(1); => Displays "Wir suchen nach freien Terminen..."
		 * LoaderFactory.showLoader(2); => Display just the loader
		 * LoaderFactory.showLoader(2, STRING, STRING); => Displays "Ihre Suche wird ausgeführt
		 *
		 * You can also force the loader to show with the fourth (boolean) parameter
		 * LoaderFactory.showLoader(TYPE, STRING, STRING, BOOLEAN (default=false));
		 *
		 * @param type
		 * @param mainTxt
		 * @param text
		 * @param force
		 * @returns {boolean}
		 */
		function showLoader (type, mainTxt, text, force) {

			//console.log("==========================\nCALL: 'showLoader' with Params:",type, mainTxt, text, force);

			// optional params
			type = type || 0;
			mainTxt = mainTxt || '';
			text = text || '';
			force = force || false;


			// Should we show loader?
			if (LoaderFactory.loaderStatus && !force) {
				return false;
			}

			LoaderFactory.loaderStatus = true;

			// create template container
			var tempCon = '<div class="jam-loader"><ion-spinner></ion-spinner><div class="loader-msg">';

			switch (type) {

				// Default Message 1 (Searchlist)
				case 0:

					tempCon += 'Ihre Suche wird ausgeführt...<span>Bei uns finden Sie alle Ärzte in Deutschland.</span>';

					break;

				// Default Message 2 (OTB)
				case 1:

					tempCon += 'Wir suchen nach freien Terminen für Sie...';
					break;

				// Optional message
				default:

					tempCon += mainTxt;

					if (text != '') tempCon += '<span>'+text+'</span>';
					break;
			}

			tempCon += '</div></div>';

			// Ionic loader
			$ionicLoading.show ({

				animation: 'fade-in',
				showBackdrop: true,
				showDelay: 0,
				template: tempCon

			});

			LoaderFactory.loaderStartTime = new Date().getTime();


			// Clear timeouts
			if (LoaderFactory.loaderTimeout != null) window.clearTimeout(LoaderFactory.loaderTimeout);
			if (LoaderFactory.loaderTimeoutError != null) window.clearTimeout(LoaderFactory.loaderTimeoutError);

            // Loader is still showing after 20s?
			LoaderFactory.loaderTimeout = window.setTimeout(function(){

				window.clearTimeout(LoaderFactory.loaderTimeout);

				if (LoaderFactory.loaderStatus) {

					// GATRACKING
					AnalyticsHelper.trackEvent('Sitewide - Fehlermeldungen', 'Leider dauert es diesmal länger');

					$ionicLoading.show ({
						animation: 'fade-in',
						showBackdrop: true,
						showDelay: 0,
						template: '<div class="jam-loader"><ion-spinner></ion-spinner><div class="loader-msg">Leider dauert es diesmal etwas länger als gedacht. Bitte haben Sie ein wenig Geduld!<br>Vielen Dank.</div></div>'
					});

                    // Again no response, reload page!
					LoaderFactory.loaderTimeoutError = window.setTimeout(function(){

						window.clearTimeout(LoaderFactory.loaderTimeoutError);

                        if (LoaderFactory.loaderStatus) {

                        	var connection = navigator.onLine || false;
                            hideLoader(0, true);

                            if (connection) {

								// GATRACKING
								AnalyticsHelper.trackEvent('Sitewide - Fehlermeldungen', 'Server hat nicht reagiert (Timeout-Connection)');

								var alertPopup = $ionicPopup.alert({
									title: 'Server nicht erreichbar',
									template: 'Hoppla! Irgendwas ist schief gelaufen. Gerne versuchen wir es noch einmal.',
									okText: 'Ok'
								});
							} else {

								// GATRACKING
								AnalyticsHelper.trackEvent('Sitewide - Fehlermeldungen', 'Internetverbindung überprüfen');

								var alertPopup = $ionicPopup.alert({
									title: 'Internetverbindung überprüfen',
									template: 'Hoppla! Irgendwas ist schief gelaufen. Besteht eine Verbindung zum Internet? Gerne versuchen wir es noch einmal.',
									okText: 'Ok'
								});
							}

                            alertPopup.then(function(res) {
                                if(res) {
                                    showLoader(2,'','',true);
                                    window.setTimeout(function() {
                                        window.location.reload();
                                    },800);
                                }
                            });
                        }
                    },20000);
				}
			},15000);

			return true;
		}

		/**
		 * Hide Loader
		 *
		 * @param timer
		 * @param force
		 * @returns {boolean}
		 */
		function hideLoader(timer, force) {

			//console.log("==========================\nCALL: 'hideLoader' with Params:",timer, force);

			// force hiding?
			timer = timer || 600;
			force = force || false;

			// Loader not yet started
			if (!LoaderFactory.loaderStatus && !force) {
				return true;
			}

			LoaderFactory.loaderStatus = false;

			// Clear timeouts
			window.clearTimeout(LoaderFactory.loaderTimeout);
			window.clearTimeout(LoaderFactory.loaderTimeoutError);

			// Get time from start to end (minus tolerance 30ms)
			var loaderStopTime = (new Date().getTime() - LoaderFactory.loaderStartTime) - 30,
				newTimer = 0;

			if (timer > loaderStopTime) {

				newTimer = timer - loaderStopTime;
			}
			//console.log('Hide Loader: ',LoaderFactory.loaderStartTime, loaderStopTime, newTimer);

			// Clear Timeout and set new one
			clearTimeout(LoaderFactory.loaderTimer);

			LoaderFactory.loaderTimer = window.setTimeout(function() {

				$ionicLoading.hide();

				window.clearTimeout(LoaderFactory.loaderTimer);
				//console.log("loader hided!\n===================================\n\n");

				return true;
			}, newTimer);
		}
	}
})();