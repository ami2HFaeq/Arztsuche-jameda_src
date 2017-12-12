(function(){
	'use strict';

	angular
		.module('app.helper')
		.factory('JamVCardHelper', JamVCardHelper);

	JamVCardHelper.$inject = ['$http', 'CONFIG', '$ionicPopup', 'LoaderFactory', 'JamSyncService', 'JamHelperFactory'];

	function JamVCardHelper($http, CONFIG, $ionicPopup, LoaderFactory, JamSyncService, JamHelperFactory) {

		return {
			loadvcard: loadvcard
		};


		////////////////////////////////////////////////////////
		// Methods

		function loadvcard(profileData) {

			if (typeof profileData.name_kurz == 'undefined') {
				return false;
			}

			// App or Web?
			if (CONFIG.environment != 'app') {// || CONFIG.deviceOs == 'Android') { // todo: muss getestet werden

				// Display Loader
				LoaderFactory.showLoader(2);


				// Set variables
				var isChrome = (CONFIG.deviceBrowser == 'unknown') ? false : true,
					deviceOs = CONFIG.deviceOs,
					params = {
						action: 'vcard',
						data: profileData,
						imgUrl: null,
						deviceOS: CONFIG.deviceOs,
						deviceOsVersion: CONFIG.deviceOsVersion
					};

				if (profileData.premium_paket != 3) {
					params.imgUrl = profileData.portrait.pfad+'/medium/'+profileData.portrait.datei;
				}

				JamSyncService.ajax(CONFIG.apiUrlMobi + '_php/ajax.php', params, 'post')
					.success(function(result) {

						LoaderFactory.hideLoader(600,true);

						if (typeof result.data != 'undefined' && typeof result.data.filename != 'undefined') {

							var url = CONFIG.apiUrlMobi + '_php/vcf/'+result.data.filename;

							if (!isChrome && deviceOs == 'Android') {
								window.open(url, 'Download');
							} else {
								window.location.assign(url);
							}

							url = undefined;
						} else {

							// Error occured!
							var alertPopup = $ionicPopup.alert({
								title: 'Fehler',
								template: 'Leider kann der Kontakt nicht gespeichert werden.',
								okText: 'Ok'
							});
						}
					})

					.error(function() {

						LoaderFactory.hideLoader(0,true);

						var alertPopup = $ionicPopup.alert({
							title: 'Fehler',
							template: 'Leider kann der Kontakt nicht gespeichert werden.',
							okText: 'Ok'
						});

					});


				return false;

			} else {

				// Display Loader
				// https://github.com/apache/cordova-plugin-contacts
				if (typeof navigator.contacts != 'undefined') {

					LoaderFactory.showLoader(2);

					// Set variables
					var	deviceOs = CONFIG.deviceOs,

						params = {
							//id: profileData.ref_id,
							displayName: profileData.name_nice,
							name: profileData.name_nice,
							nickname: profileData.name_kurz,

							organizations: [],
							addresses: [{
								pref: true,
								type: 'work',
								formatted: profileData.strasse + "\n" + profileData.plz + " " + profileData.ort,
								streetAddress: profileData.strasse,
								locality: profileData.ort,
								postalCode: profileData.plz,
								country: 'Germany'
							}],
							phoneNumbers: [],
							photos: [],
							emails: [],
							urls: [],
							note: ''
					};

					// Add phone numbers
					if (profileData.tel) {
						params.phoneNumbers.push({
							pref: true,
							type: 'work',
							value: profileData.tel
						});
					}

					if (profileData.url) {
						params.urls.push({
							pref: true,
							type: 'work',
							value: "https://www.jameda.de" + profileData.url + "uebersicht/" + profileData.url_hinten
						});
					}

					if (typeof profileData.inst_name_nice != 'undefined') {
						params.organizations.push({
							pref: true,
							type: 'work',
							value: profileData.inst_name_nice
						});
					}

					// Add image
					if (profileData.premium_paket != 3) {
						params.photos.push({
							pref: true,
							type: 'work',
							value: profileData.portrait.pfad + '/medium/' + profileData.portrait.datei
						});
					}

					// Add notes (currently only signature, without business days)
					if (profileData.oeff) {

						params.note = "Öffnungszeiten:\n";

						var business = JamHelperFactory.getBusinessHours(profileData.oeff);
						Object.keys(business).forEach(function(key) {

							if (business[key].rows !== false) {

								params.note += business[key].day + ": ";

								for (var i=0; i < business[key].rows.length; i++) {

									if (business[key].rows[i] != '') {

										if (i == 2) {
											params.note += " und ";
										}

										params.note += business[key].rows[i];

										if (i == 0 || i == 2) {
											params.note += " - ";
										}
									}
								}
								params.note += "\n";
							}
						});
						params.note += "\n";
					}

					// add signature of jameda
					try {

						var curDate = Math.round(+new Date()/1000);
						params.note += JamHelperFactory.createDatum(curDate) + ' - ' + params.urls[0].value;

					} catch(e) {

						params.note += params.urls[0].value;
					}

					// add native support for vcards
					var myContact = navigator.contacts.create(params);
					myContact.save(function() {

						// Save success
						var alertPopup = $ionicPopup.alert({
							title: 'Kontakt gespeichert',
							cssClass: 'hint-popup',
							template: '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>Kontakt (vCard) gespeichert</span>',
							buttons: []
						});

						window.setTimeout(function() {
							alertPopup.close();
						}, 3000);

					}, function() {

						// Error occured!
						var alertPopup = $ionicPopup.alert({
							title: 'Fehler',
							template: 'Leider konnte der Kontakt (vCard) nicht gespeichert werden.',
							okText: 'Ok'
						});
					});

					LoaderFactory.hideLoader(600,true);
					return true;
				}

				var alertPopup = $ionicPopup.alert({
					title: 'Fehler',
					template: 'Leider konnte der Kontakt (vCard) nicht gespeichert werden.',
					okText: 'Ok'
				});
				return false;
			}
		}
	}
})();