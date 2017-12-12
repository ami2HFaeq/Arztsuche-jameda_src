(function () {

	'use strict';

	angular
		.module('app.otb')
		.controller('Otb', Otb);

	Otb.$inject = ['$scope', '$ionicHistory', '$state', '$http', '$stateParams', '$ionicNavBarDelegate', '$ionicPopup', 'CONFIG', 'JamHelperFactory', 'JamAppointmentCalendar', 'LoaderFactory', 'AnalyticsHelper', 'OrientationchangeFactory', 'JamLoginService', 'JamLoginFactory', '$ionicScrollDelegate', '$timeout', 'JamRegisterService'];

	function Otb($scope, $ionicHistory, $state, $http, $stateParams, $ionicNavBarDelegate, $ionicPopup, CONFIG, JamHelperFactory, JamAppointmentCalendar, LoaderFactory, AnalyticsHelper, OrientationchangeFactory, JamLoginService, JamLoginFactory, $ionicScrollDelegate, $timeout, JamRegisterService) {

		// set helper
		$scope.JamHelperFactory = JamHelperFactory;

		// show nav bar
		$ionicNavBarDelegate.showBar(true);

		// set config
		$scope.config = CONFIG;

		// page title
		$scope.pageTitle = 'jameda - Online Terminbuchung';

		// check login
		$scope.isLoggedIn = false;

		var vm = this,
			url = CONFIG.apiUrl + '/profil/' + $stateParams.fullRefId + '/';

		vm.profileDetails;
		vm.popup = null;
		vm.serviceDescription = '';
		vm.price = 'k.A.';
		vm.showPrice = true;

		vm.disableButton = false;
		vm.showInsuranceHint = false;
		vm.showServiceSelectError = false;
		vm.isErrorVisible = false;

		vm.toggleAcceptInvoice = toggleAcceptInvoice;
		vm.checkboxAcceptInvoice = false;
		vm.showAcceptError = false;
		vm.disableServiceType = false;

		vm.showHint = false;
		vm.hintMessage = '';

		vm.serviceSelect = 0;

		// Für Benutzeraccount benötigen wir zwei Passwortfelder
		vm.otb3Password1 = '';
		vm.otb3Password2 = '';

		// Hole das Profil
		JamHelperFactory.getProfile($stateParams.fullRefId, url).success(function(data) {

			vm.profileDetails = data;
			$scope.data = vm.profileDetails;

			// set canonical
			JamHelperFactory.setCanonical('https://www.jameda.de' + vm.profileDetails.url + 'termin/' + vm.profileDetails.url_hinten, false);


			// set current details
			$scope.otbDetails = JamHelperFactory.getOtbDataFromCache($stateParams.fullRefId);
			if (!$scope.otbDetails.insuranceType) {
				$scope.otbDetails.insuranceType = 'kasse';
			}

			// set height
			setScrollHeight();

			// check user state
			JamLoginFactory.checkLogin({}, {tracking: { key: 'Logins', value: 'OTB-Prozess'}}).success(function() {

				// is logged in
				$scope.isLoggedIn = true;

				// set current section id
				initOtbStep();

			}).error(function() {

				// is not logged in
				$scope.isLoggedIn = false;

				// set current section id
				initOtbStep();
			});
		});


		function initOtbStep() {

			// set current section id
			$scope.pageMainTitle = 'Ihre Terminbuchung';
			switch ($stateParams.curStepId) {
				default:
				case 'schritt-3':

					$scope.pageSubTitle = 'Schritt 3 von 5';
					$scope.curStepId = 'schritt-3';

					// set otb data
					$timeout(function() {
						initOtb1();
					}, 300);

					// set user email
					if ($scope.isLoggedIn) {
						$scope.otbDetails.email1 = CONFIG.userProfile.user.email;
					}

					break;

				case 'schritt-4a':

					// check step values
					if (!$scope.data || typeof $scope.otbDetails == 'undefined' || typeof $scope.otbDetails.appointmentStart == 'undefined') {

						$ionicHistory.clearHistory();
						$state.go('profile', { path: 'profil', fullRefId: $stateParams.fullRefId });

					} else {

						$scope.pageSubTitle = 'Schritt 4 von 5';
						$scope.curStepId = 'schritt-4a';
						$scope.showOtb2Info = true;
						$scope.showOtb2Password = false;
						$scope.showOtb2SendPassword = false;
						$scope.otbDetails.persist_login = true;

						$timeout(function() {
							$scope.checkOtbEmail1();
						}, 400);

					}

					break;

				case 'schritt-4b':

					// check step values
					if (!$scope.data || typeof $scope.otbDetails == 'undefined' || typeof $scope.otbDetails.appointmentStart == 'undefined') {

						$ionicHistory.clearHistory();
						$state.go('profile', { path: 'profil', fullRefId: $stateParams.fullRefId });

					} else {

						$scope.pageSubTitle = 'Schritt 4 von 5';
						$scope.curStepId = 'schritt-4b';

						$scope.otb2EmailIsEditable = ($scope.otbDetails.is_registered_user) ? false : true;
						$scope.otb2TelephoneIsEditable = ($scope.otbDetails.is_full_otb_user) ? false : true;

						// GATRACKING
						if ($scope.otb2EmailIsEditable) {
							AnalyticsHelper.trackEvent('OTB-Prozess - Aufrufe', 'Schritt 2 - Dateneingabe', 'ist nicht eingeloggt');
						} else {
							AnalyticsHelper.trackEvent('OTB-Prozess - Aufrufe', 'Schritt 2 - Dateneingabe', 'ist eingeloggt');
						}

						// set notify select
						$scope.notifyOptions = [
							{ name: 'Bitte wählen', id: 0 },
							{ name: 'Per E-Mail und Telefon (empfohlen)', id: 3 },
							{ name: 'Per E-Mail', id: 1 },
							{ name: 'Per Telefon', id: 2 }
						];

						if (typeof $scope.otbDetails.notify == 'undefined' || $scope.otbDetails.notify == 0) {
							$scope.notifySelect = $scope.notifyOptions[0];
							$scope.otbDetails.notify = 0;
						} else {
							if ($scope.otbDetails.notify == 3) $scope.notifySelect = $scope.notifyOptions[1];
							if ($scope.otbDetails.notify == 1) $scope.notifySelect = $scope.notifyOptions[2];
							if ($scope.otbDetails.notify == 2) $scope.notifySelect = $scope.notifyOptions[3];
						}


						$timeout(function() {
							$scope.checkOtb2bData(false);
						}, 400);
					}

					break;

				case 'schritt-4c':

					// check step values
					if (!$scope.data || typeof $scope.otbDetails == 'undefined' || typeof $scope.otbDetails.appointmentStart == 'undefined') {

						$ionicHistory.clearHistory();
						$state.go('profile', { path: 'profil', fullRefId: $stateParams.fullRefId });
					} else {

						$scope.pageSubTitle = 'Schritt 4 von 5';
						$scope.curStepId = 'schritt-4c';

						$scope.showSmsHint = ($scope.otbDetails.is_full_otb_user) ? false : true;
						$scope.showNewAccountInfo = ($scope.otbDetails.is_registered_user) ? false : true;

						$scope.otb3NextStepText = 'Weiter zu Schritt 5';
						if (!$scope.showSmsHint) {
							$scope.otb3NextStepText = 'Terminbuchung abschicken';
						}

						// reset error
						$scope.showOtb2cError = false;
						$scope.otb2cError = '';

						// set formatted date
						$scope.otbDetails.formattedDateLong = JamHelperFactory.formatDate($scope.otbDetails.appointmentStart, false);
						JamHelperFactory.addOtbDataToCache($scope.otbDetails);

						$timeout(function() {
							$scope.checkOtb2cData(false);
						}, 400);
					}

					break;

				case 'schritt-5':

					// check step values
					if (!$scope.data || typeof $scope.otbDetails == 'undefined' || typeof $scope.otbDetails.appointmentStart == 'undefined') {

						$ionicHistory.clearHistory();
						$state.go('profile', { path: 'profil', fullRefId: $stateParams.fullRefId });
					} else {

						$scope.pageSubTitle = 'Schritt 5 von 5';
						$scope.curStepId = 'schritt-5';

						// reset error
						$scope.showOtb3Error = false;
						$scope.otb3Error = '';

						$timeout(function() {
							$scope.checkOtb3Data(false);
						}, 400);
					}

					break;

				case 'buchung-abgeschlossen':

					$scope.pageMainTitle = 'Ihre Terminbuchung';
					$scope.pageSubTitle = 'Zusammenfassung';
					$scope.curStepId = 'buchung-abgeschlossen';

					break;
			}
		}


		$scope.$on('$ionicView.afterEnter', function() {

			LoaderFactory.hideLoader();

			// add event listener
			OrientationchangeFactory.initListener();
			
			// set Back Button
			switch ($stateParams.curStepId) {
				default:
					var buttonParams = {
						title: 'zurück'
					};
					break;

				case 'schritt-5':
					JamHelperFactory.resetBackButton();
					break;

				case 'buchung-abgeschlossen':
				case 'schritt-3':
					var buttonParams = {
						title: 'Profil',
						url: '/profil/uebersicht/' + $stateParams.fullRefId + '/'
					};
					break;
			}

			$timeout(function() {
				JamHelperFactory.setBackButton('back', buttonParams);
			}, CONFIG.backButtonDelay);

			// set page view url
			var trackingUrl = '';
			switch ($stateParams.curStepId) {
				case 'schritt-3':
					trackingUrl = '/otb/schritt-3/';
					break;
				case 'schritt-4a':
					trackingUrl = '/otb/schritt-4a/';
					break;
				case 'schritt-4b':
					trackingUrl = '/otb/schritt-4b/';
					break;
				case 'schritt-4c':
					trackingUrl = '/otb/schritt-4c/';
					break;
				case 'schritt-5':
					trackingUrl = '/otb/schritt-5/';
					break;
				case 'buchung-abgeschlossen':
					trackingUrl = '/otb/buchung-abgeschlossen/';
					break;
			}

			if (trackingUrl != '') {
				// GATRACKING
				AnalyticsHelper.trackPageview(trackingUrl);
			}

			// Prüfe, ob das alte URL-Schema verwendet wird und setze es dann auf "noindex"
			if ($stateParams.path == 'profil') {
				JamHelperFactory.setMeta('robots', 'noindex,follow');
			} else {
				JamHelperFactory.setMeta('robots', 'all');
			}

			// agof tracking
			if (typeof iom != "undefined") {
				var iam_data = {"st":"mobjamed", "cp":"10141", "sv":"mo", "co":"kommentar"};
				iom.h(iam_data,1);
			}
		});


		$scope.$on('$ionicView.beforeLeave', function() {

			if (vm.popup != null) vm.popup.close();

			JamHelperFactory.resetBackButton();
		});


		function initOTBOptions() {

			var serviceType = 'kasse';

			// Wenn aktuell kein Behandlungsgrund ausgewählt ist, den ersten Grund auswählen (Hinweismeldung)
			if (typeof $scope.serviceSelect == 'undefined') {
				$scope.serviceSelect = '0';
			}

			if (typeof $scope.data.otb == 'object' && typeof $scope.data.otb.services == 'object') {
				serviceType = $scope.otbDetails.insuranceType;

				Object.keys($scope.data.otb.services).forEach(function(key) {

					var service = $scope.data.otb.services[key];
					if (CONFIG.insuranceTypeIds[serviceType].indexOf(service.insurance_type) > -1) {
						if ($scope.otbDetails.serviceId == service.id) {
							vm.serviceSelect = service.id;
							$scope.checkServiceDetails(service);
						}
					}

					service = undefined;
				});
			}

			serviceType = undefined;
		}

		function initOtb1() {


			// set selected service
			if (typeof $scope.otbDetails.serviceId == 'undefined') {
				$scope.otbDetails.serviceId = 0;
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);
			}

			// set message to doctor
			if (typeof $scope.otbDetails.doctorMessage == 'undefined') {
				$scope.otbDetails.doctorMessage = '';
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);
			}

			// show otb1 service error? & hide calendar
			$scope.showOtb1ServiceError = false;
			$scope.showCalendar = false;

			initOTBOptions();

			// prepare OTB stuff
			//noinspection JSUnresolvedVariable
			current_profil = vm.profileDetails;
			//noinspection JSUnresolvedVariable
			current_page_id = 'otb-' + vm.profileDetails.fullRefId;

			if (typeof $scope.otbDetails.kasse_privat == 'undefined') {
				$scope.otbDetails.kasse_privat = 'kasse';
				$scope.otbDetails.insuranceType = 'kasse';

				JamHelperFactory.addOtbDataToCache($scope.otbDetails);
			}

			// calculate styles!
			var tmpWidth = $('#' + current_page_id + ' .jam-otb').width(),
				kalender_day_column_width = Math.round((tmpWidth + 3) / 7),
				kalender_day_column_height = '135';

			if (CONFIG.deviceType == 'tablet') {
				if (CONFIG.deviceOrientation == 'landscape') {
					kalender_day_column_width = Math.round(($('.otb-step-1 .jam-otb').width() + 3) / 7);
					kalender_day_column_height = CONFIG.contentHeight - $('#' + current_page_id + ' #profil-height-wrapper').height() - 208;
				} else {
					kalender_day_column_height = '300';
				}
			}

			// set dates
			var curDate = new Date(),
				curWeekInfo = JamHelperFactory.getWeekNumber(curDate.getTime()),
				curWeekStart = JamHelperFactory.getMonday(curDate);

			// init calendar
			var calParams = {
				cur_datum_obj: {
					tag: curDate.getDate(),
					monat: (curDate.getMonth() + 1),
					jahr: curDate.getFullYear()
				},
				cur_week: curWeekInfo[1],
				cur_startDay: Math.round((curWeekStart.getTime() / 1000)),
				cur_startDay_visible: Math.round((curWeekStart.getTime() / 1000)),
				fullRefId: $scope.data.ref_id+'_'+$scope.data.art
			};
			//noinspection JSUnresolvedVariable
			jamOTVKalOtb1 = new JamAppointmentCalendar(calParams);

			// add calendar
			var addCalParams = {
				name_kurz: current_profil.name_kurz,
				tel: current_profil.tel,
				ref_id: current_profil.ref_id,
				otv_link: current_profil.url + 'termin/' + current_profil.url_hinten
			};
			jamOTVKalOtb1.addKalender(addCalParams);

			// add appointment
			jamOTVKalOtb1.Kalender[current_profil.ref_id].selected_termine = [$scope.otbDetails.appointmentStart];

			// Wert überschreiben von localStorage
			$timeout(function() {
				$scope.toggleOtbInsuranceType(true);
			}, 1200);
		}


		$scope.checkServiceDetails = function(curService) {

			vm.serviceDescription = '';
			vm.price = 'keine Angabe';
			vm.showPrice = true;

			// Preisspanne und Behandlungsgrund-Beschreibung anzeigen
			if (typeof curService == 'object') {

				getOtbServiceDuration(curService.id);

				var isNumberServicePrice = [
					angular.isNumber(curService.min_price),
					angular.isNumber(curService.max_price)
				];

				// Prüfe, welche Preisangabe angezeigt werden soll
				if (isNumberServicePrice[0] || isNumberServicePrice[1]) {
					if (!isNumberServicePrice[1] || (isNumberServicePrice[0] && curService.min_price >= curService.max_price)) {
						vm.price = 'ca. ' + curService.min_price + ',- &euro;';
					} else if (!isNumberServicePrice[0]){
						vm.price = 'ca. ' + curService.max_price + ',- &euro;';
					} else if (isNumberServicePrice[0] && isNumberServicePrice[1] && curService.min_price < curService.max_price) {
						vm.price = 'ca. ' + curService.min_price + ',- bis ' + curService.max_price + ',- &euro;';
					}
				}

				if (curService.description != '') {
					vm.serviceDescription = curService.description.replace(/\n/gi,'<br>')+'<br><br>';
				}

				isNumberServicePrice = undefined;
			}
		};


		function setScrollHeight() {
			var timeout = (CONFIG.deviceType == 'tablet') ? 700 : 400;
			$timeout(function () {

				if (CONFIG.deviceType == 'tablet') {
					var elem = $ionicScrollDelegate.$getByHandle('otbScroll')._instances;
					elem = elem[elem.length-1].$element;

					if (elem.height() >= CONFIG.contentHeight) {
						elem.height(CONFIG.contentHeight-78)
					}
				} else {
					$ionicScrollDelegate.$getByHandle('otbScroll').resize();
				}
			}, timeout);
		}
		$scope.resetWindowHeight = setScrollHeight;


		$scope.toggleDoctorMessage = function() {

			// GATRACKING
			AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Optional: Persönl. Frage hinzufügen geklickt');

			// update otb data
			$scope.otbDetails.showDoctorMessage = true;
			JamHelperFactory.addOtbDataToCache($scope.otbDetails);
		};


		$scope.checkOtb1Termin = function(params) {

			var otbData = JamHelperFactory.getOtbDataFromCache($stateParams.fullRefId),
				isSameServiceName = false;

			if (typeof params != 'undefined') {

				if (typeof params.serviceSelect != 'undefined') {
					$scope.serviceSelect = params.serviceSelect;
				}

				isSameServiceName = params.isSameServiceName || false;
			}

			// check insurance type
			if (typeof otbData.fullRefId != 'undefined') {
				if (!(typeof jamOTVKalOtb1.ajax_is_loading != 'undefined' && jamOTVKalOtb1.ajax_is_loading == true)) {
					// get selected id
					var curServiceId = $scope.serviceSelect,
						curInsuranceType = $scope.otbDetails.insuranceType;

					if (curServiceId == null || curServiceId == '?') {
						curServiceId = otbData.serviceId;
					}

					// update otb data
					$scope.otbDetails = otbData;
					if (typeof otbData.insuranceType == 'undefined' && (curInsuranceType == 'kasse' || curInsuranceType == 'privat')) {
						$scope.otbDetails.insuranceType = curInsuranceType;
					}

					$scope.otbDetails.serviceId = parseInt(curServiceId);
					$scope.otbDetails.serviceDuration = getOtbServiceDuration(parseInt(curServiceId));
					JamHelperFactory.addOtbDataToCache($scope.otbDetails);

					// Behandlungsgrund-Hinweis für Selbstzahler standardmäßig deaktivieren
					vm.showInsuranceHint = false;

					if (typeof vm.profileDetails.otb.services[curServiceId] != 'undefined') {

						var curService = vm.profileDetails.otb.services[curServiceId];
						$scope.checkServiceDetails(curService);

						if (otbData.insuranceType == 'kasse' && [2, 5].indexOf(curService.insurance_type) != -1) {
							vm.showInsuranceHint = true;
						}
					} else {
						$('#' + current_page_id + ' #ota_form_preisspanne').html('k.A.');
					}

					// check appointment
						var tmpParams = {
							from: 'versichselect',
							ref_id: current_profil.ref_id,
							serviceId: curServiceId,
							kasse_privat: otbData.insuranceType,
							dauer: $scope.otbDetails.serviceDuration,
							fullRefId: $scope.otbDetails.fullRefId,
							isSameServiceName: isSameServiceName
						};
						jamOTVKalOtb1.checkTermin(tmpParams);
					}
				}

			// reset service error
			if (otbData.serviceId != 0) {
				$scope.showOtb1ServiceError = false;
			}
		};


		$scope.showError = function() {
			// is the calendar already visible?
			if ($('#' + current_page_id + ' #kalender_container' + $scope.data.ref_id).is(':visible')) {
				return false;
			}

			// show error message (only if error ota_service_error is not visible)
			$timeout(function() {
				if ($('#ota_service_error').is(':hidden')) {
					vm.showServiceSelectError = true;
				} else {
					vm.isErrorVisible = true;
				}
			}, 500);

			vm.serviceSelectErrorText = 'Lieber Patient,<br><br>'+ current_profil.name_kurz +' bietet f&uuml;r diesen Behandlungsgrund andere Zeiten an. Bitte w&auml;hlen Sie einen anderen Termin im Kalender.';
		};


		$scope.showOtb1Calendar = function() {

			// hide error
			vm.showServiceSelectError = false;
			// hide error
			$('#' + current_page_id + ' #ota_service_error').hide();

			// check if already loading
			if (typeof jamOTVKalOtb1.ajax_is_loading != 'undefined' && jamOTVKalOtb1.ajax_is_loading == true) {
				return false;
			}

			// already visible?
			if ($('#' + current_page_id + ' #kalender_container' + $scope.data.ref_id).is(':visible')) {
				return false;
			}

			$ionicScrollDelegate.$getByHandle('otbScroll').scrollTop();

			// get latest otbData
			var otbData = $scope.otbDetails;

			// check if service is selected
			if (otbData.serviceId == null) {
				$scope.showOtb1ServiceError = true;
			} else {
				$scope.showOtb1ServiceError = false;
			}

			// GATRACKING
			AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Termin ändern geklickt');

			// show/init calendar
			$('#' + current_page_id + ' #otb1-calendar-box').slideDown(400, function() {
				$scope.showCalendar = true;

				otbData.dauer = jamTmpDuration;
				otbData.useApi = vm.profileDetails.otb.useApi || false;
				jamOTVKalOtb1.initKalender(otbData);

				// Scroll-Höhe neu berechnen (da der Kalender jetzt hinzugefügt wird)
				setScrollHeight();

				if (CONFIG.deviceType == 'tablet') {
					//noinspection JSUnresolvedVariable
					kalender_day_column_width = Math.round(($('#' + current_page_id + ' .jam-otb').width() + 3) / 7);
				}
			});
		};


		function getOtbServiceDuration(serviceId) {

			var serviceDuration = 10;

			if (typeof $scope.data.otb == 'object' && typeof $scope.data.otb.services == 'object' && typeof $scope.data.otb.services[serviceId] != 'undefined') {
				serviceDuration = $scope.data.otb.services[serviceId].duration;
			}

			//noinspection JSUnresolvedVariable
			jamTmpDuration = serviceDuration;
			return serviceDuration;
		}


		$scope.toggleOtbInsuranceType = function(initialCall) {

			initialCall = initialCall || false;
			$scope.serviceSelect = this.serviceSelect;

			if (event) {
				event.preventDefault();
				event.stopPropagation();

				initOTBOptions();
			}

			// Mache nur weiter, wenn der Kalender aktuell nicht lädt
			if (typeof jamOTVKalOtb1 == 'undefined' || jamOTVKalOtb1.ajax_is_loading) {
				return false;
			}

			// get elements
			var otbData = JamHelperFactory.getOtbDataFromCache($stateParams.fullRefId),
				tmpServiceType = $scope.serviceSelect,
				isAvailable = 0,
				counterServices = 0,
				isSameServiceName = false;

			// Fehler ausblenden
			if (!initialCall) {
				angular.element('.otb-service-info').hide();
			}
			angular.element('#' + current_page_id + ' #ota_service_error').hide();

			Object.keys($scope.data.otb.services).forEach(function(key) {

				// Counter hochzählen
				if (CONFIG.insuranceTypeIds[$scope.otbDetails.insuranceType].indexOf($scope.data.otb.services[key].insurance_type) > -1) {
					counterServices++;
				}

				// Prüfe, ob der Behandlungsgrund (Titel) auch in anderen Kassenart verfügbar ist
				if (tmpServiceType != 0) {
					if ((key == tmpServiceType || (key != tmpServiceType && $scope.data.otb.services[tmpServiceType].title == $scope.data.otb.services[key].title)) &&
						CONFIG.insuranceTypeIds[$scope.otbDetails.insuranceType].indexOf($scope.data.otb.services[key].insurance_type) > -1) {
						isAvailable = parseInt(key);
						isSameServiceName = true;
					}
				}
			});

			// Behandlungsgründe deaktivieren
			if (counterServices == 0) {
				vm.disableServiceType = true;
				vm.showHint = true;
				vm.hintMessage = $scope.data.name_kurz+' bietet keine Online-Termine für '+(($scope.otbDetails.insuranceType != 'kasse') ? 'Privatpatienten' : 'Kassenpatienten')+' an.';

			} else {
				vm.disableServiceType = false;
				vm.showHint = false;
				vm.hintMessage = '';
			}

			// Reset des Behandlungsgrund
			vm.showInsuranceHint = false;

			// LocalStorage aktualisieren
			otbData.insuranceType = $scope.otbDetails.insuranceType;
			otbData.kasse_privat = $scope.otbDetails.insuranceType;
			otbData.serviceId = isAvailable;

			if (vm.serviceSelect !== 0) {
				$scope.serviceSelect = vm.serviceSelect;
			}

			// Zeige Meldung für Selbstzahler an (Nur für Typ 2 und 5, sowie Kassen-Art Kasse)
			if ($scope.serviceSelect != '0') {
				if ($scope.otbDetails.insuranceType == 'kasse' && [2, 5].indexOf($scope.data.otb.services[$scope.serviceSelect].insurance_type) > -1) {
					vm.showInsuranceHint = true;
				}
			}

			// Aktualisiere OTB-Daten
			JamHelperFactory.addOtbDataToCache(otbData);

			if (!initialCall) {
				$scope.serviceSelect = '0';

				// Überprüfe den Termin und zeige den richtigen Behandlungsgrund an
				if (isAvailable != 0 && isAvailable != '0') {
					// Quickfix für die Anzeige des Behandlungsgrund
					$timeout(function() {
						$timeout(function() {

					$scope.serviceSelect = isAvailable;
						$scope.checkOtb1Termin({
							serviceSelect: isAvailable,
							isSameServiceName: isSameServiceName
						});
						tmpServiceType = undefined;
						}, 100);
					}, 10);

				} else {

					$scope.serviceSelect = '?';
					$timeout(function() {
						$timeout(function() {
							$scope.serviceSelect = '0';
						}, 1000);
					}, 10);
				}
			} else {
				$timeout(function() {
					$scope.checkOtb1Termin();
				}, 10);
			}
		};


		$scope.updateDoctorMessage = function() {

			// update message
			$scope.otbDetails.doctorMessage = '';
			$scope.otbDetails.doctorMessage = $('#otb-' + $scope.data.ref_id + '_' + $scope.data.art + ' #otbDoctorMessage').val();
			JamHelperFactory.addOtbDataToCache($scope.otbDetails);
		};


		$scope.checkOtbEmail1 = function() {

			// set ref id
			var fullRefId = $scope.data.ref_id+'_'+$scope.data.art,
				curStep = $('#otb-' + fullRefId + ' .otb-step-2a'),
				curEmail = curStep.find('#otbEmail1').val(),
				curNextButton = curStep.find('.show-otb-step-2b-button');

			// check email
			if (curEmail.length < 8 || !JamHelperFactory.isValidEmail(curEmail)) {
				curNextButton.addClass('jam-button-inactive');
				return true;
			}

			// save data
			curNextButton.removeClass('jam-button-inactive');
			$scope.otbDetails.email1 = curEmail;
			JamHelperFactory.addOtbDataToCache($scope.otbDetails);
			return true;
		};


		$scope.checkOtbPassword = function() {

			// set ref id
			var fullRefId = $scope.data.ref_id+'_'+$scope.data.art,
				curStep = $('#otb-' + fullRefId + ' .otb-step-2a'),
				curPassword = curStep.find('#otbPassword').val(),
				curNextButton = curStep.find('.show-otb-step-2b-button');

			// check password length
			if (curPassword.length < 6) {
				curNextButton.addClass('jam-button-inactive');
				return true;
			}

			// save data
			curNextButton.removeClass('jam-button-inactive');
			return true;
		};

		$scope.checkStep2a = function() {

			// set ref id
			var fullRefId = $scope.data.ref_id+'_'+$scope.data.art,
				curStep = $('#otb-' + fullRefId + ' .otb-step-2a'),
				curNextButton = curStep.find('.show-otb-step-2b-button'),
				curEmail = $scope.otbDetails.email1,
				curEmailElement = curStep.find('#otbEmail1');

			if (curNextButton.hasClass('jam-button-inactive')) {
				return false;
			}

			// show loader
			LoaderFactory.showLoader(2);

			// get/set data
			var password = (curStep.find('#otbPassword').is(':visible')) ? curStep.find('#otbPassword').val() : false;

			$scope.otbDetails.is_registered_user = false;
			$scope.otbDetails.is_full_otb_user = false;
			JamHelperFactory.addOtbDataToCache($scope.otbDetails);


			// let's go
			if (password == false) {
				// check email

				// set params
				var params = {
					partner: CONFIG.partner,
					output: 'json',
					hash: CONFIG.hash,
					t: CONFIG.hashTime,
					aktion: 'checkAccount',
					email: curEmail,
					jsonp: 'JSON_CALLBACK'
				};

				// api call
				$http.jsonp(CONFIG.apiUrl + '/_scripts/json-api.php', { params: params })
					.success(function(response, status, headers, config) {

						if (response && response.error) {

							// timeout
							JamHelperFactory.showHashTimeout('',true, false);
							return false;

						} else if (response.result == 'success') {

							if (response.step && response.step == 'enter_pass') {

								// GATRACKING
								AnalyticsHelper.trackEvent('OTB-Prozess - Aufrufe', 'Zu dieser Email-Adresse gibt es einen Account angezeigt');

								// password required
								curEmailElement.prop('disabled', 'disabled');
								$scope.showOtb2Info = false;
								$scope.showOtb2Password = true;
								$scope.showOtb2SendPassword = true;
								curNextButton.addClass('jam-button-inactive');

								// scroll to top
								$ionicScrollDelegate.scrollTop();

							} else {
								// new account --> show next step
								$scope.showOtbStep2b();
							}

						} else {
							// show error
							$scope.showOtb2Error = true;
							$scope.otb2Error = response.error_msg;
						}

					})
					.error(function(data, status, headers, config) {
						// show error
						$scope.showOtb2Error = true;
						$scope.otb2Error = 'Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
					})
					.finally(function(data, status, headers, config) {
						// hide loader
						LoaderFactory.hideLoader(200);
					});

			} else {
				// email belongs to jameda account, user entered password
				// --> check password and login

				$scope.showOtb2Success = false;


				// prepare login data
				var loginData = {
					email: curEmail,
					passwort: password,
					persist_login: $scope.otbDetails.persist_login,
					f4a: 'yes'
				};


				// login
				JamLoginService.checkLogin(loginData, true).success (function (response) {

					// login successfull --> show next step
					// hide loader
					LoaderFactory.hideLoader(200);

					// login success -> data is stored now
					JamLoginFactory.saveLogin(response.result, loginData, {tracking: {key: 'Logins', value: 'OTB-Prozess'}});
					$scope.isLoggedIn = true;


					// check if user is verified already
					if (CONFIG.userProfile.user.otbData) {

						var curData = CONFIG.userProfile.user.otbData;

						$scope.otbDetails.is_registered_user = true;
						$scope.otbDetails.is_full_otb_user = (curData.telephone && curData.telephone.length > 0) ? true : false;
						$scope.otbDetails.gender = (curData.geschlecht && curData.geschlecht.length > 0) ? curData.geschlecht : response.userData.geschlecht;
						$scope.otbDetails.firstname = curData.first_name;
						$scope.otbDetails.lastname = curData.last_name;
						$scope.otbDetails.telephone = curData.telephone;
						$scope.otbDetails.notify = curData.notify;

					} else {

						$scope.otbDetails.is_registered_user = true;
						$scope.otbDetails.is_full_otb_user = false;
						$scope.otbDetails.gender = CONFIG.userProfile.user.geschlecht;
					}


					// update otb details
					JamHelperFactory.addOtbDataToCache($scope.otbDetails);

					// show next step
					$scope.showOtbStep2b();


				}).error (function (response) {

					// hide loader
					LoaderFactory.hideLoader(200);

					// Login failed
					$scope.isLoggedIn = false;
					$scope.showOtb2Error = true;
					$scope.otb2Error = response.message;

				});
			}
		};


		$scope.sendOtb2Password = function() {

			// GATRACKING
			AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Passwort vergessen geklickt');

			// show loader
			LoaderFactory.showLoader(2, ' ');

			// get email
			var curEmail = $scope.otbDetails.email1;

			// hide password link
			$scope.showOtb2SendPassword = false;

			// set params
			var params = {
				partner: CONFIG.partner,
				output: 'json',
				hash: CONFIG.hash,
				t: CONFIG.hashTime,
				aktion: 'forgotpass',
				email: curEmail,
				jsonp: 'JSON_CALLBACK'
			};

			// api call
			$http.jsonp(CONFIG.apiUrl + '/_scripts/json-api.php', { params: params })
				.success(function(response, status, headers, config) {

					if (response && response.error) {

						// timeout
						JamHelperFactory.showHashTimeout('', true, false);
						return false;

					} else if (response.result == 'success') {

						$scope.showOtb2Error = false;
						$scope.showOtb2Success = true;
						$scope.otb2Success = response.success_msg;

					} else {
						// show error
						$scope.showOtb2Error = true;
						$scope.showOtb2Success = false;
						$scope.otb2Error = response.error_msg;

						// show password link
						$scope.showOtb2SendPassword = true;
					}
				})
				.error(function(data, status, headers, config) {
					// show error
					$scope.showOtb2Error = true;
					$scope.showOtb2Success = false;
					$scope.otb2Error = 'Beim Zurücksetzen Ihres Passworts ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';

					// show password link
					$scope.showOtb2SendPassword = true;
				})
				.finally(function(data, status, headers, config) {
					// hide loader
					LoaderFactory.hideLoader(200);
				});


			return true;
		};


		$scope.checkOtb2bData = function(showAlert) {

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-2b');
			var curNextButton = curStep.find('.show-otb-step-2c-button');
			var firstname = curStep.find('#otb2Firstname').val();
			var lastname = curStep.find('#otb2Lastname').val();
			var email2 = ($scope.otb2EmailIsEditable) ? curStep.find('#otb2Email2').val() : false;
			var telephone = curStep.find('#otb2Telephone').val();
			var notify = curStep.find('#otb2Notify').val();

			var isValid = true,
				alertTitle = 'Hinweis',
				alertMessage = false;

			// get current data
			var otbData = JamHelperFactory.getOtbDataFromCache(fullRefId);


			// check gender
			if (typeof otbData.gender == 'undefined' || (otbData.gender != 'm' && otbData.gender != 'w')) {
				isValid = false;
				alertMessage = 'Bitte füllen Sie alle Felder aus um fortzufahren.';

				if (showAlert) {
					curStep.find('#otb-gender-w').parent().addClass('jam-error');
				}
			} else {
				curStep.find('#otb-gender-w').parent().removeClass('jam-error');
			}


			// check firstname
			if (firstname.length < 3) {
				isValid = false;
				alertMessage = 'Bitte füllen Sie alle Felder aus um fortzufahren.';

				if (showAlert) {
					curStep.find('#otb2Firstname').addClass('jam-error');
				}
			} else {
				curStep.find('#otb2Firstname').removeClass('jam-error');
			}


			// check lastname
			if (lastname.length < 3) {
				isValid = false;
				alertMessage = 'Bitte füllen Sie alle Felder aus um fortzufahren.';

				if (showAlert) {
					curStep.find('#otb2Lastname').addClass('jam-error');
				}
			} else {
				curStep.find('#otb2Lastname').removeClass('jam-error');
			}


			// check is new patient
			if (typeof otbData.isNewPatient == 'undefined' || (otbData.isNewPatient != 0 && otbData.isNewPatient != 1)) {
				isValid = false;
				alertMessage = 'Bitte füllen Sie alle Felder aus um fortzufahren.';

				if (showAlert) {
					curStep.find('#otb-isnewpatient-y').parent().addClass('jam-error');
				}
			} else {
				curStep.find('#otb-isnewpatient-y').parent().removeClass('jam-error');
			}


			// check notify
			if (notify == 0) {
				isValid = false;
				alertMessage = 'Bitte füllen Sie alle Felder aus um fortzufahren.';

				if (showAlert) {
					curStep.find('#otb2Notify').addClass('jam-error');
				}
			} else {
				curStep.find('#otb2Notify').removeClass('jam-error');
			}


			// check emails
			if (typeof otbData.email1 == 'undefined' || !JamHelperFactory.isValidEmail(otbData.email1)) {
				isValid = false;
				alertMessage = 'Bitte füllen Sie alle Felder aus um fortzufahren.';

				if (showAlert) {
					curStep.find('#otb2Email2').addClass('jam-error');
				}

			} else if (email2 !== false && otbData.email1 != email2) {
				isValid = false;
				alertMessage = 'Die Wiederholung Ihrer E-Mail Adresse stimmt nicht mit Ihrer ursprünglichen Eingabe überein.';

				if (showAlert) {
					curStep.find('#otb2Email2').addClass('jam-error');
				}
			} else {
				curStep.find('#otb2Email2').removeClass('jam-error');
			}


			// check mobile phone number
			if (!JamHelperFactory.isValidMobileNumber(telephone)) {
				isValid = false;
				alertMessage = 'Bitte geben Sie eine gültige Handynummer aus Deutschland an.';

				if (showAlert) {
					curStep.find('#otb2Telephone').addClass('jam-error');
				}
			} else {
				curStep.find('#otb2Telephone').removeClass('jam-error');
			}

			// set classes
			if (isValid) {
				// set button css
				curNextButton.removeClass('jam-button-inactive');

				// save values
				otbData.firstname = firstname;
				otbData.lastname = lastname;
				otbData.email2 = (email2 === false) ? '' : email2;
				otbData.telephone = telephone;
				otbData.notify = notify;
				$scope.otbDetails = otbData;

				// update otb details
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);

			} else {
				// set button css
				curNextButton.addClass('jam-button-inactive');

				if (showAlert && alertMessage !== false) {
					vm.popup = $ionicPopup.alert({
						title: alertTitle,
						template: alertMessage,
						buttons: [{
							text: 'schließen',
							type: 'button-default'
						}]
					});
				}
			}


			// return result
			return isValid;
		};


		$scope.toggleOtbGender = function(selectedValue) {

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-2b');
			var toggleGenderMale = curStep.find('#otb-gender-m');
			var toggleGenderFemale = curStep.find('#otb-gender-w');

			// get current value
			var otbData = JamHelperFactory.getOtbDataFromCache(fullRefId);


			// check current value
			if (otbData.gender && otbData.gender == selectedValue) return false;


			// set classes
			if (selectedValue == 'm') {
				toggleGenderMale.addClass('selected');
				toggleGenderFemale.removeClass('selected');

			} else {
				toggleGenderMale.removeClass('selected');
				toggleGenderFemale.addClass('selected');
			}


			// update otb data
			$scope.otbDetails.gender = selectedValue;
			JamHelperFactory.addOtbDataToCache($scope.otbDetails);


			// check current step
			$scope.checkOtb2bData(false);


			return true;
		};


		$scope.toggleOtbIsnewpatient = function(selectedValue) {

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-2b');
			var toggleIsnewpatientYes = curStep.find('#otb-isnewpatient-y');
			var toggleIsnewpatientNo = curStep.find('#otb-isnewpatient-n');

			// get current value
			var otbData = JamHelperFactory.getOtbDataFromCache(fullRefId);


			// check current value
			if (otbData.isNewPatient && otbData.isNewPatient == selectedValue) return false;


			// set classes
			if (selectedValue == 'y') {
				toggleIsnewpatientYes.addClass('selected');
				toggleIsnewpatientNo.removeClass('selected');

			} else {
				toggleIsnewpatientYes.removeClass('selected');
				toggleIsnewpatientNo.addClass('selected');
			}


			// update otb data
			$scope.otbDetails.isNewPatient = (selectedValue == 'y') ? 0 : 1;
			JamHelperFactory.addOtbDataToCache($scope.otbDetails);


			// check current step
			$scope.checkOtb2bData(false);


			return true;
		};


		$scope.showEmailRepeatInfo = function() {

			// GATRACKING
			AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Info-i geklickt', 'Warum wird Ihre E-Mail Adresse benötigt?');

			vm.popup = $ionicPopup.alert({
				title: 'Warum wird Ihre E-Mail Adresse benötigt?',
				template: 'Ihre E-Mail Adresse wird benötigt, um Ihnen gegebenenfalls eine Nachricht des Arztes zu Ihrem gebuchten Termin zukommen zu lassen.<br />In seltenen Fällen kann es vorkommen, dass der Arzt Ihren Termin verschieben muss. Bitte achten Sie daher auch in Ihrem eigenen Interesse auf die korrekte Schreibweise Ihrer E-Mail Adresse.',
				buttons: [{
					text: 'schließen',
					type: 'button-default'
				}]
			});
		};


		$scope.showPhoneInfo = function() {

			// GATRACKING
			AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Info-i geklickt', 'Warum wird Ihre Handynummer benötigt?');

			vm.popup = $ionicPopup.alert({
				title: 'Warum wird Ihre Handynummer benötigt?',
				template: 'Für unsere SMS-Verifikation benötigen wir einmalig Ihre Handynummer.',
				buttons: [{
					text: 'schließen',
					type: 'button-default'
				}]
			});
		};


		$scope.checkOtb2cData = function(showAlert, resetHeight, validatePassword) {

			if (typeof event != 'undefined') {
				event.stopPropagation();
				event.preventDefault();
			}

			validatePassword = validatePassword || false;

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-2c');
			var curNextButton = curStep.find('.show-otb-step-3-button');
			var agbCheckbox = curStep.find('.jam-checkbox-accept-agb');

			var isValid = true;
			var alertTitle = 'Hinweis';
			var alertMessage = false;


			if (typeof resetHeight != 'undefined' && resetHeight) {
				$scope.resetWindowHeight();
			}

			
			// check new account stuff
			$scope.otbDetails.createNewAccount = false;
			if (!$scope.otbDetails.is_registered_user) {
				var accountCheckbox = curStep.find('.jam-checkbox-create-account');
				if (accountCheckbox.hasClass('ion-ios-checkmark')) {
					$scope.otbDetails.createNewAccount = true;
				}
			}


			// check password
			$scope.otbDetails.newAccountPw = false;
			if ($scope.otbDetails.createNewAccount) {

				$scope.passwordBarometer = JamRegisterService.passwordStrength({value: vm.otb3Password1, minLength: 8});
				if (!$scope.passwordBarometer.error && vm.otb3Password1 == vm.otb3Password2) {
					$scope.otbDetails.newAccountPw = vm.otb3Password1;
				}

				if (!validatePassword) {
					$scope.passwordBarometer = null;
				}
			}


			// check agb
			$scope.otbDetails.agbAccepted = false;
			if (agbCheckbox.hasClass('ion-ios-checkmark')) {
				$scope.otbDetails.agbAccepted = true;
			}


			// set account error
			if ($scope.otbDetails.createNewAccount && !$scope.otbDetails.newAccountPw) {
				isValid = false;
				alertMessage = 'Bitte geben Sie ein Passwort für Ihr jameda Konto ein um fortzufahren.';
			}


			// set agb error
			if (isValid && !$scope.otbDetails.agbAccepted) {
				isValid = false;
				alertMessage = 'Bitte bestätigen Sie unsere AGB um fortzufahren.';
			}


			// set classes
			if (isValid) {
				// set button css
				curNextButton.removeClass('jam-button-inactive');

				// update otb details
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);

			} else {
				// set button css
				curNextButton.addClass('jam-button-inactive');

				if (showAlert && alertMessage !== false) {
					vm.popup = $ionicPopup.alert({
						title: alertTitle,
						template: alertMessage,
						buttons: [{
							text: 'schließen',
							type: 'button-default'
						}]
					});
				}
			}


			// return result
			return isValid;
		};


		$scope.toggleCreateAccount = function() {

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-2c');
			var curCheckbox = curStep.find('.jam-checkbox-create-account');
			var curPasswordBox = curStep.find('.otb3-new-password');

			if (curCheckbox.hasClass('ion-ios-circle-outline')) {
				// currently not selected --> select
				curCheckbox.removeClass('ion-ios-circle-outline');
				curCheckbox.addClass('ion-ios-checkmark');

				// show password
				curPasswordBox.slideDown();

				// GATRACKING
				AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Kostenloses jameda Konto geklickt');

				// save values
				$scope.otbDetails.createNewAccount = true;
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);

			} else {
				// currently selected --> deselect
				curCheckbox.addClass('ion-ios-circle-outline');
				curCheckbox.removeClass('ion-ios-checkmark');

				// hide password
				curPasswordBox.slideUp();

				// save values
				$scope.otbDetails.createNewAccount = false;
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);
			}


			// check current step
			$scope.checkOtb2cData(false);


			return true;
		};


		$scope.toggleAcceptAgb = function() {

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-2c');
			var curCheckbox = curStep.find('.jam-checkbox-accept-agb');

			if (curCheckbox.hasClass('ion-ios-circle-outline')) {
				// currently not selected --> select
				curCheckbox.removeClass('ion-ios-circle-outline');
				curCheckbox.addClass('ion-ios-checkmark');

				// GATRACKING
				AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Einverständnis zu AGB geklickt');

				// save values
				$scope.otbDetails.agbAccepted = true;
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);

			} else {
				// currently selected --> deselect
				curCheckbox.addClass('ion-ios-circle-outline');
				curCheckbox.removeClass('ion-ios-checkmark');

				// save values
				$scope.otbDetails.agbAccepted = false;
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);
			}


			// check current step
			$scope.checkOtb2cData(false);


			return true;
		};


		$scope.showOtb3Agb = function() {

			// GATRACKING
			AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - AGB öffnen geklickt ');

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-2c');
			var agbContainer = curStep.find('.otb3-agb-container');

			// get AGB
			var agbContent = JamHelperFactory.getFromCache('agb01', (86400*7));
			if (agbContent === false) {

				// prepare data
				var params = {
					partner: CONFIG.partner,
					hash: CONFIG.hash,
					t: CONFIG.hashTime,
					output: 'content_only'
				};

				// post ajax request
				$http.post(CONFIG.apiUrlMobi + '_php/ajax.php?action=load-agb', params)
					.success(function(response, status, headers, config) {
						JamHelperFactory.setIntoCache('agb01', response);

						$scope.otb3Agb = response;
						agbContainer.slideDown();

					})

					.error(function(data, status, headers, config) {
						LoaderFactory.hideLoader(0, true);

						if (status === 404 || status == '404') {
							JamHelperFactory.pageNotFound();
						} else {
							JamHelperFactory.showHashTimeout('', true, false, status);
						}
					});

			} else {
				// use data from cache

				$scope.otb3Agb = agbContent;
				agbContainer.slideDown();
			}


			return true;
		};


		$scope.sendOtbData = function() {

			// check login data if is registered user
			if (typeof CONFIG.userProfile.user == 'undefined' && $scope.otbDetails.is_registered_user === true) {
				// show login
				$state.go('otb', { curStepId: 'schritt-4a', fullRefId: $stateParams.fullRefId });
				return false;
			}

			// show loader
			LoaderFactory.showLoader(2, ' ');

			// set otbData
			var otbData = $scope.otbDetails;

			// set appointment date
			var appointmentDate = new Date(otbData.appointmentStart);

			// set params
			var params = {
				partner: CONFIG.partner,
				output: 'json',
				hash: CONFIG.hash,
				t: CONFIG.hashTime,
				ref_id: $scope.data.ref_id,
				aktion: 'saveOTBTermin',
				email: otbData.email1,
				// TODO API klären
				/*passwort: (otbData.user_pw !== false) ? otbData.user_pw : '', */
				terminstamp: appointmentDate.getTime(),
				kasse_privat: otbData.insuranceType,
				grund: otbData.serviceId,
				dauer: otbData.serviceDuration,
				is_new_patient: otbData.isNewPatient,
				telephone: otbData.telephone,
				first_name: otbData.firstname,
				last_name: otbData.lastname,
				geschlecht: otbData.gender,
				notify: otbData.notify,
				datenschutz: 'ja',
				nachricht: otbData.doctorMessage,
				mit_konto: (otbData.createNewAccount) ? 'ja' : 'nein',
				passwort1: (otbData.newAccountPw !== false) ? otbData.newAccountPw : '',
				passwort2: (otbData.newAccountPw !== false) ? otbData.newAccountPw : '',
				jsonp: 'JSON_CALLBACK'
			};

			// add optional login data
			var trackingAction = 'ist nicht eingeloggt';
			if (typeof CONFIG.userProfile.user != 'undefined') {
				params.loginHash = CONFIG.userProfile.user.loginHash;
				params.loginTime = CONFIG.userProfile.user.loginTime;
				trackingAction = 'ist eingeloggt';
			}


			// api call
			$http.jsonp(CONFIG.apiUrl + '/_scripts/json-api.php', { params: params })
					.success(function (response, status, headers, config) {

						if (response && response.error) {

							// timeout
							JamHelperFactory.showHashTimeout('', true, false);
							return false;

						} else if (response.result == 'success') {

							// GATRACKING
							AnalyticsHelper.trackEvent('OTB-Buchungsstrecke - Aufrufe', 'Termin gebucht', trackingAction);

							if (response.direct_activated && response.direct_activated == 'yes') {

								// no sms check required --> goto final page
								$ionicHistory.clearHistory();
								$state.go('otb', {
									curStepId: 'buchung-abgeschlossen',
									fullRefId: $stateParams.fullRefId
								});

							} else {

								// sms check required!!

								// save appointment ID
								$scope.otbDetails.appointmentId = response.new_termin_id;
								JamHelperFactory.addOtbDataToCache($scope.otbDetails);

								// goto enter-pin page
								$ionicHistory.clearHistory();
								$state.go('otb', {
									curStepId: 'schritt-5',
									fullRefId: $stateParams.fullRefId
								});
							}
						} else {

							if (response.error_msg) {
								// show error
								$scope.showOtb2cError = true;
								$scope.otb2cError = response.error_msg;

							}
						}

					})
					.error(function (data, status, headers, config) {
						// show error
						$scope.showOtb2cError = true;
						$scope.otb2cError = 'Beim Senden Ihrer Termin-Daten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
					})
					.finally(function (data, status, headers, config) {
						// hide loader
						LoaderFactory.hideLoader(200);
					});
		};


		$scope.checkOtb3Data = function(showAlert) {

			// get elements
			var fullRefId = $scope.data.ref_id + '_' + $scope.data.art;
			var curStep = $('#otb-' + fullRefId + ' .otb-step-3');
			var curNextButton = curStep.find('.show-otb-step-done-button');
			var curPin = curStep.find('#otb3Pin').val();

			var isValid = true;
			var alertTitle = 'Hinweis';
			var alertMessage = false;


			// check pin
			if (curPin.length < 4) {
				var isValid = false;
				alertMessage = 'Bitte geben Sie den Aktivierungscode ein um fortzufahren.';
			}


			// set classes
			if (isValid) {
				// set button css
				curNextButton.removeClass('jam-button-inactive');

				// update otb details
				$scope.otbDetails.pinCode = curPin;
				JamHelperFactory.addOtbDataToCache($scope.otbDetails);

			} else {
				// set button css
				curNextButton.addClass('jam-button-inactive');

				if (showAlert && alertMessage !== false) {
					vm.popup = $ionicPopup.alert({
						title: alertTitle,
						template: alertMessage,
						buttons: [{
							text: 'schließen',
							type: 'button-default'
						}]
					});
				}
			}


			// return result
			return isValid;
		};


		$scope.sendOtbPin = function() {

			// show loader
			LoaderFactory.showLoader(2, ' ');

			// set otbData
			var otbData = $scope.otbDetails,
				appointmentDate = new Date(otbData.appointmentStart),

				params = {
					partner: CONFIG.partner,
					hash: CONFIG.hash,
					t: CONFIG.hashTime,
					aktion: 'activateOTBTermin',
					email: otbData.email1,
					ref_id: $scope.data.ref_id,
					terminstamp: appointmentDate.getTime(),
					tid: otbData.appointmentId,
					datenschutz: 'ja',
					geschlecht: otbData.gender,
					mit_konto: (otbData.createNewAccount) ? 'ja' : 'nein',
					passwort1: (otbData.newAccountPw !== false) ? otbData.newAccountPw : '',
					passwort2: (otbData.newAccountPw !== false) ? otbData.newAccountPw : '',
					smscode: otbData.pinCode,
					jsonp: 'JSON_CALLBACK'
			};

			// api call
			$http.jsonp(CONFIG.apiUrl + '/_scripts/json-api.php', { params: params })
				.success(function(response, status, headers, config) {

					if (response && response.error) {

						// timeout
						JamHelperFactory.showHashTimeout('', true, false);
						return false;

					} else if (response.result == 'success') {

						// save otb data if account is already activated, and details are not set yet
						if ($scope.isLoggedIn && !CONFIG.userProfile.user.otbData) {

							var tmpOtbData = {
								is_registered_user: true,
								is_full_otb_user: (otbData.telephone && otbData.telephone.length > 0) ? true : false,
								gender: otbData.geschlecht,
								first_name: otbData.firstname,
								last_name: otbData.lastname,
								telephone: otbData.telephone,
								notify: otbData.notify
							};

							// Save userobj
							CONFIG.userProfile.user.otbData = tmpOtbData;
							JamLoginFactory.saveLogin(CONFIG.userProfile.user, { persist_login: CONFIG.userProfile.persist });
						}

						// läuft bei mir
						$ionicHistory.clearHistory();
						$state.go('otb', { curStepId: 'buchung-abgeschlossen', fullRefId: $stateParams.fullRefId });

					} else {
						if (response.error_msg) {
							// show error
							$scope.showOtb3Error = true;
							$scope.otb3Error = response.error_msg;
						}
					}

				})
				.error(function(data, status, headers, config) {
					// show error
					$scope.showOtb2cError = true;
					$scope.otb2cError = 'Beim Senden Ihres SMS-Codes ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
				})
				.finally(function(data, status, headers, config) {
					// hide loader
					LoaderFactory.hideLoader(200);
				});
		};


		$scope.togglePersistLogin = function(currentState) {

			// update otb details
			$scope.otbDetails.persist_login = (currentState) ? false : true;
			JamHelperFactory.addOtbDataToCache($scope.otbDetails);
		};


		$scope.otb1Logout = function() {

			// Selbstzahler bestätigen, davor nicht ausloggen!
			if (vm.showInsuranceHint && !vm.checkboxAcceptInvoice) {
				vm.showAcceptError = true;
				$ionicScrollDelegate.scrollTop(true);
				return false;
			}

			// do logout
			JamLoginFactory.logout(true);

			$scope.isLoggedIn = false;
			$scope.otbDetails.email1 = '';

			var gotoToOtb2a = true,
				otbDetails = JamHelperFactory.getOtbDataFromCache($scope.data.ref_id + '_' + $scope.data.art);

			if (typeof otbDetails != 'object' || typeof otbDetails.serviceId == 'undefined' || otbDetails.serviceId == 0 || !selectedTerminIsChecked) {

				// input missing, scroll to top
				$ionicScrollDelegate.scrollTop();
			} else {

				// input ok --> show next step
				$state.go('otb', { curStepId: 'schritt-4a', fullRefId: $stateParams.fullRefId });
			}

			return true;
		};


		function checkOtb1Data() {

			// check otb data
			var otbDetails = JamHelperFactory.getOtbDataFromCache($stateParams.fullRefId);
			if (typeof otbDetails != 'object' || typeof otbDetails.serviceId == 'undefined') return false;

			// check service
			if (otbDetails.serviceId == 0 || $scope.serviceSelect == 0 || otbDetails.serviceId == null) {

				// GATRACKING
				AnalyticsHelper.trackEvent('OTB-Prozess - Fehlermeldungen', 'Bitte wählen Sie einen Behandlungsgrund aus');

				$scope.showOtb1ServiceError = true;
				return false;
			}

			// check termin ok?
			if (!selectedTerminIsChecked || jamOTVKalOtb1.errorOccured) {
				vm.disableButton = true;
				return false;
			}
			vm.disableButton = false;

			return true;
		}


		$scope.showOtbStep2a = function() {

			// Selbstzahler bestätigen
			if (vm.showInsuranceHint && !vm.checkboxAcceptInvoice) {
				vm.showAcceptError = true;
				$ionicScrollDelegate.scrollTop(true);
				return false;
			}

			// check otb data
			if (!checkOtb1Data()) return false;

			// change page
			$state.go('otb', { curStepId: 'schritt-4a', fullRefId: $stateParams.fullRefId });
		};


		$scope.showOtbStep2b = function(checkStep1) {

			// check otb data?
			$scope.otbDetails = JamHelperFactory.getOtbDataFromCache($scope.otbDetails.fullRefId);

			// Selbstzahler bestätigen
			if (vm.showInsuranceHint && !vm.checkboxAcceptInvoice) {
				vm.showAcceptError = true;
				$ionicScrollDelegate.scrollTop(true);
				return false;
			}

			if (!selectedTerminIsChecked || jamOTVKalOtb1.errorOccured) {
				vm.disableButton = true;
				return false;
			}
			vm.disableButton = false;

			if ($scope.otbDetails.serviceId == null) {
				$scope.showOtb1ServiceError = true;
			} else {
				var check = checkStep1 ||false;
				if (check) {

					// check step 1 data
					if (!checkOtb1Data()) return false;

					// check if user is verified already
					if (CONFIG.userProfile.user.otbData) {

						var curData = CONFIG.userProfile.user.otbData;

						$scope.otbDetails.is_registered_user = true;
						$scope.otbDetails.is_full_otb_user = (curData.telephone && curData.telephone.length > 0) ? true : false;
						$scope.otbDetails.gender = (curData.geschlecht && curData.geschlecht.length > 0) ? curData.geschlecht : 'm';
						$scope.otbDetails.firstname = curData.first_name;
						$scope.otbDetails.lastname = curData.last_name;
						$scope.otbDetails.telephone = curData.telephone;
						$scope.otbDetails.notify = curData.notify;

					} else {

						$scope.otbDetails.is_registered_user = true;
						$scope.otbDetails.is_full_otb_user = false;
						$scope.otbDetails.gender = CONFIG.userProfile.user.geschlecht;
					}

					// update otb details
					JamHelperFactory.addOtbDataToCache($scope.otbDetails);
				}

				// change page
				$state.go('otb', { curStepId: 'schritt-4b', fullRefId: $stateParams.fullRefId });
			}
		};


		$scope.showOtbStep2c = function() {

			var isValid = $scope.checkOtb2bData(true);

			if (isValid) {
				// change page
				$state.go('otb', { curStepId: 'schritt-4c', fullRefId: $stateParams.fullRefId });
			}
		};


		$scope.showOtbStep3 = function() {

			var isValid = $scope.checkOtb2cData(true);

			if (isValid) {
				// send otb data
				$scope.sendOtbData();
			}
		};


		$scope.showOtbStepDone = function() {

			var isValid = $scope.checkOtb3Data(true);

			if (isValid) {
				// send otb data
				$scope.sendOtbPin();
			}
		};

		$scope.showOtbHome = function() {
			$ionicHistory.clearHistory();
			$state.go('home');
		};

		$scope.backToOtbStep = function(targetStep, source) {

			// GATRACKING
			source = source || 'unknown';
			switch (source) {
				case 'change_appointment':
					AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Termin ändern geklickt');
					break;
				case 'change_insurance':
					AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Ihre Versicherung ändern geklickt');
					break;
				case 'change_service':
					AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Behandlungsgrund ändern geklickt');
					break;
				case 'change_name':
					AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Name ändern geklickt');
					break;
				case 'change_email':
					AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Emailadresse ändern geklickt');
					break;
				case 'change_phone':
					AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Buchungsübersicht - Telefonnummer ändern geklickt');
					break;
			}

			// change page
			$ionicHistory.clearHistory();
			$state.go('otb', { curStepId: targetStep, fullRefId: $stateParams.fullRefId });
		};


		$scope.backToStep2a = function() {

			// GATRACKING
			AnalyticsHelper.trackEvent('OTB-Prozess - Klicks', 'Email-Adresse ändern geklickt');

			// change page
			$ionicHistory.clearHistory();
			$state.go('otb', { curStepId: 'schritt-4a', fullRefId: $stateParams.fullRefId });
		};


		function toggleAcceptInvoice() {

			if (vm.showAcceptError) vm.showAcceptError = false;
			vm.checkboxAcceptInvoice = (vm.checkboxAcceptInvoice) ? false : true;
		}

	}
})();