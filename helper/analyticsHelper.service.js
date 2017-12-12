(function(){
	'use strict';

	angular
		.module('app.helper')
		.factory('AnalyticsHelper', AnalyticsHelper);

	AnalyticsHelper.$inject = ['CONFIG', 'localStorageService'];

	function AnalyticsHelper(CONFIG, localStorageService) {

		return {
			setAccount: setAccount,
			trackPageview: trackPageview,
			trackEvent: trackEvent,
			trackLogin: trackLogin,
			deleteCustomVar: deleteCustomVar,
			setCustomVar: setCustomVar,
			setAnonymize: setAnonymize
		};

		/**
		 * Set Analytics Account
		 *
		 * example: trackPageview('/fachkreise/daten-aendern/');
		 */
		function setAccount() {

			if (CONFIG.gaAccountIsSet || typeof _gaq == 'undefined') return false;

			//$window.ga=$window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;

			var tracking_os		= ((CONFIG.deviceOs == 'iOS') ? 'iOS' : ((CONFIG.deviceOs == 'Android') ? 'Android' : 'weitere')),
				tracking_device	= ((CONFIG.deviceType == 'tablet') ? 'Tablet' : 'Telefon'),
				tracking_type	= ((CONFIG.environment == 'app') ? 'App' : 'Mobile Website'),
				tracking_ver	= CONFIG.appVersion + ' ' + CONFIG.appVersionDetail,
				verbindung		= (navigator.connection != undefined) ? navigator.connection.type : 'unbekannt';

			// Setze den Google Account
			if (CONFIG.environment == 'web') {
				/*$window.ga('create', CONFIG.gaTrackingCode, 'auto', {
					anonymizeIp: true
				});*/
				_gaq.push(['_setAccount', CONFIG.gaTrackingCode]);
			} else {
				ga_storage._setAccount(CONFIG.gaTrackingCode);
			}

			// Setze CustomVars
			setCustomVar({index: 1, name: 'OS', value: tracking_os, opt_scope: 2});
			setCustomVar({index: 2, name: 'Endgeraet', value: tracking_device, opt_scope: 2});
			setCustomVar({index: 3, name: 'Seite', value: tracking_type, opt_scope: 2});
			setCustomVar({index: 4, name: 'Version', value: tracking_ver, opt_scope: 2});
			setCustomVar({index: 5, name: 'Verbindung', value: verbindung, opt_scope: 2});

			trackLogin();

			CONFIG.gaAccountIsSet = true;
		}

		/**
		 * Track Pageview
		 *
		 * @param trackingPath
		 */
		function trackPageview(trackingPath, dimension) {

			// set google analytics account
			if (!CONFIG.gaAccountIsSet) setAccount();
			if (typeof _gaq == 'undefined') return false;

			dimension = dimension || {};
			dimension.page = trackingPath;

			// track page view
			try {

				if (CONFIG.environment == 'web') {
					//$window.ga('send', 'pageview', dimension);
					_gaq.push(['_trackPageview', trackingPath]);
				} else {
					ga_storage._trackPageview(trackingPath);
				}
			} catch (e) {

				/*$window.ga('send', 'exception', {
					'exDescription': e.message,
					'exFatal': false
				});*/
			}
		}


		function trackEvent(category, action, opt_label, opt_value, opt_noninteraction) {

			if (typeof _gaq == 'undefined') return false;

			// replace umlaute
			category = replaceSpecialChars(category);

			if (typeof action != 'undefined' && typeof action == 'string') {
				action = replaceSpecialChars(action);
			}

			if (typeof opt_label != 'undefined' && typeof opt_label == 'string') {
				opt_label = replaceSpecialChars(opt_label);
			}

			// set google analytics account
			if (!CONFIG.gaAccountIsSet) setAccount();

			try {
				if (CONFIG.environment == 'web') {
					_gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);

				} else {

					if (opt_label != undefined && opt_value != undefined) {
						ga_storage._trackEvent(category, action, opt_label, opt_value);
					} else if (opt_label != undefined) {
						ga_storage._trackEvent(category, action, opt_label);
					} else {
						ga_storage._trackEvent(category, action);
					}
				}

			} catch (error) {
				if (error.code === DOMException.QUOTA_EXCEEDED_ERR && localStorage.length === 0) {
					// private surfing activated
				}
				return false;
			}

			return true;
		}


		/**
		 * Trackt eine Custom Var, wenn eingeloggter Nutzer oder Arzt
		 *
		 * Hinweis: im Moment wird nur der Nutzer-Login behandelt, da der Login des Arztes noch nicht eingebaut ist
		 */
		function trackLogin() {
			if (typeof _gaq == 'undefined') return false;

			var loginData = localStorageService.get('jamUser'),
				customVarParams = {};

			if (typeof loginData != 'undefined' && loginData) {
				customVarParams.index = 7;
				customVarParams.name = 'Eingeloggter Nutzer';
				customVarParams.value = 'User';
				customVarParams.opt_scope = 3;

				setCustomVar(customVarParams);
			}

			customVarParams = loginData = undefined;
		}


		/**
		 * Setze die Custom Var
		 *
		 * Beispiel:
		 * { index: 10, name: 'testCustomVar', value: 'testValue', opt_scope: 3 }
		 *
		 * Hinweis:
		 * ------------
		 * Wenn der Index auf unter 5 gesetzt ist, wird dieser überschrieben, da die ersten 5 reseriert sind
		 *
		 * @param params
		 */
		function setCustomVar(params) {

			if (typeof _gaq == 'undefined') return false;

			// Prüfe die Parameter
			params.index = params.index || 50;
			params.name = (typeof params.name != 'undefined') ? params.name : '';
			params.value = (typeof params.value != 'undefined') ? params.value : '';
			params.opt_scope = params.opt_scope || 3;

			// Kein Tracking, wenn kein Name gesetzt ist
			if (params.name == '' || params.value == '') return false;

			try {
				if (CONFIG.environment == 'web') {
					// $window.ga('set', params.name, params.value);
					_gaq.push(['_setCustomVar', params.index, params.name, params.value, params.opt_scope]);
				} else {
					ga_storage._setCustomVar(params.index, params.name, params.value, params.opt_scope);
				}
			} catch(e){
				// Error reporting
				/*$window.ga('send', 'exception', {
				 'exDescription': e.message,
				 'exFatal': false
				 });*/
			}
		}

		/**
		 * CustomVar wieder entfernen
		 * (bei SPA notwendig)
		 *
		 * @param index
		 */
		function deleteCustomVar(index) {
			if (typeof _gaq == 'undefined') return false;

			if (typeof index == 'number') {
				if (CONFIG.environment == 'web') {
					// todo: noch für die neue Variante analytics.js vorbereiten (fehlt hier noch)
					_gaq.push(['_deleteCustomVar', index]);
				} else {
					ga_storage._deleteCustomVar(params.index);
				}
			} else if (typeof index == 'object') {
				for (var i = 0; i < index.length; i++) {
					deleteCustomVar(index[i]);
				}
			}
		}

		/**
		 * Replace special chars
		 *
		 * @param value
		 * @returns {string}
		 */
		function replaceSpecialChars(value) {
			return value.replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/Ä/g,"Ae").replace(/Ö/g,"Oe").replace(/Ü/g,"Ue").replace(/ß/g,"ss");
		}


		/**
		 * IP Anonymization
		 *
		 * @param value
		 */
		function setAnonymize(value) {
			//$window.ga('set', 'anonymizeIp', (value ? value : false));
		}
	}
})();