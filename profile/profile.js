(function () {

	'use strict';

	angular
		.module('app.profile')
		.controller('Profile', Profile);

	Profile.$inject = ['$window','$scope', '$ionicViewSwitcher', '$location', '$ionicHistory', '$ionicNavBarDelegate', '$ionicScrollDelegate', '$sce', '$state', '$stateParams', 'CONFIG', '$timeout', 'JamHelperFactory', 'JamAppointmentCalendar', '$ionicActionSheet', '$ionicPopup', 'AnalyticsHelper', 'LoaderFactory', 'OrientationchangeFactory', '$ionicModal', '$ionicSlideBoxDelegate', 'JamVCardHelper', 'CacheFactory', 'JamLoginFactory'];

	function Profile($window, $scope, $ionicViewSwitcher, $location, $ionicHistory, $ionicNavBarDelegate, $ionicScrollDelegate, $sce, $state, $stateParams, CONFIG, $timeout, JamHelperFactory, JamAppointmentCalendar, $ionicActionSheet, $ionicPopup, AnalyticsHelper, LoaderFactory, OrientationchangeFactory, $ionicModal, $ionicSlideBoxDelegate, JamVCardHelper, CacheFactory, JamLoginFactory) {

		// set view model
		var vm = this;

		vm.config = CONFIG;
		vm.isLoaded = false;
		vm.deviceType = (CONFIG.deviceType == 'phone') ? 'jam-is-phone' : 'jam-is-tablet';
		vm.deviceOrientation = CONFIG.deviceOrientation;

		vm.setBackButton = true;
		vm.otbRetries = 0;
		vm.isChrome = (CONFIG.deviceBrowser == 'unknown') ? false : true;
		vm.deviceOs = CONFIG.deviceOs;

		vm.noFollowTestArray = ['80404468','81101832','80120032','80278400','80339124','81018478','81333356', '81302041', '81344597', '81122679', '71005461000', '81216238', '81092594', '81229217', '80035136', '81060906', '3147', '81176289', '81127441', '81100821', '80117090', '80433271', '81087711', '81250038', '80318611', '80426426', '81091124', '81014560', '81004885', '81233996', '80273136', '80114612', '71114211000', '80237081', '80099498', '81195117', '81082574', '81022630', '80072184', '81049210', '81220714', '81344558', '81091199', '81008861', '80294879', '80126399', '81329494', '3041', '81090867', '81101832', '81030605', '80104090', '80295720', '80235668', '80032867', '3023', '3027', '3140', '3040', '3147'];
		vm.isNoFollowTest = false;

		// Karte
		vm.googleMapsStatic = {
			url: '',
			height: 150,
			width: 300
		};
		vm.setGoogleMaps = setGoogleMaps;

		// gallery data
		vm.galleryImages = [];
		vm.galleryIndexBig = 0;
		vm.galleryIndexSmall = 0;
		vm.bigGalleryDiff = 0;
		vm.showBigGallery = (CONFIG.deviceOs == 'Android' && CONFIG.deviceBrowser != 'chrome') ? false : true;
		vm.pageLoaded = false;
		vm.slideChangeCounter = 1;
		vm.popup = null;
		vm.data;

		vm.serviceType;
		vm.serviceId;
		vm.insuranceType;
		vm.disableServiceType = false;
		vm.showArticles = true;

		if (typeof vm.insuranceType == 'undefined') {
			vm.insuranceType = 'kasse';
		}
		if (typeof vm.serviceType == 'undefined') {
			vm.serviceType = 'select';
		}

		// set helper
		vm.JamHelperFactory = JamHelperFactory;
		vm.toggleFavourite = toggleFavourite;
		vm.showBadge = showBadge;
		vm.showAeaInfo = showAeaInfo;
		vm.showGoogleHeader = showGoogleHeader();

		// show nav bar
		$ionicNavBarDelegate.showBar(true);

		$scope.$parent.$on("$ionicView.beforeEnter",function() {

			vm.profileFavourites = JamHelperFactory.getFavourites();

			if (JamHelperFactory.pageLoaded) {
				var documentReadyEvent = angular.element(document).ready(function () {

					$timeout(function() {
						loadSliderImages(0);
					}, 400);

					documentReadyEvent = undefined;
				});
			} else {

				JamHelperFactory.pageLoaded = true;

				var loadEventStarted = false,
					timer = 8000,
					windowLoadEvent = angular.element($window).bind('load', function() {

						loadEventStarted = true;
						loadSliderImages(0);

						windowLoadEvent.unbind('load');
						windowLoadEvent = undefined;
					});

				if (CONFIG.environment == 'app') {
					timer = 1000;
				}

				// Something went wrong with the load event (call after 10 sec)
				$timeout(function() {
					if (!loadEventStarted) {
						loadSliderImages(0);
					}
					loadEventStarted = undefined;
				},timer);
			}
		});

		$scope.$on("$ionicView.beforeEnter", function() {

			//noinspection JSUnresolvedVariable
			jamOTVKalProfil = undefined;
			if (vm.data == 'undefined' || vm.data == null) {
				getProfile();
			} else {

				if (vm.data.showOtb && typeof vm.data.otb.services != 'undefined') {
					$timeout(function() {
						initOtb(vm.data);
					}, 500);
				}
				LoaderFactory.hideLoader(600);
			}
		});

		$scope.$on("$ionicView.afterEnter", function() {

			vm.otbRetries = 0;

			if (vm.isLoaded) {
				LoaderFactory.hideLoader(0);
			}

			// add event listener
			OrientationchangeFactory.initListener();

			// set back button
			if (vm.setBackButton) {
				setProfileBackButton();
			} else {
				vm.setBackButton = true;
			}

			// Setze Meta-Informationen, wenn die Daten bereits vorhanden sind
			if (typeof vm.data != 'undefined' && typeof vm.data.meta != 'undefined') {
				JamHelperFactory.setMetaData(vm.data.meta);

				// Kategorie und Fachgebiet Tracking (nur wo der TrackingParameter mit übergeben wurde)
				if (typeof vm.data != 'undefined' && typeof vm.data.tracking != 'undefined') {
					if (typeof vm.data.tracking.adsc_kategorie != 'undefined') {
						AnalyticsHelper.setCustomVar({index: 8, name: 'Content-Kategorie', value: vm.data.tracking.adsc_kategorie, opt_scope: 3});
					}
					if (typeof vm.data.tracking.adsc_fachgebiet != 'undefined') {
						AnalyticsHelper.setCustomVar({index: 9, name: 'Fachgebiet', value: vm.data.tracking.adsc_fachgebiet, opt_scope: 3});
					}
				}
			}

			// Prüfe, ob das alte URL-Schema verwendet wird und setze es dann auf "noindex"
			if ($stateParams.path == 'profil') {
				JamHelperFactory.setMeta('robots', 'noindex,follow');
			} else {
				JamHelperFactory.setMeta('robots', 'all');
			}

			// GATRACKING
			AnalyticsHelper.trackPageview('/profil/');


			// agof tracking
			if (typeof iom != "undefined") {
				var iam_data = {"st":"mobjamed", "cp":"10141", "sv":"mo", "co":"kommentar"};
				iom.h(iam_data,1);
			}

			vm.isLoaded = true;
		});

		$scope.$on('$ionicView.beforeLeave', function() {

			//LoaderFactory.showLoader(2);
			JamHelperFactory.resetBackButton();

			// Beim Verlassen Fenster und Türen schließen
			closeModal();

			// lösche custom_vars wieder
			AnalyticsHelper.deleteCustomVar(8);
			AnalyticsHelper.deleteCustomVar(9);
			AnalyticsHelper.deleteCustomVar(10);
			AnalyticsHelper.deleteCustomVar(11);

			if (vm.popup !== null) {
				vm.popup.close();
			}
		});


		$scope.$on('$ionicView.afterLeave', function() {

			//noinspection JSUnresolvedVariable
			jamOTVKalProfil = undefined;
			vm.isLoaded = false;
			$('.addLoader').removeClass('addLoader');
		});


		function toggleFavourite(refId, $event) {

			var isFav = JamHelperFactory.toggleFavourite(refId),
				template;

			if (isFav) {
				template = 'zur Merkliste hinzugefügt';
			} else {
				template = 'aus Merkliste entfernt';
			}

			vm.popup = $ionicPopup.show({
				template: '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>'+template+'</span>',
				cssClass: 'hint-popup',
				title: '',
				scope: $scope,
				buttons: []
			});

			$timeout(function() {
				vm.popup.close();
			}, 1800);
		}

		function loadSliderImages(type) {

			var elems = [];

			$timeout(function() {

				if (type == 0) {
					elems = angular.element('.loadSliderImage');
				} else {
					elems = angular.element('.loadSliderImageBig');
				}

				if (elems.length == 0) {
					elems = undefined;

					loadSliderImages(type);
					return false;
				}

				for (var i=0; i < elems.length;i++) {

					var elem = elems[i];
					if (type == 0) {
						elem.outerHTML = "<img src='"+elem.attributes[1].nodeValue+"' width='"+elem.attributes[2].nodeValue+"' height='"+elem.attributes[3].nodeValue+"' />";
					} else {
						elem.outerHTML = "<img class='fullscreen-image' src='"+elem.attributes[1].nodeValue+"' />";
					}
					elem = undefined;
				}
				elems = undefined;
			},200);
		}

		function getProfile() {

			$timeout(function() {

				// check preloaded profile data
				var preLoadedProfileDetails = JamHelperFactory.getPreloadedProfileFromCache($stateParams.fullRefId),
					url = $ionicHistory.currentView().url;
				if (preLoadedProfileDetails !== false) {
					// pre-set view data
					vm.data = preLoadedProfileDetails;

					if (vm.data.url == '/arztsuche/auswahl/') {
						vm.data.evaluateOverviewURL = CONFIG.urlPrefix + '/profil/bewertungen/' +vm.data.fullRefId+'/';
					}
				}

				JamHelperFactory.getProfile($stateParams.fullRefId, url).success(function(data) {

					// set view data
					vm.data = data;

					if (vm.data.url == '/arztsuche/auswahl/') {
						vm.data.evaluateOverviewURL = CONFIG.urlPrefix + '/profil/bewertungen/' +vm.data.fullRefId+'/';
					}

					setGoogleMaps();

					// load OTB?
					if (typeof jamOTVKalProfil == 'undefined' || (vm.data.showOtb && typeof vm.data.otb.services != 'undefined')) {
						$timeout(function() {
							initOtb(vm.data);
						}, 500);
					}

					// set canonical
					JamHelperFactory.setCanonical(vm.data.canonical, true);

					// if profile was requested of a search, save data to localStorage for "letzte Suchen"
					if ($stateParams.isSearch == 'true' || $stateParams.isSearch == true) {

						CacheFactory.setPersonSearch(vm.data);
						CacheFactory.getFromCache('searchCache').then(function(searchFromCache) {

							CacheFactory.setIntoCache("searchCache", searchFromCache);

						}, function() {
							// initial im LocalStorage speichern
							CacheFactory.setIntoCache("searchCache", true);
						});
					}

					// image gallery
					if (vm.data.bilder) {
						Object.keys(vm.data.bilder).sort().forEach(function(key) {
							var curImage = vm.data.bilder[key];
							vm.galleryImages.push(curImage);
						});
					}


					if (vm.data.bilder || vm.data.hasProfileImage) {
						loadGalleryTemplate();
					}


					// Setze Meta-Informationen
					JamHelperFactory.setMetaData(vm.data.meta);

					// Rest-73: NoFollowTest
					if (vm.noFollowTestArray.indexOf(vm.data.ref_id) > -1) {
						vm.isNoFollowTest = true;
					}

					// set back button
					$timeout(function() {
						vm.setBackButton = false;
						setProfileBackButton();
					}, 10);

					// set maps url
					$timeout(function() {

						// set city image
						JamHelperFactory.setCityImage(vm.data.ort);

						// Fix for Android and Chrome
						if (!vm.isChrome && vm.deviceOs == 'Android') {

							$('[nav-view="active"] .jam-content').css({'float': 'right'});

							$timeout(function() {
								$('[nav-view="active"] .jam-content').css({'float': 'left'});
							},10);
						}

						// set link listener
						if (CONFIG.deviceType == 'tablet' && CONFIG.environment == 'app') {
							$timeout(function() {
								$('a[target="_system"]').click(function () {
									var url = $(this).attr('href');
									window.open(encodeURI(url), '_system', 'location=yes');
									return false;
								})
							}, 300);
						}

						if ($stateParams.doAction !== null) {

							switch($stateParams.doAction) {
								case 'addBeos':

									JamHelperFactory.addObservation(vm.data.fullRefId).success(function(result) {

										var template = '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>Sie beobachten nun diesen Eintrag und werden bei neuen Bewertungen automatisch per E-Mail informiert.</span>';

										vm.popup = $ionicPopup.show({
											template: template,
											cssClass: 'hint-popup hint-popup-big',
											title: '',
											scope: $scope,
											buttons: []
										});

										$timeout(function() {
											vm.popup.close();
										},4000);

									}).error(function() {

										var template = '<div><i class="icons ion-ios-close"></i></div><span>Dieser Eintrag konnte leider nicht gespeichert werden.</span>';

										vm.popup = $ionicPopup.show({
											template: template,
											cssClass: 'hint-popup',
											title: '',
											scope: $scope,
											buttons: []
										});

										$timeout(function() {
											vm.popup.close();
										},1800);
									});

									break;
							}
						}

						// close loader
						LoaderFactory.hideLoader(600);
					}, 400);

					vm.slideChangeCounter = 1;

					// Kategorie und Fachgebiet Tracking (nur wo der TrackingParameter mit übergeben wurde)
					if (typeof vm.data != 'undefined' && typeof vm.data.tracking != 'undefined') {
						if (typeof vm.data.tracking.adsc_kategorie != 'undefined') {
							AnalyticsHelper.setCustomVar({index: 8, name: 'Content-Kategorie', value: vm.data.adParams.adsc_kategorie, opt_scope: 3});
						}
						if (typeof vm.data.adParams.adsc_fachgebiet != 'undefined') {
							AnalyticsHelper.setCustomVar({index: 9, name: 'Fachgebiet', value: vm.data.adParams.adsc_fachgebiet, opt_scope: 3});
						}
					}

					if (typeof vm.data != 'undefined' && typeof vm.data.testUser != 'undefined') {
						AnalyticsHelper.setCustomVar({index: 11, name: 'REST-457', value: vm.data.testUser, opt_scope: 3});
					}

					if (typeof vm.data != 'undefined' && typeof vm.data.acxid_p != 'undefined') {
						AnalyticsHelper.setCustomVar({index: 10, name: vm.data.acxid_p, value: "0", opt_scope: 3});
					}

					// GATRACKING
					/*if (vm.data.home_url && vm.data.premium_paket > 4) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Kunden-Homepage angezeigt');
					 }

					 if (!vm.data.businessHours) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Keine Öffnungszeiten hinterlegt');
					 }

					 if (vm.data.hasProfileImage) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Profilbild angezeigt');
					 }

					 if (vm.data.bilder) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Praxisbilder angezeigt');
					 }

					 if (vm.data.showAreYouDrX) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Sind Sie Dr. X angezeigt');
					 }*/

					if (vm.data.showPremiums) {
						AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Kunden-in-Umgebung angezeigt');

						if (vm.data.showPremiumsTpf) {
							AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Kunden-in-Umgebung TPF angezeigt');
						}
					}

					if (vm.data.showOtb == 1) {
						AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Terminbuchung angezeigt');
					}

					/*if (vm.data.locationModule.showLocationModule) {
					 if (vm.data.locationModule.hasMultiLocations) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Standorte & Kollegen - Standorte angezeigt');
					 }

					 if (vm.data.locationModule.hasColleagues) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Standorte & Kollegen - Kollegen angezeigt');
					 }
					 }

					 if (vm.data.showTop10Badge) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Top 10 Siegel angezeigt');
					 }

					 if (vm.data.showRatingsBadge) {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Qualitätssiegel angezeigt');
					 }

					 if (vm.data.inst_profil_url && vm.data.verbind_typ != 'E') {
					 //AnalyticsHelper.trackEvent('Profil - Aufrufe', 'Institution angezeigt');
					 }*/
				});
			}, 100);
		}

		// resize!
		$ionicScrollDelegate.resize();

		function initOtb(profileDetails) {

			vm.data = vm.data || profileDetails || false;
			if (typeof vm.data.ref_id == 'undefined' || typeof vm.data.otb == 'undefined' || typeof vm.data.otb.services == 'undefined') {
				return false;
			}

			var fullRefId = vm.data.ref_id+'_'+vm.data.art,
				navView,
				otbContainer,
				otbContainerWidth = CONFIG.windowWidth - 33;

			// reset OTB data on profile pages
			JamHelperFactory.addOtbDataToCache({});

			// prepare OTB stuff
			//noinspection JSUnresolvedVariable
			current_profil = vm.data;
			//noinspection JSUnresolvedVariable
			current_page_id = 'profile-' + fullRefId;

			// get elements
			navView = $('[nav-view="active"]');
			if (navView.length == 0) {
				vm.otbRetries++;
				if (vm.otbRetries < 10) {
					// try again... because nav view is not active yet
					$timeout(function() {
						initOtb(vm.data);
					}, 200);
					return false;
				}
			}

			otbContainer = navView.find('#' + current_page_id + ' .jam-otb');
			if (otbContainer.length != 0) {
				otbContainerWidth = otbContainer.width();
			}

			if (CONFIG.deviceType == 'tablet' && (otbContainerWidth < 200 || otbContainerWidth == CONFIG.windowWidth - 33)) {
				vm.otbRetries++;
				if (vm.otbRetries < 10) {
					// try again, because device is too slow (screen is not fully rendered yet)
					$timeout(function() {
						initOtb(profileDetails);
					}, 400);
					return false;
				}
			}

			// calculate styles
			//noinspection JSUnresolvedVariable
			kalender_day_column_width = Math.round((otbContainerWidth + 3) / 7);
			//noinspection JSUnresolvedVariable
			kalender_day_column_height = '135';

			if (CONFIG.deviceType == 'tablet') {
				if (CONFIG.deviceOrientation == 'landscape') {
					//noinspection JSUnresolvedVariable
					kalender_day_column_height = CONFIG.contentHeight - $('#' + current_page_id + ' #profil-height-wrapper').height() - 208;

					// set otb height
					$timeout(function() {
						var otbHeight = navView.find('#' + current_page_id + ' .profile-left').height() - navView.find('#' + current_page_id + ' .profile-left-top').height() - 190;
						//$('#' + current_page_id + ' .kalender_container').height(otbHeight + 'px');
						navView.find('#' + current_page_id + ' .kalender_slider').height(otbHeight + 'px');
						navView.find('#' + current_page_id + ' #kalender_slider_content_box').height(otbHeight + 'px');

						otbHeight = undefined;
					}, 400);

				} else {
					//noinspection JSUnresolvedVariable
					kalender_day_column_height = '300';
				}
			}

			// set dates
			var curDate = new Date(),
				curWeekInfo = JamHelperFactory.getWeekNumber(curDate.getTime()),
				curWeekStart = JamHelperFactory.getMonday(curDate),
				counterServices = 0,
				calParams = {
					cur_datum_obj: {
						tag: curDate.getDate(),
						monat: (curDate.getMonth() + 1),
						jahr: curDate.getFullYear()
					},
					cur_week: curWeekInfo[1],
					cur_startDay: Math.round((curWeekStart.getTime() / 1000)),
					cur_startDay_visible: Math.round((curWeekStart.getTime() / 1000)),
					fullRefId: fullRefId,
					ref_id: vm.data.ref_id
				};

			//noinspection JSUnresolvedVariable
			jamOTVKalProfil = new JamAppointmentCalendar(calParams);

			// add calendar
			var addCalParams = {
				name_kurz: current_profil.name_kurz,
				tel: current_profil.tel,
				ref_id: current_profil.ref_id,
				otv_link: current_profil.url + 'termin/' + current_profil.url_hinten
			};
			jamOTVKalProfil.addKalender(addCalParams);


			// set insurance type
			vm.otbInsuranceType = jamOTVKalProfil.getOtbInsuranceType();
			vm.insuranceType = vm.otbInsuranceType;

			var saveParams = {
				fullRefId: fullRefId,
				kasse_privat: vm.otbInsuranceType,
				insuranceType: vm.otbInsuranceType,
				serviceId: (vm.serviceType == 'select') ? 0 : vm.serviceType
			};

			// Deaktiviere Behandlungsgründe initial, wenn keine Vorhanden sind
			Object.keys(vm.data.otb.services).forEach(function(key) {
				// Counter hochzählen
				if (CONFIG.insuranceTypeIds[vm.otbInsuranceType].indexOf(vm.data.otb.services[key].insurance_type) > -1) {
					counterServices++;
				}
			});

			// Behandlungsgründe deaktivieren
			if (counterServices == 0) {
				vm.disableServiceType = true;
			} else {
				vm.disableServiceType = false;
			}

			JamHelperFactory.addOtbDataToCache(saveParams);

			// init calendar
			jamOTVKalProfil.initKalender({
				serviceId: (vm.serviceType == 'select') ? 0 : vm.serviceType,
				kasse_privat: vm.otbInsuranceType,
				insuranceType: vm.otbInsuranceType,
				fullRefId: fullRefId,
				ref_id: vm.data.ref_id,
				noService: (counterServices == 0) ? true : false,
				useApi: vm.data.otb.useApi || false
			});

			calParams = addCalParams = saveParams = undefined;
		}


		function trustAsHtml(string) {
			return $sce.trustAsHtml(string);
		}
		vm.trustAsHtml = trustAsHtml;


		function trustAsResourceUrl(string) {
			return $sce.trustAsResourceUrl(string);
		}
		vm.trustAsResourceUrl = trustAsResourceUrl;


		function gotoProfile(profileDetails, event, source) {

			var url = '',
				fullRefId = profileDetails.fullRefId;

			event.stopPropagation();

			if (typeof profileDetails.profileLink != 'undefined' && profileDetails.profileLink) {
				url = profileDetails.profileLink;
			}

			// GATRACKING
			switch (source) {
				case 'kiu':

					AnalyticsHelper.trackEvent('Profil - Klicks', 'Kunden-in-Umgebung - Profil geklickt');
					break;
				case 'kiu-tpf':
					if (typeof profileDetails[0] != 'undefined' && profileDetails[0]) {
						url = profileDetails[0];
						fullRefId = profileDetails[0].ref_id + '_' + profileDetails[0].art;
					}

					AnalyticsHelper.trackEvent('Profil - Klicks', 'Kunden-in-Umgebung - TPF geklickt');
					break;
				case 'institution':

					AnalyticsHelper.trackEvent('Profil - Klicks', 'Subs der Institution - Institution geklickt');
					break;
				case 'kollegen':

					AnalyticsHelper.trackEvent('Profil - Klicks', 'Profile der Institution - Profil geklickt');
					break;
			}

			$ionicViewSwitcher.nextDirection('forward');
			var params = {
				state: 'profile',
				stateGoParams: {
					path: 'profil',
					fullRefId: fullRefId,
					backToPrevPage: true,
					backToRefId: vm.data.fullRefId,
					isSearch: false
				},
				data: url
			};
			JamHelperFactory.goToProfileUrl(params);

			return false;
		}
		vm.gotoProfile = gotoProfile;


		function gotoArticle(url, categoryId) {
			$ionicViewSwitcher.nextDirection('forward');
			$state.go('expertArticle', {
				categoryId: categoryId,
				articleId: url
			});
		}
		vm.gotoArticle = gotoArticle;


		vm.goTo = goTo;
		function goTo(state, params) {
			$ionicViewSwitcher.nextDirection('forward');
			$state.go(state, params);
		}

		vm.goToURL = goToURL;
		function goToURL(url) {
			if (CONFIG.environment == 'web') {
				$location.url(url);
			} else {
				window.location.href = url;
			}
		}

		function gotoArticleOverview(fullRefId) {
			$ionicViewSwitcher.nextDirection('forward');
			$state.go('profilearticles', {
				path: 'profil',
				fullRefId: fullRefId
			});
		}
		vm.gotoArticleOverview = gotoArticleOverview;


		function gotoLocationsPage(profileDetails, event) {

			event.stopPropagation();

			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Standorte & Kollegen - Standorte anzeigen geklickt');

			$ionicViewSwitcher.nextDirection('forward');
			$state.go('searchResultListSub', {
				refId: profileDetails.acxid_p
			});

			return false;
		}
		vm.gotoLocationsPage = gotoLocationsPage;


		/**
		 * Zeige ein Popup-Fenster mit den Badge - Infos an
		 *
		 * @param data
		 * @returns {boolean}
		 */
		function showBadge(data) {
			data = data || false;
			if (!data) return false;

			data.title = data.title || vm.data.name_kurz + ' ist unter den Top 10:';
			data.template = data.template || 'Die Bewertungen von ' + vm.data.name_kurz + ' zeigen nach den jameda Qualitätsindizes keine Auffälligkeiten.';
			data.type = data.type || 0;

			if (data.type == 1 || data.type == 2) {

				if (data.type == 1) {
					data.title = data.title.replace('Top 10', 'Top 5');
				}

				var badgeText = (data.type == 1) ? vm.data.hat_top5_siegel : vm.data.hat_top10_siegel,
					value = '',
					tmpTemplate = '<ul class="top10badge-list">';

				for (var i = 0; i < badgeText.length; i++) {
					value = badgeText[i];
					tmpTemplate += '<li>';
					tmpTemplate += value.text2 + ' in ' + value.text3 + '<br />';
					tmpTemplate += '<span class="light-font">(Stand ' + value.text1 + ')</span>';
					tmpTemplate += '</li>';
				}

				tmpTemplate += '</ul>';
				data.template = tmpTemplate;
				value = badgeText = tmpTemplate = undefined;
			}

			vm.popup = $ionicPopup.alert({
				title: data.title,
				template: data.template
			});
			return true;
		}


		function showAeaInfo() {
			// Tracking
            AnalyticsHelper.trackEvent('Profil - Klicks', 'Kollegen Empfehlungen ansehen geklickt');

            $scope.data = vm.data.aeaParams;
            vm.popup = $ionicPopup.alert({
				title: vm.data.name_kurz + " hat Empfehlungen von Kollegen folgender Fachrichtungen erhalten:",
				templateUrl: 'app/directives/aeaPopup.html',
				buttons: [{
					text: 'schließen',
					type: 'button-default'
				}],
				cssClass: 'aeaPopup',
				scope: $scope
            });

            return true;
        }


		// recommend
		function doRecommend(profileDetails) {

			var popupOpt = {}, params = {
				id: profileDetails.ref_id + '_' + profileDetails.art,
				aktion: 'empfehlung'
			};

			// undo recommendation?
			if (vm.data.isRecommended) params.undo = '1';

			popupOpt = {
				template: '',
				cssClass: 'hint-popup',
				title: '',
				scope: $scope,
				buttons: []
			};

			JamHelperFactory.doRecommend(profileDetails, params).success(function(data) {

				popupOpt.template = '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>Vielen Dank, Ihre Empfehlung wurde wieder entfernt!</span>';
				vm.data.isRecommended = false;

				if (!data.undo_empfehlung) {

					// GATRACKING
					AnalyticsHelper.trackEvent('Profil - Klicks', 'Arzt Empfehlung', 'Empfehlung abgegeben');

					vm.data.isRecommended = true;
					vm.data.numRecommendations++;
					popupOpt.template = '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>Vielen Dank für Ihre Empfehlung!</span>';

					$('#profile-' + profileDetails.ref_id + ' .jam-action-recommend span').html((parseInt(profileDetails.numRecommendations)));
					var tmpElement = $('#profile-' + profileDetails.ref_id + ' .jam-action-recommend');
					tmpElement.addClass('jam-action-active');

				} else {

					// GATRACKING
					AnalyticsHelper.trackEvent('Profil - Klicks', 'Arzt Empfehlung', 'Empfehlung zurückgenommen');

					vm.data.numRecommendations--;

					$('#profile-' + profileDetails.ref_id + ' .jam-action-recommend span').html((parseInt(profileDetails.numRecommendations)));

					var tmpElement = $('#profile-' + profileDetails.ref_id + ' .jam-action-recommend');
					tmpElement.removeClass('jam-action-active');
				}

				vm.popup = $ionicPopup.alert(popupOpt);

				$timeout(function() {
					vm.popup.close();
				},3000);

			}).error(function(errorResponse) {

				if (typeof errorResponse.alreadyVoted != 'undefined') {
					vm.data.isRecommended = true;
					vm.data.numRecommendations++;
				}

				popupOpt.title = 'Info';
				popupOpt.cssClass = '';
				popupOpt.buttons = [{text: 'OK'}];
				popupOpt.template = errorResponse.message;
				vm.popup = $ionicPopup.alert(popupOpt);
			});

			params = undefined;
		}
		vm.doRecommend = doRecommend;


		// actions
		function showActions(profileDetails) {

			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Action-Menu geklickt');

			var actionButtons = [],
				favText = 'zur Merkliste hinzufügen',
				obsText = 'Eintrag beobachten',
				isObserver = false,
				canonical;

			if (JamHelperFactory.isFavourite(profileDetails.fullRefId)) {
				favText = 'aus Merkliste entfernen';
			}


			if (JamHelperFactory.userObserve(profileDetails.fullRefId)) {
				obsText = 'Eintrag nicht mehr beobachten';
				isObserver = true;
			}

			actionButtons = [
				{ text: 'Kontakt herunterladen (vCard)', tracking: 'Kontakt speichern geklickt' },
				{ text: favText, tracking: 'Merkliste geklickt' },
				{ text: obsText, tracking: 'Beobachtung geklickt'},
				{ text: 'auf Facebook teilen', tracking: 'Facebook geklickt' },
				{ text: 'über Twitter empfehlen', tracking: 'Twitter geklickt' },
				{ text: 'Feedback an das jameda-Team', tracking: 'Feedback an das jameda-Team geklickt' },
				{ text: 'Link per E-Mail versenden', tracking: 'Link per E-mail versenden geklickt' }
			];

			// actionsheet
			$ionicActionSheet.show({

				buttons: actionButtons,
				cancelText: 'Abbrechen',
				androidEnableCancelButton : true,

				cancel: function() {

					// GATRACKING
					AnalyticsHelper.trackEvent('Profil - Klicks', 'Action-Menu - Abbrechen geklickt');
				},

				buttonClicked: function(index) {

					$timeout( function() {

						// Define Canonical
						canonical = JamHelperFactory.getCanonical('#profile-' + profileDetails.ref_id + '_' + profileDetails.art).replace('?show_desktop=yes', '');

						// Change Canonical for App
						if (CONFIG.environment == 'app') {
							canonical = CONFIG.apiUrl + '/profil/' + profileDetails.ref_id + '_' + profileDetails.art + '/';
						}

						// GATRACKING
						if (typeof actionButtons[index] != 'undefined' && typeof actionButtons[index].tracking != 'undefined') {
							//AnalyticsHelper.trackEvent('Profil - Klicks', 'Action-Menu - ' + actionButtons[index].tracking);
						}


						switch (index) {

							case 0: // Save vCard

								// Save contact on Device
								JamVCardHelper.loadvcard(vm.data);

								break;

							case 1: // Toggle Favourite

								// Toggle Favourite
								vm.toggleFavourite(profileDetails.fullRefId);

								break;

							case 2:	// Toggle Observation

								if (!isObserver) {

									if (typeof CONFIG.userProfile.user == 'undefined') {

										$ionicViewSwitcher.nextDirection('forward');
										$state.go('userLogin', {
											msg: 'Um diesen <strong>Eintrag beobachten</strong> zu können, müssen Sie sich einloggen. Bitte loggen Sie sich ein, oder registrieren Sie sich neu, vielen Dank.',
											returnToState: 'profile',
											returnToStateParams: {
												path: $stateParams.path,
												fullRefId: profileDetails.fullRefId,
												doAction: 'addBeos',
												isSearch: true
											}
										});

									} else {

										JamHelperFactory.addObservation(profileDetails.fullRefId).success(function(result) {

											var template = '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>Sie beobachten nun diesen Eintrag und werden bei neuen Bewertungen automatisch per E-Mail informiert.</span>';

											vm.popup = $ionicPopup.show({
												template: template,
												cssClass: 'hint-popup hint-popup-big',
												title: '',
												scope: $scope,
												buttons: []
											});

											$timeout(function() {
												vm.popup.close();
											},4000);

										}).error(function() {

											var template = '<div><i class="icons ion-ios-close"></i></div><span>Dieser Eintrag konnte leider nicht gespeichert werden.</span>';

											vm.popup = $ionicPopup.show({
												template: template,
												cssClass: 'hint-popup',
												title: '',
												scope: $scope,
												buttons: []
											});

											$timeout(function() {
												vm.popup.close();
											},1800);
										});
									}

								} else {

									JamHelperFactory.removeObservation(profileDetails.fullRefId).success(function() {

										var template = '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>Sie beobachten diesen Eintrag jetzt nicht mehr.</span>';

										vm.popup = $ionicPopup.show({
											template: template,
											cssClass: 'hint-popup',
											title: '',
											scope: $scope,
											buttons: []
										});

										$timeout(function() {
											vm.popup.close();
										},1800);

									}).error(function() {

										var template = '<div><i class="icons ion-ios-close"></i></div><span>Dieser Eintrag konnte leider nicht entfernt werden.</span>';

										vm.popup = $ionicPopup.show({
											template: template,
											cssClass: 'hint-popup',
											title: '',
											scope: $scope,
											buttons: []
										});

										$timeout(function() {
											vm.popup.close();
										},1800);
									});
								}

								break;

							case 3: // Facebook

								canonical = 'https://www.facebook.com/sharer/sharer.php?u=' + canonical;
								window.open(canonical, CONFIG.urlPopupTarget, 'location=yes');

								break;

							case 4: // Twitter

								// prepare twitter link
								canonical = 'https://twitter.com/share?text=Meine Empfehlung auf jameda.de&hashtags=arztsuche,jameda&url='+canonical;
								window.open(canonical, CONFIG.urlPopupTarget);

								break;

							case 5: // Feedback

								var mailTo  = 'app@jameda.de?subject=Feedback%20an%20das%20jameda-Team&body=%0A%0A%0AFeedback%20' + CONFIG.appVersionDetail + '%20-%20ID%20'+profileDetails.fullRefId;
								window.open('mailto:' + mailTo, CONFIG.urlPopupTarget);

								break;

							case 6: // send Link

								// prepare name
								if (profileDetails.art == 1) {
									var fullName = (profileDetails.anrede == 1) ? 'Herr ' : 'Frau ';
									fullName += profileDetails.name_nice;
								} else {
									var fullName = profileDetails.name_nice;
								}

								// prepare email
								var mailTo  = '?subject=Arztempfehlung%20über%20jameda';
								mailTo += '&body=Arztempfehlung über jameda%0A%0A';
								mailTo += 'Ihnen wird ' + fullName + ' über jameda.de empfohlen:%0A';
								mailTo += canonical + '%0A%0A';
								mailTo += 'Finden Sie mehr von Patienten empfohlene Ärzte auf https://www.jameda.de';
								window.open('mailto:' + mailTo, CONFIG.urlPopupTarget);

								break;
						}

						return true;
					}, 10);

					return true;
				}
			});
		}
		vm.showActions = showActions;


		function showEditProfile(url) {

			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Profil bearbeiten geklickt');

			if (CONFIG.environment == 'app') {
				window.open(url, '_system', 'location=1,toolbar=yes,status=yes,fullscreen=no');
				//window.open(url, '_blank', 'location=1,toolbar=yes,status=yes,fullscreen=no');
			} else {
				window.open(url, '_blank');
			}

		}
		vm.showEditProfile = showEditProfile;


		function showDesktopVersion(profileDetails) {
			window.open(profileDetails.canonical, '_self');
		}
		vm.showDesktopVersion = showDesktopVersion;


		function openGoogleMaps() {

			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'In Kartenapp anzeigen geklickt');


			var url2Map = vm.data.mapsLink;

			// track map click
			JamHelperFactory.trackMapKlick(vm.data);

			// show map
			window.open(url2Map, '_system');
			url2Map = undefined;
		}
		vm.openGoogleMaps = openGoogleMaps;


		/**
		 * Erstelle die URL für Google Maps
		 */
		function setGoogleMaps() {

			var url = '',
				tmpElement;

			if (vm.googleMapsStatic.url != '') return false;

			vm.fullRefId = vm.data.ref_id+'_'+vm.data.art;

			$timeout(function() {

				url = 'https://maps.google.com/maps/api/staticmap?key=' + CONFIG.googleMapsApiKey.current;
				url += '&format=jpg&zoom=15&scale=2&maptype=roadmap&markers=&sensor=true&center=' + vm.data.lat + ',' + vm.data.lng;

				if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') {
					var tmpHeight = $('#profile-kbz-map-' + vm.data.ref_id).height();
					tmpHeight = Math.round((tmpHeight / 2) - 21);

					angular.element('#profile-kbz-map-' + vm.data.ref_id + ' .profile-toggle-kbz-map').css('margin-top', tmpHeight + 'px');
					angular.element('#profile-kbz-map-' + vm.data.ref_id + ' .jam-loader').css('margin-top', tmpHeight + 'px');

					tmpHeight = undefined;
				}

				// Wenn OTB Aktiviert ist, dann gehe hier rein!
				if (vm.data.showOtb == 1) {

					tmpElement = angular.element('#profile-'+vm.fullRefId+' .jam-map');

					if (tmpElement.length > 0) {
						vm.googleMapsStatic.width = tmpElement[tmpElement.length-1].clientWidth-2;
						vm.googleMapsStatic.height = tmpElement[tmpElement.length-1].clientHeight-89;
					}

					if (vm.data.premium_paket <= 3) {
						vm.googleMapsStatic.height = 150;
					}

				} else {

					// Kein OTB aktiv
					tmpElement = angular.element('#profile-'+vm.fullRefId+' .jam-map-google');

					if (tmpElement.length > 0) {
						vm.googleMapsStatic.width = tmpElement[tmpElement.length-1].clientWidth;
					}

					if (CONFIG.deviceType == 'tablet') {

						var elementHeights = [];

						elementHeights[0] = angular.element('#profile-' + vm.fullRefId).height() || 0;
						elementHeights[1] = angular.element('#profile-' + vm.fullRefId + ' .profile-left-top').height() || 0;
						elementHeights[2] = angular.element('#profile-' + vm.fullRefId + ' .jam-tablet-non-otb-info').height() || 85;
						elementHeights[3] = 117;

						vm.googleMapsStatic.height = elementHeights[0];

						// Erstes Element nicht beachten, da oben als gesamthöhe definiert
						for (var i=1; i < elementHeights.length; i++) {
							vm.googleMapsStatic.height = vm.googleMapsStatic.height - elementHeights[i];
						}
					}
				}

				// Wenn das Gerät ein Tablet ist, und die Höhe der Karte unter 250px sein sollte,
				// setze den Wert auf 250 (entspricht 250px)
				if (CONFIG.deviceType == 'tablet' && vm.googleMapsStatic.height < 250) {
					elementHeights[0] = angular.element('[nav-view="active"] #profile-' + vm.fullRefId).height() || 550;
					elementHeights[1] = angular.element('[nav-view="active"] #profile-' + vm.fullRefId + ' .profile-left-top').height() || 0;
					elementHeights[2] = angular.element('[nav-view="active"] #profile-' + vm.fullRefId + ' .jam-tablet-non-otb-info').height() || 85;
					elementHeights[3] = 117;

					vm.googleMapsStatic.height = elementHeights[0];

					// Erstes Element nicht beachten, da oben als gesamthöhe definiert
					for (var i=1; i < elementHeights.length; i++) {
						vm.googleMapsStatic.height = vm.googleMapsStatic.height - elementHeights[i];
					}
				}

				url += '&size=' + vm.googleMapsStatic.width + 'x' + vm.googleMapsStatic.height;

				vm.googleMapsStatic.url = url;
				url = tmpElement = undefined;
			}, 1500);

			return true;
		}


		function getGoogleMapsUrl(profileDetails, isKbzInitial) {

			var boxWidth = CONFIG.windowWidth - 19,
				boxHeight = 150,
				isKbzInitial = (typeof isKbzInitial != 'undefined' && isKbzInitial) ? isKbzInitial : false;

			if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape' && profileDetails.data.showOtb != 1) {

				boxWidth = angular.element('.jam-otb').width()-19;
				if (boxWidth <= 0) {
					boxWidth = 441;
				}
				// get elements
				var navView = $('[nav-view="active"]');
				if (navView.length == 0) {
					navView = $('[nav-view="staged"]');
					if (navView.length == 0) {
						navView = $('[nav-view="entering"]');
					}
				}

				// calculate maps width
				var mapContainer = navView.find('#profile-' + profileDetails.data.ref_id + ' .jam-map');
				boxWidth = mapContainer.width();


				// calculate the maps height
				var fullHeight = navView.find('#profile-' + profileDetails.data.ref_id).height();
				var contentTopHeight = navView.find('#profile-' + profileDetails.data.ref_id + ' .profile-left-top').height();
				var contentMiddleHeight = navView.find('#profile-' + profileDetails.data.ref_id + ' .jam-tablet-non-otb-info').height();
				var mapButtonHeight = 47;
				boxHeight = fullHeight - contentTopHeight - contentMiddleHeight - mapButtonHeight - 41;

				// update jam-map-google height
				if (!isKbzInitial) {
					navView.find('#profile-' + profileDetails.data.ref_id + ' .jam-map-google').height(boxHeight);
				}

				if (navView.find('#profile-' + profileDetails.data.ref_id + ' .ga-tablet-profile-01').length > 0 || isKbzInitial) {

					// if analytics included set width
					boxWidth = boxWidth - 310;

					if (isKbzInitial) {
						navView.find('#profile-' + profileDetails.data.ref_id + ' .jam-map-google').height(boxHeight + 47);
						navView.find('#profile-' + profileDetails.data.ref_id + ' .jam-next-page').width(boxWidth - 17);
						navView.find('#profile-' + profileDetails.data.ref_id + ' .jam-next-page').css('position', 'absolute');
					}
				}


				// set pointer
				navView.find('#profile-' + profileDetails.data.ref_id + ' .ion-location').css('margin-top', '-' + Math.round((boxHeight / 2) + 60) + 'px');
			}


			// check width
			var mapWidth = boxWidth;
			var mapHeight = boxHeight;
			if (boxWidth > 640) {
				mapWidth = 640;
				mapHeight = Math.round((mapWidth / boxWidth) * boxHeight);
			}

			if (CONFIG.deviceType == 'tablet' && vm.data.showOtb) {
				mapWidth = angular.element('.content-box-01').width()-2;
				mapHeight = 150;
				boxHeight = 150;
			}

			if (mapWidth < 0) mapWidth = 300;
			if (mapHeight < 0) mapHeight = 100;

			// set url
			var mapsUrl = '';
			mapsUrl += 'https://maps.google.com/maps/api/staticmap?key=' + CONFIG.googleMapsApiKey.current;
			mapsUrl += '&format=jpg&zoom=15&scale=2&maptype=roadmap&markers=&sensor=true&amp;center=' + profileDetails.data.lat + ',' + profileDetails.data.lng;
			mapsUrl += '&size=' + mapWidth + 'x' + mapHeight;

			mapContainer = fullHeight = contentTopHeight = contentTopHeight = contentTopHeight = mapWidth = mapHeight = undefined;
			// return url
			return '<img src="' + mapsUrl + '" height="' + boxHeight + '" width="100%">';

		}
		vm.getGoogleMapsUrl = getGoogleMapsUrl;


		function toggleKbzMap(profileDetails) {

			var vm = this;

			// show loading
			vm.data.showKbzMapLoading = true;

			// remove background image
			$('#profile-kbz-map-' + profileDetails.ref_id).css('background-image', 'none');


			// show kbz map
			$timeout(function() {
				vm.data.showKbzMapLoading = false;
				vm.data.showKbzMap = true;

				$('#profile-kbz-map-' + profileDetails.ref_id + ' .kbz-map').html(vm.getGoogleMapsUrl({ data: profileDetails }));
			}, 800);
		}
		vm.toggleKbzMap = toggleKbzMap;


		function showGoogleHeader() {

			var showGoogleHeader = false,
				currentView = $ionicHistory.currentView();

			if (typeof currentView != 'undefined' && currentView.backViewId == null) {
				showGoogleHeader = true;
			}
			currentView = undefined;
			return showGoogleHeader;
		}
		vm.showGoogleHeader = showGoogleHeader;


		function toggleOtbInsuranceType(type) {

			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}

			// get elements
			var fullRefId = vm.data.ref_id + '_' + vm.data.art,
				counterServices = 0,
				dataFromCache = {},
				isAvailable = false,
				selectedValue = vm.insuranceType,
				calParams = {
					kasse_privat: vm.insuranceType,
					insuranceType: vm.insuranceType,
					ref_id: vm.data.ref_id,
					useApi: vm.data.otb.useApi || false
				},
				otbData = JamHelperFactory.getOtbDataFromCache(fullRefId);

			// Prüft aktuelle Werte, ob die sich geändert haben, oder ob der Kalender gerade noch lädt => breche ab
			if (typeof jamOTVKalProfil != 'undefined' && typeof jamOTVKalProfil.ajax_is_loading != 'undefined' && jamOTVKalProfil.ajax_is_loading) {
				return false;
			}

			// Keine Behandlungsgründe für die Kassenart verfügbar?
			Object.keys(vm.data.otb.services).forEach(function(key) {

				// Counter hochzählen
				if (CONFIG.insuranceTypeIds[selectedValue].indexOf(vm.data.otb.services[key].insurance_type) > -1) {
					counterServices++;
				}

				// Prüfe, ob der Behandlungsgrund (Titel) auch in anderen Kassenart verfügbar ist
				if (vm.serviceType != 'select' &&
					CONFIG.insuranceTypeIds[selectedValue].indexOf(vm.data.otb.services[vm.serviceType].insurance_type) == -1 &&
					(key == vm.serviceType || (key != vm.serviceType && vm.data.otb.services[key].title == vm.data.otb.services[vm.serviceType].title)) &&
					CONFIG.insuranceTypeIds[selectedValue].indexOf(vm.data.otb.services[key].insurance_type) > -1) {
					isAvailable = key;
				}
			});

			// Behandlungsgründe deaktivieren
			if (counterServices == 0) {
				vm.disableServiceType = true;
			} else {
				vm.disableServiceType = false;
			}

			// Gibt es für den Kassen-Typ die Behandlung? Wenn nicht, Auswahl-Meldung anzeigen
			if (vm.serviceType != 'select' && CONFIG.insuranceTypeIds[selectedValue].indexOf(vm.data.otb.services[vm.serviceType].insurance_type) == -1) {

				// Gibt es den gleichen Behhandlungsgrund mit einer anderen Kassenart?
				vm.serviceType = 'select';
				if (isAvailable !== false) {
					vm.serviceType = isAvailable;
					$timeout(function(){
						vm.serviceType = 'select';

						$timeout(function() {
							vm.serviceType = isAvailable;
						}, 100)
					}, 10);
				}
			}

			// overwrite complete otb data with current insurance type because on profile pages no other information is saved in local storage yet
			if (vm.serviceType != 'select' && typeof current_profil.otb.services[vm.serviceType] != 'undefined' && otbData.serviceType != vm.serviceType) {

				calParams.dauer = current_profil.otb.services[vm.serviceType].duration;
				calParams.serviceId = parseInt(vm.serviceType);
				calParams.grund = current_profil.otb.services[vm.serviceType].title;

				// Ga-Tracking
				if (vm.insuranceType == 'kasse') {
					AnalyticsHelper.trackEvent('Profil - Klicks', 'OTB - Kassenpatient gewählt');
				} else {
					AnalyticsHelper.trackEvent('Profil - Klicks', 'OTB - Privatpatient gewählt');
				}

				dataFromCache = JamHelperFactory.getOtbDataFromCache(fullRefId);
				dataFromCache.fullRefId = fullRefId;
				dataFromCache.insuranceType = selectedValue;
				dataFromCache.kasse_privat = selectedValue;
				dataFromCache.serviceId = calParams.serviceId;
				dataFromCache.grund = calParams.grund;
				dataFromCache.dauer = calParams.dauer;
				dataFromCache.ref_id = vm.data.ref_id;
			} else {

				dataFromCache = {
					fullRefId: fullRefId,
					kasse_privat: selectedValue,
					insuranceType: selectedValue,
					ref_id: vm.data.ref_id
				};
			}
			JamHelperFactory.addOtbDataToCache(dataFromCache);

			// init Kalender nur, wenn der Parameter auf false gesetzt ist
			// (damit der Kalender nicht immer neu initialisiert wird)
			if (!type) {
				jamOTVKalProfil.initKalender(calParams);
			}

			// Variablen löschen (Speicheroptimierung)
			selectedValue = counterServices = dataFromCache = calParams = otbData = undefined;
		}
		vm.toggleOtbInsuranceType = toggleOtbInsuranceType;


		function setProfileBackButton() {

			// check data
			if (typeof vm.data == 'undefined' || vm.data == null) {
				return false;
			}

			// get optional parameter "backToPrevPage"
			var backToPrevPage = $stateParams.backToPrevPage,
				buttonType = 'back',
				buttonParams = {
					title: 'zurück'
				};


			if (backToPrevPage) {
				// go to previous page
				var backToRefId = $stateParams.backToRefId;
				if (backToRefId !== false) {
					buttonParams.url = '/profil/uebersicht/' + backToRefId + '/';
				}

			} else {
				// check backlink type

				// Einstieg über:
				// gemerkte ärzte					backLinkType = 'favourites'
				// namenssuche						backLinkType = 'deeplink'
				// deeplink							backLinkType = 'deeplink'
				// direkt einstieg					backLinkType = 'deeplink'
				// standort auswahl					backLinkType = 'deeplink'
				// alle ärzte d. inst.				backLinkType = 'subs'
				// liste							backLinkType = 'resultlist'
				// kartenansicht					backLinkType = 'resultlist-map'
				// standortauswahl					backLinkType = 'select-position'
				// letzte Seite Bewertungsabgabe 	backLinkType = 'review-success'

				switch ($stateParams.backLinkType) {
					default:

						// set dummy back button
						// --> set back button when data is loaded


						// set back button type
						buttonType = 'back';
						buttonParams = {};


						// set back button title
						var backView = $ionicHistory.backView();
						if ($stateParams.backLinkType == 'resultlist-map') {
							buttonParams.title = 'Karte';
						} else if ($stateParams.backLinkType == 'resultlist') {
							buttonParams.title = 'Liste';
						} else if (backView == null || $stateParams.backLinkType == 'deeplink') {
							buttonParams.title = 'Weitere';
						} else if ($stateParams.backLinkType == 'subs') {
							buttonParams.title = 'zurück';
						} else if ($stateParams.backLinkType == 'expertArticles') {
							buttonParams.title = 'zurück';
						} else if ($stateParams.backLinkType == 'expertCategories') {
							buttonParams.title = 'zurück';
						} else {
							buttonParams.title = 'Liste';
						}


						// check last review page
						var buildBackButton = false;
						if (backView != null) {
							var backViewUrl = backView.url;

							if (backViewUrl.indexOf("schritt-4a") > -1 || backViewUrl.indexOf("schritt-5") > -1) {
								buildBackButton = true;
							}
						}

						// set back button url
						if (buildBackButton || backView == null || $stateParams.backLinkType == 'deeplink' || backView.stateName == 'profileEvaluate' || backView.stateName == 'review-success') {

							// build back link to search result list...
							// ergebnisliste/?was=Zahnarzt&was_i=zahna&was_sel=0&gruppe=ZA&address=München&address_i=münch&address_sel=0&geoball=11.558007,48.144836,0.5&geo=48.144836_11.558007__0_München_muenchen_Bayern_1

							// url += 'ergebnisliste.html?new_search=1';
							var listUrl = '/ergebnisliste/?';

							// geo
							// stateParams.geo = decodeURIComponent(vm.searchParamsObject.geo); ???
							// url += '&geo='+((current_profil.lat && current_profil.lng)? current_profil.lat+'_'+current_profil.lng+'___'+current_profil.ort+'___' : '' );
							if (vm.data.lat && vm.data.lng) {
								listUrl += 'geo=' + vm.data.lat + '_' + vm.data.lng + '___' + vm.data.ort + '___' + '&';
							}

							// fach
							// url += '&fsid='+((current_profil.fach_struktur && current_profil.fach_struktur.length>0)? current_profil.fach_struktur.join('_') : '' );
							if (vm.data.fach_struktur && vm.data.fach_struktur.length > 0) {
								listUrl += 'fsid=' + vm.data.fach_struktur.join('_') + '&';
							}

							listUrl += 'isSearch=false&';

							// map view?
							if ($stateParams.backLinkType == 'resultlist-map') {
								listUrl += 'showMaps=true';
							}

							// set url
							buttonParams.url = listUrl;

							listUrl = undefined;

						} else if (backView != null) {

							// use last url from history
							buttonParams.url = backView.url;
						}

						break;

					case 'favourites':

						// goto to my favourites page
						var buttonType = 'back',
							buttonParams = {
								title: (CONFIG.deviceType == 'tablet') ? 'Gemerkte Ärzte' : 'zurück',
								url: '/favouriten/'
							};

						break;

					case 'userFavourites':

						// goto to users favourites page
						var buttonType = 'back',
							buttonParams = {
								title: (CONFIG.deviceType == 'tablet') ? 'Gemerkte Ärzte' : 'zurück',
								url: '/mein-jameda/meine-gemerkten-aerzte/'
							};

						break;

					case 'userAppointments':

						// goto to users favourites page
						var buttonType = 'back',
							buttonParams = {
								title: (CONFIG.deviceType == 'tablet') ? 'Meine Termine' : 'zurück',
								url: '/mein-jameda/meine-termine/'
							};
						break;
				}
			}

			LoaderFactory.hideLoader(600);

			// set Back Button
			$timeout(function() {
				JamHelperFactory.setBackButton(buttonType, buttonParams, vm.data.ref_id);
			}, CONFIG.backButtonDelay);
		}


		vm.trackReviewClick = trackReviewClick;
		function trackReviewClick() {

			// GATRACKING
			AnalyticsHelper.trackEvent('Bewerten geklickt', 'Profil');
			return true;
		}


		/**
		 * Add Class
		 * @type {addClass}
		 */
		vm.addClass = addClass;
		function addClass(ev) {

			ev = ev || null;

			if (ev != null) {
				var elem = $(ev.currentTarget)
				elem.addClass('addLoader');
			}

			elem = undefined;
		}


		// gallery
		function loadGalleryTemplate() {

			$ionicModal.fromTemplateUrl('app/profile/profile-gallery.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				vm.galleryBigModal = modal;
			});
		}


		function openModal() {

			// do not open on android and internet
			if (!vm.showBigGallery) return false;

			// show big gallery
			vm.galleryBigModal.show();


			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Praxisbild geklickt');


			// load images
			loadSliderImages(1);

			// slide big gallery to current image
			var tryAgain = false;
			try {
				$ionicSlideBoxDelegate.$getByHandle('profile-gallery-big').slide(vm.galleryIndexBig);
			} catch (e) {
				tryAgain = true;
			}


			// beim ersten klick funktioniert "slide" nicht, da der modal window nicht existiert
			if (tryAgain) {
				$timeout(function() {
					try {
						$ionicSlideBoxDelegate.$getByHandle('profile-gallery-big').slide(vm.galleryIndexBig);
					} catch (e) {}
				}, 300);
			}

			tryAgain = undefined;
		}
		vm.openModal = openModal;

		function openModalPortrait() {

			// do not open on android and internet
			if (!vm.showBigGallery) return false;

			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Profilbild geklickt');

			// load images
			loadSliderImages(1);

			// show big gallery
			vm.galleryBigModal.show();

			// slide big gallery to current image
			vm.galleryIndexBig = 0;


			try {
				$ionicSlideBoxDelegate.$getByHandle('profile-gallery-big').slide(vm.galleryIndexBig);
			} catch (e) {}
		}
		vm.openModalPortrait = openModalPortrait;


		function closeModal() {

			// hide big gallery
			if (vm.galleryBigModal) {
				vm.galleryBigModal.hide();
			}
		}
		vm.closeModal = closeModal;


		function slideChanged(type) {

			// set gallery diff
			vm.bigGalleryDiff = (vm.data.hasProfileImage) ? 1 : 0;

			// set current gallery index
			if (type == 'small') {
				vm.galleryIndexSmall = $ionicSlideBoxDelegate.$getByHandle('profile-gallery-small').currentIndex();
				vm.galleryIndexBig = vm.galleryIndexSmall + vm.bigGalleryDiff;

				// GATRACKING
				AnalyticsHelper.trackEvent('Profil - Klicks', 'Praxisbilder geswiped', vm.slideChangeCounter + 'mal');
				vm.slideChangeCounter++;

			} else {
				vm.galleryIndexBig = $ionicSlideBoxDelegate.$getByHandle('profile-gallery-big').currentIndex();
				vm.galleryIndexSmall = (vm.galleryIndexBig > 0) ? vm.galleryIndexBig - vm.bigGalleryDiff : 0;

				// slide small gallery to current image
				vm.galleryIndexSmall = $ionicSlideBoxDelegate.$getByHandle('profile-gallery-small').slide(vm.galleryIndexSmall);
			}
		}
		vm.slideChanged = slideChanged;


		function trackAreYou() {
			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Sind Sie Dr. X geklickt');
		}
		vm.trackAreYou = trackAreYou;


		function trackShowAllNearbyEntries() {
			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Kunden-in-Umgebung - Alle anzeigen geklickt');
		}
		vm.trackShowAllNearbyEntries = trackShowAllNearbyEntries;

		function trackHomeButton() {
			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Home-Button geklickt');
		}
		vm.trackHomeButton = trackHomeButton;

		function trackShowColleagues() {
			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Standorte & Kollegen - Kollegen anzeigen geklickt');
		}
		vm.trackHomeButton = trackHomeButton;

		function trackInstClick() {
			// GATRACKING
			AnalyticsHelper.trackEvent('Profil - Klicks', 'Zur Institution geklickt');
		}
		vm.trackInstClick = trackInstClick;

		function otbTeaserIsVisible() {

			var otbTeaserIsVisible = false;

			if (typeof vm.data != 'undefined' && typeof vm.data.art != 'undefined' && vm.data.art == 1 && (typeof vm.data.pa_is_otb != 'undefined' && (vm.data.pa_is_otb == null || vm.data.pa_is_otb == 0)) && (vm.data.premium_paket == null || vm.data.premium_paket < 4) &&
				(vm.data.otb_status == null || vm.data.otb_status < 1)) {
				otbTeaserIsVisible = true;
			}

			// Vorläufig entfernt
			return false;
		}
		vm.otbTeaserIsVisible = otbTeaserIsVisible;

		function gotoOtbLanding() {

			// An elaborate, custom popup
			var myPopup = $ionicPopup.show({
				template: 'Informieren Sie sich jetzt, wie Sie Ihren Patienten die kostenlose Online-Terminbuchung anbieten.',
				title: 'Sind Sie ' + vm.data.name_kurz + '?',
				/*subTitle: 'Untertitel gelaber bla laber rabarber',*/
				scope: $scope,
				buttons: [
					{
						text: 'Abbrechen',
						onTap: function(e) {
							return false;
						}
					},
					{
						text: 'Weiter',
						onTap: function(e) {
							return true;
						}
					}
				]
			});

			myPopup.then(function(result) {
				if (result) {
					var teaserUrl = 'https://www.jameda.de/landing/online-terminbuchung/?id=' + vm.data.fullRefId + '&utm_campaign=Onsite-Links&utm_source=OTB-aktivieren&utm_medium=Profil-Mobil';

					if (vm.data.premium_paket == null || vm.data.premium_paket < 3) {
						teaserUrl += '&isNew=1';
					}
					window.open(encodeURI(teaserUrl), '_system', 'location=yes');
				}
			});

			return false;
		}
		vm.gotoOtbLanding = gotoOtbLanding;

		// Cleanup the modal when we're done with it!
		$scope.$parent.$on('$destroy', function() {
			if ($scope.modal) $scope.modal.remove();
		});

		$scope.$on('$destroy', function() {
			if ($scope.modal) $scope.modal.remove();
		});
	}
})();