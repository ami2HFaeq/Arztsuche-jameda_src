(function(){
	'use strict';

	angular
		.module('app.helper',[])
		.factory('JamHelperFactory', JamHelperFactory);

	JamHelperFactory.$inject = ['$q', '$templateCache', '$timeout', 'CONFIG', 'localStorageService', '$filter', '$ionicPopup', 'LoaderFactory', '$ionicHistory','$window', '$state', 'AnalyticsHelper', 'JamSyncService', 'JamUserFavouritesService', 'JamUserObservationService', '$location'];

	function JamHelperFactory($q, $templateCache, $timeout, CONFIG, localStorageService, $filter, $ionicPopup, LoaderFactory, $ionicHistory, $window, $state, AnalyticsHelper, JamSyncService, JamUserFavouritesService, JamUserObservationService, $location) {

		var vm = this;
		vm.popup = null;

		return {

			pageNotFound: pageNotFound,
			timeoutAlertshown: false,
			showHashTimeout: showHashTimeout,

			dateAdd: dateAdd,
			combineDateTime: combineDateTime,
			somethingWentWrong: somethingWentWrong,
			strReplace: strReplace,
			setHeadTitle: setHeadTitle,
			setMetaData: setMetaData,
			setMeta: setMeta,
			setCanonical: setCanonical,
			getCanonical: getCanonical,
			cleanName: cleanName,
			createDatum: createDatum,
			formatDate: formatDate,
			createFloat: createFloat,

			getProfile: getProfile,
			getProfileDetails: getProfileDetails,
			getProfileDataFormatted: getProfileDataFormatted,
			addProfileToCache: addProfileToCache,
			getProfileFromCache: getProfileFromCache,
			addPreloadedProfilesToCache: addPreloadedProfilesToCache,
			getPreloadedProfileFromCache: getPreloadedProfileFromCache,
			getProfileList: getProfileList,

			getProfileEvaluates: getProfileEvaluates,
			replaceHttp: replaceHttp,

			isFavourite: isFavourite,
			getFavourites: getFavourites,
			getSyncedFavourites: getSyncedFavourites,
			setSyncedFavourites: setSyncedFavourites,
			addFavourite: addFavourite,
			removeFavourite: removeFavourite,
			toggleFavourite: toggleFavourite,

			isRecommendedDoctor: isRecommendedDoctor,
			addRecommendedDoctor: addRecommendedDoctor,
			removeRecommendedDoctor: removeRecommendedDoctor,
			toggleRecommendedDoctor: toggleRecommendedDoctor,
			doRecommend: doRecommend,

			addObservation: addObservation,
			removeObservation: removeObservation,
			userObserve: userObserve,
			updateUser: updateUser,

			getBusinessHours: getBusinessHours,
			getBusinessDay: getBusinessDay,
			openDoctorWebsite: openDoctorWebsite,
			roundAndPercent: roundAndPercent,
			decodeString: decodeString,
			setPageTitle: setPageTitle,
			numberWithDot: numberWithDot,
			addReviewDetails: addReviewDetails,
			resetReviewDetails: resetReviewDetails,
			getReviewDetails: getReviewDetails,
			loadOptionalRatingDetails: loadOptionalRatingDetails,
			isValidEmail: isValidEmail,
			isValidMobileNumber: isValidMobileNumber,
			getWeekNumber: getWeekNumber,
			getMonday: getMonday,
			isScrolledIntoView: isScrolledIntoView,
			addOtbDataToCache: addOtbDataToCache,
			getOtbDataFromCache: getOtbDataFromCache,

			getFromCache: getFromCache,
			localStorageSupport: localStorageSupport,
			setIntoCache: setIntoCache,
			clearLocalStorage: clearLocalStorage,
			clearLocalStorageKey: clearLocalStorageKey,
			localStorageMax: localStorageMax,

			getCanvasIcon: getCanvasIcon,
			setCityImage: setCityImage,
			pageLoaded: false,
			setBackButton: setBackButton,
			resetBackButton: resetBackButton,
			doAnrufen: doAnrufen,
			goToReview: goToReview,
			goToExternal: goToExternal,
			trackUrlKlick: trackUrlKlick,
			trackMapKlick: trackMapKlick,

			addContentToCache: addContentToCache,
			removeContentFromCache: removeContentFromCache,
			getContentFromCache: getContentFromCache,

			goToProfileUrl: goToProfileUrl
		};


		////////////////////////////////////////////////////////

		function pageNotFound(msg, stateTo) {

			msg = msg || '<strong>Wir bitten um Entschuldigung</strong><br>Leider können wir Sie auf dieser Seite nicht verarzten, da es die Seite bei uns leider nicht (mehr) gibt.';
			stateTo = stateTo || 'home';


			// SEO Handling (robots => nofollow, noindex)
			var elem = angular.element('[name="robots"]');

			if (elem.length == 0) {
				var meta = '<meta name="robots" content="noindex, nofollow">';
				angular.element('head').append(meta);
			} else {
				elem.attr('content','noindex, nofollow');
			}

			$state.go('pageNotFound',{});
		}


		/**
		 * Show Hash Timeout
		 * To get new hash, reload page
		 *
		 * @param msg
		 * @param reload
		 */
		function showHashTimeout(msg, reload, justReload, status) {

			if (JamHelperFactory.timeoutAlertshown) {
				return true;
			}

			if (typeof reload == 'undefined') reload = true;

			justReload = justReload || false;

			// check if msg is set
			if (msg == '' || !msg) {
				msg = 'Leider ist ein Fehler aufgetreten und wir müssen die Seite aktualisieren.';
			}

			// check status (http code)
			if (typeof status == 'undefined' || status == '') {
				status = 'unknown';
			}

			JamHelperFactory.timeoutAlertshown = true;

			if (!somethingWentWrong()) {
				return false;
			}

			// Delete loading bars
			LoaderFactory.hideLoader(0, true);
			
			// show popup - alert
			var alertPopup = $ionicPopup.alert({
				title: 'Wir bitten um Entschuldigung',
				template: msg,
				okText: 'Ok'
			});


			// if user confirm, reload page
			alertPopup.then(function(res) {

				if (reload) {

					LoaderFactory.showLoader(2);

					$ionicHistory.nextViewOptions({
						historyRoot: true,
						disableBack: true
					});

					$ionicHistory.clearCache();
					$ionicHistory.clearHistory();
					$templateCache.removeAll();

					// reload delay 1 sec
					$timeout(function() {

						LoaderFactory.showLoader(2);
						JamHelperFactory.timeoutAlertshown = false;
						window.location.reload();
					},1000)
				}
			});
		}

		function somethingWentWrong() {

			// Get timeouts only from the last 3min
			var calledTimeouts = getFromCache('calledTimeouts',180) || [],
				msg = 'Leider ist ein Fehler aufgetreten und wir müssen die Seite aktualisieren.';

			if (calledTimeouts.length > 2) {

				clearLocalStorageKey('calledTimeouts');

				// GATRACKING
				//AnalyticsHelper.trackEvent('Server Error - Counter reached', window.location.href, CONFIG.environment + ' - Timeout-Counter: '+calledTimeouts.length);

				var alertPopup = $ionicPopup.alert({
					title: 'Wir bitten um Entschuldigung',
					template: msg,
					okText: 'Ok'
				});

				alertPopup.then(function(res) {

					LoaderFactory.showLoader(2);

					$ionicHistory.nextViewOptions({
						historyRoot: true,
						disableBack: true
					});

					$ionicHistory.clearCache();
					$ionicHistory.clearHistory();
					$templateCache.removeAll();

					// reload delay 1 sec
					$timeout(function() {

						$state.go('home',{reload: true});
						LoaderFactory.hideLoader(400);
					},1000)
				});

			} else {

				calledTimeouts.push(new Date().getTime());
				setIntoCache('calledTimeouts', calledTimeouts);

				return true;
			}

			return false;
		}

		function strReplace(search, replace, subject) {
			return subject.split(search).join(replace);
		}


		function setHeadTitle(titleText) {

			angular.element('title')[0].innerHTML = titleText;
			return true;
		}

		function setMetaData(metaData) {
			if (typeof metaData != 'undefined') {

				// Setze den PageTitle
				if (typeof metaData.title != 'undefined') {
					$window.document.title = metaData.title;
				} else if (typeof metaData.ptitle != 'undefined') {
					$window.document.title = metaData.ptitle;
				}

				// Setze die Meta-Description
				if (typeof metaData.description != 'undefined') {
					setMeta('description', metaData.description);
				} else if (typeof metaData.desc != 'undefined') {
					setMeta('description', metaData.desc);
				} else if (typeof metaData.mdesc != 'undefined') {
					setMeta('description', metaData.mdesc);
				}
			}
		}

		/**
		 * Setze Meta Elemente neu
		 *
		 * @param metaName
		 * @param value
		 */
		function setMeta(metaName, value) {

			var metaElem = document.querySelector('meta[name="'+metaName+'"]'),
				content = metaElem && metaElem.getAttribute('content');

			if (content !== false) {
				metaElem.setAttribute('content', value);
			}
			metaElem = content = undefined;
		}

		function setCanonical(curCanonical, updateFooter) {

			// update config value
			CONFIG.canonical = curCanonical;

			// set canonical
			if ($('link[rel=canonical]').length > 0) {
				$('link[rel=canonical]').attr('href',curCanonical);
			} else {
				if ($('meta[name=fragment]').length > 0) {
					$('<link rel="canonical" href="' + curCanonical + '">').insertBefore('meta[name=fragment]');
				}
			}


			// optional: update footer desktop link
			if (updateFooter) {
				$timeout(function() {

					var elem = angular.element('[nav-view="active"] #jam-desktop-link');

					if (elem.length > 0) {
						var desktopLink = (curCanonical.indexOf('?') >= 0) ? curCanonical + '&show_desktop=yes' : curCanonical + '?show_desktop=yes';
						elem[0].href = desktopLink;
					}

					elem = undefined;

				}, 1000);
			}
		}

		function getCanonical(containerID) {
			var elem = angular.element(containerID + ' #jam-desktop-link');

			if (typeof elem != 'undefined' && typeof elem[0] != 'undefined') {
				return elem[0].href;
			}
			return '';
		}


		function cleanName(name) {
			var temp = name;
			temp = temp.replace(/med\. /gi, '');
			temp = temp.replace(/dent\. /gi, '');
			temp = temp.replace(/Priv\.-Doz\./gi, 'PD');
			temp = temp.replace(/Prov\. /gi, '');
			temp = temp.replace(/Dr\. Dr\./gi, 'Dr.');
			return temp;
		}


		function createDatum(datum) {

			var datum = new Date(datum*1000),
				month = datum.getMonth() + 1,
				day = datum.getDate(),
				year = datum.getFullYear();

			if (month<10) { month = '0'+month; }
			if (day<10) { day = '0'+day; }

			return day + '.' + month + '.' + year;
		}


		function formatDate(timestamp, short) {

			var curDate = new Date(timestamp * 1000);

			var curTerminStd = ((curDate.getHours() < 10) ? "0"+curDate.getHours() : curDate.getHours());
			var curTerminMin = ((curDate.getMinutes() < 10) ? "0"+curDate.getMinutes() : curDate.getMinutes());
			var curTerminTag = ((curDate.getDate() < 10) ? "0"+curDate.getDate() : curDate.getDate());
			var curTerminMon = ((curDate.getMonth() < 9) ? "0"+(curDate.getMonth()+1) : curDate.getMonth()+1);

			var formattedDate = CONFIG.weekDays[curDate.getDay()] + ', ' + curTerminTag + '.' + curTerminMon + '.' + curDate.getFullYear() + ', ' + curTerminStd + ':' + curTerminMin + ' Uhr';
			if (short) {
				formattedDate = CONFIG.weekDays[curDate.getDay()] + ', ' + curTerminTag + '.' + curTerminMon + '.' + ', ' + curTerminStd + ':' + curTerminMin;
			}

			return formattedDate;
		}


		function createFloat(value, pattern) {

			pattern = pattern || '-';

			if (value) {
				value = ((Math.round(value*10))/10).toFixed(1).toString().replace(/\./g, ',');
			} else {
				value = pattern.toString();
			}

			return value;
		}


		function getProfile(refId, url, noAutoError) {

			var profileData = getProfileFromCache(refId),
				apiUrl,
				deferred = $q.defer(),
				promise = deferred.promise;

			noAutoError = noAutoError || false;

			if (!profileData) {

				// get short/full profile url
				if (url.indexOf('/profil/') == 0) {
					apiUrl = CONFIG.apiUrl + '/profil/' + refId + '/';
				} else if(url.indexOf('http') == -1) {
					apiUrl = CONFIG.apiUrl + url;
				} else {
					apiUrl = url;
				}

				JamSyncService.ajax(apiUrl).success( function (data) {

					if (typeof data.error != 'undefined' && data.error) {

						data.refId = refId;

						deferred.reject(data);

					} else {

						profileData = getProfileDetails(data.data);
						deferred.resolve(profileData);
					}

				}).error( function (errorResponse) {

					errorResponse.refId = refId;

					if (!noAutoError) {
						if (errorResponse.code == 404 || errorResponse.code == '404') {
							pageNotFound();
						} else {
							showHashTimeout('', true, false, errorResponse.code);
						}
					}

					deferred.reject(errorResponse);
				});

			} else {

				deferred.resolve(profileData);
			}

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};

			return promise;
		}

		function getProfileDetails(data, addDataToCache) {

			if (typeof data == 'undefined') return false;

			// add profile data to cache?
			var addDataToCache = (typeof addDataToCache != 'undefined') ? addDataToCache : true;

			// full ref id
			data.fullRefId = data.ref_id + '_' + data.art;


			// Fach super string
			data.fachStringComplete = '';
			
			if (data.typ_string && (data.typ != 'OS' || typeof data.fach_string != 'object')) {
				data.fachStringComplete = data.typ_string;
			}

			if (data.fach_string) {
				if (data.fachStringComplete.length > 0) data.fachStringComplete += ', ';
				data.fachStringComplete += data.fach_string.join(', ');
			}

			if (data.zfach_string) {
				if (data.fachStringComplete.length > 0) data.fachStringComplete += ', ';
				data.fachStringComplete += data.zfach_string.join(', ');
			}

			// typ string
			data.typ_string_01 = (data.anrede == 1) ? 'diesen ' + data.typ_string : 'diese ' + data.typ_string;

			// show google adsense?
			data.showGa = true;
			if ((CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape' && data.otb && data.otb.status == 1) ||
				data.premium_paket > 3 ||
				!data.typ ||
				CONFIG.environment == 'app') {
				data.showGa = false;
			}

			// show images?
			data.showGallery = (data.bilder && data.bilder.length > 0);

			// Hat Videos?
			data.videoUrl = false;
			if (data.premium_paket == 6 && typeof data.videos !== 'undefined' && typeof data.videos.urls !== 'undefined' && data.videos.urls.length > 0) {
				data.videoUrl = (data.videos.urls[0].indexOf('?') == -1) ? data.videos.urls[0] + '?rel=0' : data.videos.urls[0] + '&rel=0';
			}

			// has profile image?
			data.hasProfileImage = false;
			if (data.portrait && data.portrait.pfad) {
				data.hasProfileImage = true;

				// replace http with https!
				data.portrait.pfad = replaceHttp(data.portrait.pfad);
			}


			// replace gallery paths?
			if (data.bilder) {
				for (var i = 0; i < data.bilder.length; i++) {
					data.bilder[i].pfad = replaceHttp(data.bilder[i].pfad);
				}
			}


			// set sprite class
			data.spriteClass = '';
			if (data.portrait && data.portrait.sprite) {
				data.spriteClass = 'portrait-' + data.portrait.sprite;
			}


			// format numbers
			if (typeof data.aufrufe == 'undefined') {
				data.aufrufeFormatted = '-';
			} else {
				data.aufrufeFormatted = parseInt(data.aufrufe).toLocaleString();
			}


			// set last update date
			data.lastUpdate = (data.last_update) ? createDatum(data.last_update) : false;


			// format overall ratings
			if (data.gesamt_note >= 1) {
				data.gesamtNoteFormatted = $filter('number')(data.gesamt_note, 1).toLocaleString();
				data.gesamtNoteFormatted = data.gesamtNoteFormatted.replace(".", ",");
			} else {
				data.gesamtNoteFormatted = '-';
			}


			data.evaluateOverviewURL = CONFIG.urlPrefix + data.url + 'bewertungen/' + data.url_hinten;
			var overwriteURL = false;

			// ratings text
			data.rateInt = parseInt($filter('number')(data.gesamt_note, 1));
			data.rateText = 'Bewerten';
			data.rateTextLong = 'Bewerten';
			data.ratingsTextClass = 'jam-h2';
			if (data.ist_bewertbar) {

				if (data.typ == 'HA' || data.typ == 'ZA') {
					data.rateText = 'Arzt bewerten';
					if (data.anrede == 1) {
						data.rateTextLong = 'Diesen Arzt Bewerten';
					} else {
						data.rateTextLong = 'Diese Ärztin Bewerten';
					}
				}

				if (data.bewertungen > 0) {
					if (data.gesamt_note && data.gesamt_note > 0) {
						data.ratingsText = 'Alle Bewertungen (' + $filter('number')(data.bewertungen, 0) + ')';
					} else {
						data.ratingsText = 'Archivierte Bewertungen anzeigen (' + $filter('number')(data.bewertungen, 0) + ')';
					}
				} else {
					data.ratingsText = 'Noch keine Bewertung erhalten.';
				}

			} else if (data.art == 2 && (data.typ == 'X' || data.typ == 'G' || data.typ == 'M') && data.sub_personen) {

				if (data.bewertungen > 0) {
					data.ratingsText = 'Bewertete Ärzte (' + $filter('number')(data.jam_has_persons, 0) + ')';
				} else {
					data.ratingsText = 'Noch keine Bewertung erhalten.';
				}

				data.rateText = 'Ärzte bewerten';
				data.rateTextLong = 'Ärzte bewerten';
				overwriteURL = true;

			} else if (data.art == 2 && !(data.typ == 'A' || data.typ == 'F')) {

				if (data.sub_personen) {

					if (data.bewertungen > 0) {
						data.ratingsText = 'Bewertete Ärzte (' + $filter('number')(data.jam_has_persons, 0) + ')';
					} else {
						data.ratingsText = 'Noch keine Bewertung erhalten.';
					}
					data.rateText = 'Ärzte bewerten';
					data.rateTextLong = 'Ärzte bewerten';

				} else {

					data.ratingsTextClass = 'jam-h2-clinic light-font';
					data.ratingsText = 'Eine ausführliche Bewertung ist leider nicht möglich.';
					data.rateText = '';
					data.rateTextLong = '';
				}

				data.evaluateOverviewURL = CONFIG.urlPrefix + '/profil/abteilung-aerzte/' + data.ref_id + '_' + data.art + '/';

			} else if (data.inst_profil_url) {
				/*
				Desktop Logik
				Info $has_only_bw_from_subs --> fehlt
				if ( $eintrag['ist_bewertbar']===false && !$has_only_bw_from_subs ) {
					if ( $eintrag['art']==1 && ($eintrag['verbind_typ']=="A" || $eintrag['verbind_typ']=="F") ) {
						$output .= '<div class="note0 note-big" style="position:absolute; top:0px; width:130px;"><div class="keine" style="padding-left:6px; padding-right:6px;">Klinik&auml;rzte k&ouml;nnen leider nicht im Detail bewertet werden.</div></div>';
					} else {
						$output .= '<div class="note0 note-big" style="position:absolute; top:0px; width:130px;"><div class="keine">Eine ausf&uuml;hrliche Bewertung ist leider nicht m&ouml;glich.</div></div>';
					}
				}*/

				data.ratingsTextClass = 'jam-h2-clinic light-font';
				data.ratingsText = 'Klinikärzte können leider nicht im Detail bewertet werden.';
				data.rateText = 'Klinik bewerten';
				data.rateTextLong = 'Klinik bewerten';
			}


			// review link
			data.reviewLink = '#';
			if (data.ist_bewertbar) {
				data.reviewLink = CONFIG.urlPrefix + data.url + 'schritt-1/bewerten/' + data.url_hinten;
			} else if (data.art == 2 && data.sub_personen && (data.typ == 'X' || data.typ == 'G' || data.typ == 'M')) {
				data.reviewLink = CONFIG.urlPrefix + data.url + data.verbund_pers_link.url_part + data.url_hinten + '?bw=1';
			} else if (data.inst_profil_url) {
				data.reviewLink = CONFIG.urlPrefix + '/profil/uebersicht/' + data.acxid_i + '_2/';
			} else {
				data.reviewLink = false;
			}


			// recommendations
			data.numRecommendations = (typeof data.empfehlungen != 'undefined' && data.empfehlungen > 0) ? data.empfehlungen : '0';


			// ratings additional info
			data.ratingsAdditionalInfo = '';
			if (data.custom_bewertungen_link) {
				data.ratingsAdditionalInfo = 'Die Gesamtbewertung ergibt sich aus den Bewertungen der dazugehörigen Einträge.';
			}


			// phone call text
			data.telephone = (data.tel) ? data.tel : '';
			data.telephoneLink = data.telephone.replace(/[^0-9\.]+/g, '');
			data.telephoneText = ((data.typ == 'HA' || data.typ == 'ZA') ? 'Anrufen' : 'Anrufen');


			// toggle otb
			data.showOtb = (data.otb && data.otb.status == 1);


			// business hours
			data.businessHours = (data.oeff) ? getBusinessHours(data.oeff) : false;


			// maps link
			if (CONFIG.deviceOs == 'android') {
				data.mapsLink = encodeURI('geo:' + data.strasse + ' ' + data.plz + ' ' + data.ort + ' Deutschland');
			} else if (CONFIG.deviceOs == 'iOS') {

				data.mapsLink = "http://maps.apple.com/?q=" + encodeURI(data.strasse + ' ' + data.plz + ' ' + data.ort + ' Deutschland');

				/*if (CONFIG.environment == 'app') {
					//data.mapsLink = 'comgooglemaps://?q=' + encodeURI(data.strasse + ' ' + data.plz + ' ' + data.ort + ' Deutschland');
					data.mapsLink = 'maps://?q=' + encodeURI(data.strasse + ' ' + data.plz + ' ' + data.ort + ' Deutschland');
				} else {
					data.mapsLink = encodeURI('https://maps.google.com/maps?q=' + data.strasse + ' ' + data.plz + ' ' + data.ort + ' Deutschland');
				}*/
			} else {
				data.mapsLink = encodeURI('https://maps.google.com/maps?q=' + data.strasse + ' ' + data.plz + ' ' + data.ort + ' Deutschland');
			}


			// insurance
			data.showInsurance = false;
			if (data.abrtyp > 0 && data.typ != 'HP' && data.typ != 'HE') {
				data.showInsurance = true;
			}


			// canonical
			data.canonical = 'https://www.jameda.de' + data.url + 'uebersicht/' + data.url_hinten;
			data.canonicalBewertung = 'https://www.jameda.de' + data.url + 'bewertungen/' + data.url_hinten;

			// is favourite?
			data.isFavourite = isFavourite(data.ref_id);


			// is recommended?
			data.isRecommended = isRecommendedDoctor(data.ref_id);
			data.hat_top5_siegel = [];

			// Badges
			if (data.hat_top10_siegel && data.hat_top10_siegel.length > 0) {

				var tmpBadges = {
					top5: [],
					top10: []
				};

				for (var i = 0; i < data.hat_top10_siegel.length; i++) {
					if (data.hat_top10_siegel[i].text2 == '') {
						data.hat_top10_siegel[i].text2 = 'Mediziner'
					}

					if (data.hat_top10_siegel[i].typ == 5) {
						tmpBadges.top5.push(data.hat_top10_siegel[i]);
					} else if(data.hat_top10_siegel[i].typ == 1) {
						tmpBadges.top10.push(data.hat_top10_siegel[i]);
					}
				}

				data.hat_top5_siegel = tmpBadges.top5;
				data.hat_top10_siegel = tmpBadges.top10;
			} else {
				data.hat_top10_siegel = [];
			}


			data.showTop5Badge = (data.hat_top5_siegel.length > 0);
			data.showTop10Badge = (data.hat_top10_siegel.length > 0);
			data.showRatingsBadge = (data.pruef_quote && data.pruef_quote < 50);

			data.badgesCnt = 0;
			if (data.showRatingsBadge) {
				data.badgesCnt++;
			}

			if (data.showTop5Badge) {
				data.badgesCnt++;
			}

			if (data.showTop10Badge) {
				data.badgesCnt++;
			}

			// show edit profile button?
			data.showEditProfileButton = false;
			data.editProfileLink = 'https://www.jameda.de/premium/bestellen/bestellen.php?schritt=4&paket=3&id=' + data.ref_id + '_' + data.art + '&direktfrom=daten_edit&show_desktop=yes&utm_source=Mobile&utm_medium=Button+Profil+bearbeiten&utm_content=Profilbild&utm_campaign=Mobile';
			if (CONFIG.deviceType == 'tablet' && typeof data.premium_paket != 'undefined' && data.premium_paket < 3) {
				data.showEditProfileButton = true;
			}


			// show areYouDrX
			data.showAreYouDrX = false;
			if (typeof data.premium_paket == 'undefined' || data.premium_paket < 5) {
				data.showAreYouDrX = true;
				data.areYouText = ((data.art == 2)? 'Repräsentieren Sie die Institution ' : 'Sind Sie ') + ((data.name_nice)? cleanName(data.name_nice) : '') + '?';
			}


			// hide kbz map
			data.showKbzMap = (data.premium_paket > 3) ? true : false;
			data.showKbzMapLoading = false;


			// show premiums
			data.showPremiums = false;
			data.showPremiumsTpf = false;
			if (data.kunden_umgebung) {

				// set data
				data.showPremiums = true;
				data.premiumsData = [];
				data.premiumsLimit = 3;
				data.premiumsTpf = false;
				data.premiumsHeadline = data.kunden_umgebung.headline;

				// format data
				for (var i = 0; i < data.kunden_umgebung.results.length; i++) {

					var value = data.kunden_umgebung.results[i];

					data.premiumsData.push(getProfileDataFormatted(value));
					addPreloadedProfilesToCache({ results: [value] });
				};

				// check TPF data
				if (data.kunden_umgebung.TPF && data.kunden_umgebung.TPF.results) {
					data.showPremiumsTpf = true;
					data.premiumsTpfData = getProfileDataFormatted(data.kunden_umgebung.TPF.results[0]);
					data.premiumsLimit = 2;
				}

				// show all - button
				data.showAllPremiumsText = ((data.kunden_umgebung.headline == 'Andere Einträge') ? '' : 'Alle ') + data.kunden_umgebung.headline + ' in der Nähe mit Foto';
				data.showAllPremiumsUrl = CONFIG.urlPrefix + data.kunden_umgebung.querylink.replace('/arztsuche/', '/ergebnisliste/').replace('&amp;', '&');
			}


			// show sub institutionen
			data.showSubInstitutionen = false;
			if (typeof data.sub_institutionen != 'undefined') {

				// set data
				data.showSubInstitutionen = true;
				data.subInstitutionenData = [];
				data.subInstitutionenHeadline = data.sub_institutionen.headline;

				// format data
				for (var i = 0; i < data.sub_institutionen.results.length; i++) {

					var value = data.sub_institutionen.results[i];
					data.subInstitutionenData.push(getProfileDataFormatted(value));
				}

				// show all - button
				data.showAllSubInstitutionenText = 'Alle ' + data.sub_institutionen.headline;
				data.showAllSubInstitutionenUrl = CONFIG.urlPrefix + '/profil/' + data.verbund_inst_link.url_part + data.ref_id + '_' + data.art + '/';


				if (overwriteURL) data.evaluateOverviewURL = data.showAllSubInstitutionenUrl;
			}


			// show sub personen
			data.showSubPersonen = false;
			if (typeof data.sub_personen != 'undefined') {

				// set data
				data.showSubPersonen = true;
				data.subPersonenData = [];
				data.subPersonenHeadline = data.sub_personen.headline;

				// format data
				for (var i = 0; i < data.sub_personen.results.length; i++) {
					data.subPersonenData.push(getProfileDataFormatted(data.sub_personen.results[i]));
				}

				// show all - button
				data.showAllSubPersonenText = 'Alle ' + data.sub_personen.headline;
				data.showAllSubPersonenUrl = CONFIG.urlPrefix + data.url + data.verbund_pers_link.url_part + data.url_hinten;

				if (overwriteURL) data.evaluateOverviewURL = data.showAllSubPersonenUrl;
			}


			// show location module?
			data.locationModule = {
				hasMultiLocations: (typeof data.num_multi_eintraege != 'undefined' && data.num_multi_eintraege > 1),
				hasColleagues: (typeof data.kollegen_link != 'undefined' && typeof data.kollegen_link.url_part != 'undefined')
			};
			data.locationModule.showLocationModule = (data.locationModule.hasMultiLocations || data.locationModule.hasColleagues);


			data.inst_bezeichnung = 'Die Institution';
			switch (data.verbind_typ) {
				case 'F': data.inst_bezeichnung = 'Die Abteilung';
					break;
				case 'E': data.inst_bezeichnung = 'Die Einzelpraxis';
					break;
				case 'M': data.inst_bezeichnung = 'Das MVZ';
					break;
				case 'G': data.inst_bezeichnung = 'Die Gemeinschaftspraxis';
					break;
				case 'X': data.inst_bezeichnung = 'Die Praxisgemeinschaft';
					break;
				case 'K': data.inst_bezeichnung = 'Die Klinik';
					break;
				case 'B': data.inst_bezeichnung = 'Die Einrichtung';
					break;
			}

			if (typeof data.inst_profil_url != 'undefined') {

				if (data.inst_profil_url.indexOf('index.php') > -1) {

					var tmpRefID = data.inst_profil_url.replace('/arztsuche/profil/index.php?id=','');
					data.inst_profil_url = '/profil/uebersicht/'+tmpRefID+'/';
				}
			}

			if (typeof data.verbund_inst_name_nice != 'undefined' && data.inst_bezeichnung == '') {

				if (data.verbund_inst_name_nice.indexOf('Klinik') !== -1) {
					data.inst_bezeichnung = 'Klinik';
				}
			}

			// add to cache
			if (addDataToCache) addProfileToCache(data.ref_id + '_' + data.art, data);

			// return data
			return data;
		}


		function replaceHttp(data) {

			// replace http with https
			data = data.replace('http://', 'https://');

			// replace cdn with cloudfront url
			data = data.replace('https://cdn1.jameda-elements.de/', 'https://d1gm60ivvin8hd.cloudfront.net/');
			data = data.replace('https://cdn2.jameda-elements.de/', 'https://d1gm60ivvin8hd.cloudfront.net/');
			data = data.replace('https://cdn3.jameda-elements.de/', 'https://d1gm60ivvin8hd.cloudfront.net/');

			return data;
		}


		function addProfileToCache(fullRefId, profileDetails) {

			if (typeof fullRefId == 'undefined' || !localStorageSupport()) return false;

			var profileCache = getFromCache('profileCache', CONFIG.storageTimeout.profile);

			// clear profileCache, if it is currently not set, or we want to refresh it
			if (!profileCache) {
				profileCache = {};
			}

			profileCache[fullRefId] = profileDetails;

			return setIntoCache('profileCache', profileCache);
		}


		function getProfileFromCache(fullRefId) {

			if (typeof fullRefId == 'undefined' || !localStorageSupport()) return false;

			// Get profileData from cache (localStorage)
			var profileCache = getFromCache('profileCache', CONFIG.storageTimeout.profile);

			if (!profileCache || typeof profileCache[fullRefId] != 'object') return false;

			if (profileCache[fullRefId]) profileCache = profileCache[fullRefId];

			return profileCache;
		}


		function addPreloadedProfilesToCache(response) {

			// check data
			if (typeof response != 'object' || typeof response.results != 'object' || response.results.length < 1) return false;

			var profileCache = {};
			// get existing cache
			//var profileCache = getFromCache('preloadedProfileCache', CONFIG.storageTimeout.profile);


			// clear profileCache, if it is currently not set, or we want to refresh it
			//if (!profileCache) {
				//profileCache = {};		// always reset profile cache
			//}


			// add single results
			for (var i = 0; i < response.results.length; i++) {

				// get details
				var value = getProfileDetails(response.results[i], false);

				// add to cache
				profileCache[value.fullRefId] = value;
			}

			// add results to cache
			return setIntoCache('preloadedProfileCache', profileCache);
		}


		function getPreloadedProfileFromCache(fullRefId) {

			if (typeof fullRefId == 'undefined' || !localStorageSupport()) return false;

			// Get profileData from cache (localStorage)
			var profileCache = getFromCache('preloadedProfileCache', CONFIG.storageTimeout.profile);

			if (!profileCache || typeof profileCache[fullRefId] != 'object') return false;

			if (profileCache[fullRefId]) profileCache = profileCache[fullRefId];


			return profileCache;
		}

		function getProfileList(data, type) {

			var params = { "ids[]": data},
				url = CONFIG.apiUrl + '/arztsuche/',
				deferred = $q.defer(),
				promise = deferred.promise;


			if (typeof CONFIG.userProfile.user != 'undefined') {

				params.email = CONFIG.userProfile.user.email;
				params.loginHash = CONFIG.userProfile.user.loginHash;
				params.loginTime = CONFIG.userProfile.user.loginTime;
			}

			JamSyncService.ajax(url, params).success(function(result) {

				var results = [],
					list = [];

				if (typeof result.data.results != 'undefined' && result.data.results.length > 0) {

					results = result.data.results;

					for (var i = 0; i < results.length; i++) {

						results[i].fullRefId = results[i].ref_id +"_" + results[i].art;

						list.push(results[i].fullRefId);

						var fachString = results[i].typ_string;

						if (typeof results[i].fach_string != 'undefined') {

							for (var y = 0; y < results[i].fach_string.length; y++) {
								fachString += ", " + results[i].fach_string[y];
							}
						}

						if (typeof results[i].zfach_string != 'undefined') {

							for (var y = 0; y < results[i].zfach_string.length; y++) {
								fachString += ", " + results[i].zfach_string[y];
							}
						}

						results[i].fachStringComplete = fachString;
					}

					if (CONFIG.userProfile.user) {

						if (type == 'favourites') {
							CONFIG.userProfile.user.favs = list;
						} else {
							CONFIG.userProfile.user.observations = list;
						}

						var loginData = {
							user: CONFIG.userProfile.user,
							premium: CONFIG.userProfile.premium,
							bubbles: CONFIG.userProfile.user.bubbles,
							persist: CONFIG.userProfile.persist,
							timestamp: new Date().getTime()
						};

						setIntoCache('jamUser', loginData);
						loginData = undefined;

					} else {

						if (type == 'favourites') {
							setIntoCache('favourites', list);
						}
					}

					deferred.resolve(results);

				} else {
					deferred.reject(result);
				}

			}). error(function(errorResponse) {

				if (errorResponse.code == 404 || errorResponse.code == '404') {
					pageNotFound();
				} else {
					showHashTimeout('', true, false, errorResponse.code);
				}

				deferred.reject(errorResponse);
			});

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			};

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			};

			return promise;
		}

		function getProfileEvaluates(data, url, params) {

			var fullRefId = data.fullRefId,
				loadedData = false,
				deferred = $q.defer(),
				promise = deferred.promise,
				evaluateData = getFromCache('evaluates'+fullRefId, CONFIG.storageTimeout.evaluates);

			if (evaluateData) {
				deferred.resolve(evaluateData);

			} else {

				params = params || {};

				JamSyncService.ajax(url, params).success( function (result) {

					evaluateData = result.data;
					evaluateData.fullRefId = data.fullRefId;

					var tmpOverview = {
						questions: [],
						questionsAvg: [],
						grades: []
					};


					// Format overall evaluates
					Object.keys(evaluateData.bewert_overview).forEach(function(key) {

						var value = evaluateData.bewert_overview[key];

						if (key.indexOf('frage') !== -1) {

							// questions
							if (key.indexOf('avg') !== -1) {

								tmpOverview.questionsAvg.push(value);

							} else {

								tmpOverview.questions.push(value);
							}

							// Notes for questions
						} else if (key.indexOf('note') !== -1) {

							tmpOverview.grades.push( {note: value});
						}
					});


					evaluateData.evaluateOverview = tmpOverview;
					setIntoCache('evaluates'+fullRefId, evaluateData);
					deferred.resolve(evaluateData);

				}).error( function (errorResponse) {

					if (errorResponse.code == 404 || errorResponse.code == '404') {
						pageNotFound();
					} else {
						showHashTimeout('', true, false, errorResponse.code);
					}

					deferred.reject(errorResponse);
				});
			}



			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			}

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			}

			return promise;
		}

		/**
		 * Does Client support localStorage?
		 * (private mode?)
		 *
		 * @param showMessage
		 * @returns {boolean}
		 */
		function localStorageSupport(showMessage) {

			showMessage = showMessage || false;
			var showHint = false,
				lsIsSupported = true;

			if (!localStorageService.isSupported) {
				if (!CONFIG.localStorageMessage) {
					showHint = true;
				}
				lsIsSupported = false;
			} else {

				localStorageService.set('jameda', CONFIG.appVersion);

				if (localStorage.length === 0) {
					lsIsSupported = false;
					if (!CONFIG.localStorageMessage) {
						showHint = true;
					}
				}
			}


			if (showHint) {
				$timeout(function() {
					if (vm.popup == null) {
						// Show message only once
						CONFIG.localStorageMessage = true;

						vm.popup = $ionicPopup.alert({
							title: 'Hinweis "Privates Surfen" aktiv',
							template: 'Sie haben in Ihrem Browser (z.B. Safari) die Einstellung "Privates Surfen" aktiviert, dies kann zu Einschränkungen bei der Verwendung der mobilen Seite von jameda kommen. Schalten Sie den Modus aus um die jameda Arztsuche optimal zu nutzen.',
							okText: 'Schließen'
						});
					}
				}, 400);
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

			// key not set, or localStorage is not supported
			if (key == '' || typeof key == 'undefined' || !localStorageSupport()) return false;

			timeout = timeout || 0;

			// set needed variables
			var timeoutStorage = localStorageService.get(key + 'timeout'),
				tmpDate = (+new Date()),
				tmpTimeout = (tmpDate/1000-timeoutStorage/1000),
				data = [],
				storageData = false;

			// no valid key found or cache is not validated anymore
			if (timeout != 0) {

				if (!timeoutStorage || (tmpTimeout > timeout)) {
					return false;
				}
			}

			storageData = localStorageService.get(key);

			// no data found to this key
			if (!storageData) {
				return false;
			}

			// parse data into json object or return it as a string
			try {

				data = JSON.parse(storageData);

			} catch(e) {

				data = storageData;
			}

			timeoutStorage = tmpDate = tmpTimeout = storageData = undefined;
			return data;
		}

		/**
		 * Set data into localStorage
		 *
		 * @param key
		 * @param data
		 * @returns {boolean}
		 */
		function setIntoCache(key, data) {

			// key not set, or localStorage is not supported
			if (key == '' || typeof key == 'undefined' || !localStorageSupport()) return false;


			// check if key already exists and remove it from storage
			var alreadyExists = localStorageService.get(key);

			if (alreadyExists) {
				localStorageService.remove(key, key + 'timeout');
			}

			if (typeof data != 'string') {
				data = JSON.stringify(data);
			}

			// everything was ok, insert into localStorage now
			var timeoutDate = (+ new Date());

			localStorageService.set(key+'timeout', timeoutDate);
			return localStorageService.set(key, data);
		}


		function clearLocalStorageKey(key) {

			// key not set, or localStorage is not supported
			if (key == '' || typeof key == 'undefined' || !localStorageSupport()) return false;

			return localStorageService.remove(key, key + 'timeout');
		}

		function localStorageMax(key, max) {

			key = key || 'evaluates';
			max = max || 5;

			var storage = window.localStorage || localStorage || null,
				items = [],
				i = 0,
				ordered = {};

			if (storage === null) return false;

			Object.keys(storage).forEach(function(tKey) {
				if (tKey.indexOf(key) !== -1 && tKey.indexOf('timeout') !== -1) {
					items[storage[tKey]] = tKey.replace('timeout','');
					i++;
				}
			});

			Object.keys(items).sort().forEach(function(key) {
				ordered[key] = items[key];
			});

			while(i > max) {

				var tmp = Object.keys(ordered)[0];
				clearLocalStorageKey(ordered[tmp].replace('ls.',''));
				delete ordered[tmp];
				i--;
			}
		}


		/**
		 * Clear all Data in localStorage
		 *
		 * @returns {boolean}
		 */
		function clearLocalStorage() {

			if (!localStorageSupport()) return false;

			return localStorageService.clearAll();
		}


		/**
		 * Is Doctor users favourite?
		 *
		 * @param refId
		 * @returns {boolean}
		 */
		function isFavourite(refId, art) {

			if (CONFIG.userProfile.user) {

				var favourites = CONFIG.userProfile.user.favs;

			} else {

				var favourites = getFromCache('favourites',CONFIG.storageTimeout.favourites);
			}

			if (!favourites) {
				return false;
			}

			var keyExists = false,
				tmpRefId;

			Object.keys(favourites).forEach(function(key) {

				tmpRefId = favourites[key].split('_');
				tmpRefId = tmpRefId[0];

				if (tmpRefId == refId || favourites[key] == refId) {
					keyExists = true;
				}
			});

			return keyExists;
		}


		/**
		 * Add profile to users favourite list
		 *
		 * @param refId
		 */
		function addFavourite(refId, art) {

			if (CONFIG.userProfile.user) {

				var favourites = CONFIG.userProfile.user.favs;

			} else {

				var favourites = getFromCache('favourites', CONFIG.storageTimeout.favourites);
			}

			if (!favourites) {
				favourites = [];
			}

			// check, if key already exists
			var keyExists = false;

			Object.keys(favourites).forEach(function(key) {
				if (favourites[key] == refId) {
					keyExists = true;
				}
			});

			if (!keyExists) {

				// is user logged in?
				if (CONFIG.userProfile.user) {

					// Add Favourite to account
					JamUserFavouritesService.favs([refId], 'add').success(function(result) {

						if (result.data.favs) {

							// prepare userobject
							CONFIG.userProfile.user.favs = result.data.favs;

							var loginData = {
								user: CONFIG.userProfile.user,
								premium: CONFIG.userProfile.premium,
								bubbles: CONFIG.userProfile.user.bubbles,
								persist: CONFIG.userProfile.persist,
								timestamp: new Date().getTime()
							};

							setIntoCache('jamUser', loginData);
							loginData = undefined;

						} else {

							// Delete user object and add refid to LS
							CONFIG.userProfile = {};
							addFavourite(refId, art);
						}

					}).error(function() {

						// Delete user object and add refid to LS
						CONFIG.userProfile = {};
						addFavourite(refId, art);
					});

				} else {

					favourites.push(refId);
					setIntoCache('favourites',favourites);
				}
			}

			var tmpElement = $('#profile-' + refId + ' .jam-action-favourite');
			tmpElement.addClass('ion-android-star');
			tmpElement.addClass('jam-action-active');
			tmpElement.removeClass('ion-android-star-outline');

			favourites = undefined;
		}


		/**
		 * Remove profile from favourite-list
		 *
		 * @param refId
		 * @returns {boolean}
		 */
		function removeFavourite(refId) {

			if (!refId || !localStorageSupport()) return false;

			if (CONFIG.userProfile.user) {

				JamUserFavouritesService.favs([refId], 'remove').success(function(result) {

					if (result.data.favs) {
						CONFIG.userProfile.user.favs = result.data.favs;

						var loginData = {
							user: CONFIG.userProfile.user,
							premium: CONFIG.userProfile.premium,
							bubbles: CONFIG.userProfile.user.bubbles,
							persist: CONFIG.userProfile.persist,
							timestamp: new Date().getTime()
						};

						setIntoCache('jamUser', loginData);
						loginData = undefined;
					}

				}).error(function() {

					CONFIG.userProfile = {};
					removeFavourite(refId);
				});

			} else {

				var favourites = getFromCache('favourites', CONFIG.storageTimeout.favourites);

				if (favourites) {

					var newFavourites = [];

					Object.keys(favourites).forEach(function(key) {
						if (favourites[key] != refId) {
							newFavourites.push(favourites[key]);
						}
					});

					setIntoCache('favourites', newFavourites);
				}

				favourites = undefined;
			}


			// set css
			var tmpElement = $('#profile-' + refId + ' .jam-action-favourite');
			tmpElement.addClass('ion-android-star-outline');
			tmpElement.removeClass('ion-android-star');
			tmpElement.removeClass('jam-action-active');

			tmpElement = undefined;

			return true;
		}

		/**
		 * Get Favourites
		 *
		 * @returns {boolean|Object|string}
		 */
		function getFavourites(userData) {

			userData = userData || {};

			// LOGIN
			if (typeof userData.user != 'undefined') {

				if (typeof userData.user.favs != 'undefined') return [];

				return userData.user.favs;

			} else {

				var oldData = localStorage.getItem('jam_meine_aerzte');

				if (oldData != null) {

					oldData = JSON.parse(oldData);

					for(var i = 0; i < oldData.length; i++) {
						addFavourite(oldData[i]);
					}

					localStorage.removeItem('jam_meine_aerzte');
				}

				return getFromCache('favourites', CONFIG.storageTimeout.favourites);
			}
		}


		/**
		 * Get synced favourites ids
		 *
		 * @returns {*}
		 */
		function getSyncedFavourites() {

			var syncedResult = {};

			syncedResult.favs = getFromCache('syncedFavs', CONFIG.storageTimeout.favourites);
			syncedResult.lsFavs = getFromCache('favourites', CONFIG.storageTimeout.favourites);
			syncedResult.needSync = false;
			syncedResult.ids = new Array;

			// No favs found -> return false => can't sync with nothing!
			if (!syncedResult.lsFavs) {
				return false;
			}

			// No favourites found?
			if (!syncedResult.favs || (typeof syncedResult.favs.favs != 'undefined' && CONFIG.userProfile.user.id != syncedResult.favs.id)) {

				syncedResult.favs = new Array;

			} else {

				syncedResult.favs = syncedResult.favs.favs;
			}



			// Check if favs are more than 0 ;-)
			if (syncedResult.lsFavs.length > 0) {

				if (syncedResult.favs.length > 0) {

					// each item from localstorage
					for (var i = 0; i < syncedResult.lsFavs.length; i++) {

						// reset
						var keyExist = false;

						// check now for each item in api list
						for (var y = 0; y < syncedResult.favs.length; y++) {

							// check, if key does not called before and refID need to match
							if ((syncedResult.favs[y].refId == syncedResult.lsFavs[i]) && !keyExist) {

								keyExist = true;

								// check for not synced yet
								if (!syncedResult.favs[y].synced) {
									syncedResult.ids.push(syncedResult.lsFavs[i]);
									syncedResult.needSync = true;
								}
							}
						}

						// key not exist, so we need to sync!
						if (!keyExist) {

							syncedResult.favs.push({refId: syncedResult.lsFavs[i], synced: false});
							syncedResult.needSync = true;
							syncedResult.ids.push(syncedResult.lsFavs[i]);
						}
					}

				} else {

					// no data found, so sync all local favs
					for (var i = 0; i < syncedResult.lsFavs.length; i++) {

						syncedResult.favs.push({refId: syncedResult.lsFavs[i], synced: false});
						syncedResult.needSync = true;
						syncedResult.ids.push(syncedResult.lsFavs[i]);
					}
				}

				setIntoCache('syncedFavs', {id: CONFIG.userProfile.user.id, favs: syncedResult.favs});
				syncedResult.favs = syncedResult.lsFavs = undefined;

				return syncedResult;
			}

			return false;
		}


		/**
		 * Set Synced Favourites
		 * update synced favs
		 */
		function setSyncedFavourites() {

			var favs = getFromCache('syncedFavs', CONFIG.storageTimeout.favourites);

			for (var i = 0; i < favs.favs.length; i++) {
				favs.favs[i].synced = true;
			}

			setIntoCache('syncedFavs', favs);
		}


		/**
		 * Toggle Favourite
		 *
		 * @param refId
		 * @returns {boolean}
		 */
		function toggleFavourite(refId) {

			if (this.isFavourite(refId)) {
				// GATRACKING
				AnalyticsHelper.trackEvent('Profil - Klicks', 'Profil merken geklickt', 'entfernt');

				this.removeFavourite(refId);
				return false;

			} else {
				// GATRACKING
				AnalyticsHelper.trackEvent('Profil - Klicks', 'Profil merken geklickt', 'hinzugefügt');

				this.addFavourite(refId);
				return true;
			}
		}


		/**
		 * is recommended doc?
		 *
		 * @param refId
		 * @returns {boolean}
		 */
		function isRecommendedDoctor(refId) {

			// get recommendations
			var recommendations = localStorageService.get('recommendations');
			if (!recommendations) {
				recommendations = [];
			}


			// check if key exists
			var keyExists = false;
			for (var i = 0; i < recommendations.length; i++) {
				if (recommendations[i] == refId) keyExists = true;
			}

			// return result
			return keyExists;
		}


		function addRecommendedDoctor(refId) {

			if (!refId) return false;


			// get recommendations
			var recommendations = localStorageService.get('recommendations');
			if (!recommendations) {
				recommendations = [];
			}


			// check if key exists
			var keyExists = false;
			for (var i = 0; i < recommendations.length; i++) {
				if (recommendations[i] == refId) keyExists = true;
			}

			// add key
			if (!keyExists) {
				recommendations.push(refId);

				// update recommendations new value
				localStorageService.set('recommendations', recommendations);
			}
		}


		function removeRecommendedDoctor(refId) {

			if (!refId) return false;


			// get recommendations
			var recommendations = localStorageService.get('recommendations');
			if (!recommendations) {
				recommendations = [];
			}


			// build new array
			var tmpRecommendations = [];
			for (var i = 0; i < recommendations.length; i++) {

				if (recommendations[i] == refId) return true;
				tmpRecommendations.push(recommendations[i]);
			}

			// update recommendations
			localStorageService.set('recommendations', tmpRecommendations);
		}


		function toggleRecommendedDoctor(refId) {
			if (this.isRecommendedDoctor(refId)) {
				this.removeRecommendedDoctor(refId);
			} else {
				this.addRecommendedDoctor(refId);
			}
		}

		function doRecommend (profileData, params) {

			profileData = profileData || null;
			params = params || {};

			var url = CONFIG.apiUrl + '/_scripts/json-api.php', deferred = $q.defer(), promise = deferred.promise;

			if (profileData != null) {

				JamSyncService.ajax(url, params).success(function(resultData) {

					if (typeof resultData.error != 'undefined' && resultData.error) {

						deferred.reject(resultData.data);

					} else {

						var data = resultData.data;

						if (data.msg == 'success') {

							if (!data.undo_empfehlung) {
								addRecommendedDoctor(profileData.ref_id);
							} else {
								removeRecommendedDoctor(profileData.ref_id);
							}

							deferred.resolve(data);

						} else {

							data.error = true;
							data.code = 403;
							data.message = data.msg;
							data.alreadyVoted = true;
							deferred.reject(data);
						}
					}

				}).error (function (errorResponse) {
					deferred.reject(errorResponse);
				});

			} else {
				deferred.reject({error: true, code: 403, message: 'No Profile Data received!'});
			}

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			}

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			}

			return promise;
		}


		/**
		 * Add Observations
		 * without window
		 *
		 * @param refId
		 * @returns promise {*}
		 */
		function addObservation(refId) {

			var deferred = $q.defer(), promise = deferred.promise;

			JamUserObservationService.call([refId],'add').success(function(result) {

				var beos = [];
				if (result.result) {
					beos = result.result.beobachtungen;
				} else {
					beos = result.data.beobachtungen;
				}

				CONFIG.userProfile.user.beobachtungen = beos;
				updateUser(CONFIG.userProfile.user);
				deferred.resolve(result.data);

			}).error(function() {

				deferred.reject({error: true, code: 403, message: 'Ihre Beobachtung konnte nicht gespeichert werden!'});
			});

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			}

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			}

			return promise;
		}


		/**
		 * Remove Observation from Entry (UserObject)
		 *
		 * @param refId
		 * @returns promise {*}
		 */
		function removeObservation(refId) {

			var deferred = $q.defer(), promise = deferred.promise;

			JamUserObservationService.call([refId],'remove').success(function(result) {

				var beos = [];
				if (result.result) {
					beos = result.result.beobachtungen;
				} else {
					beos = result.data.beobachtungen;
				}

				CONFIG.userProfile.user.beobachtungen = beos;
				updateUser(CONFIG.userProfile.user);
				deferred.resolve(result.data);

			}).error(function() {

				deferred.reject({error: true, code: 403, message: 'Ihre Beobachtung konnte nicht gespeichert werden!'});
			});

			// Success
			promise.success = function(fn) {
				promise.then(fn);
				return promise;
			}

			// Failure
			promise.error = function(fn) {
				promise.then(null, fn);
				return promise;
			}

			return promise;
		}


		/**
		 * Check, if current user is watching this entry
		 *
		 * @param refId
		 * @returns {boolean}
		 */
		function userObserve(refId) {

			var loginData = getFromCache('jamUser', 0);

			if (loginData && typeof loginData.user.beobachtungen != 'undefined' && loginData.user.beobachtungen.indexOf(refId) !== -1) {
				loginData = undefined;
				return true;
			}
			return false;
		}

		function updateUser(data) {

			var loginData = {
				user: data,
				premium: data.premium || CONFIG.userProfile.premium,
				bubbles: CONFIG.userProfile.bubbles,
				persist: CONFIG.userProfile.persist_login,
				timestamp: CONFIG.userProfile.timestamp
			};

			CONFIG.userProfile = loginData;

			setIntoCache('jamUser', loginData);

			// unset variables
			loginData = undefined;
			return true;
		}

		/**
		 * Datumsberechnung
		 *
		 * Beispiel:
		 * d = new Date(); => "Thu Dec 15 2016 08:34:25 GMT+0100"
		 * dateAdd(d, 'YEAR', 1)
		 * => Fri Dec 15 2017 08:34:25 GMT+0100
		 *
		 * @param date
		 * @param interval
		 * @param units
		 * @returns {Date}
		 */
		function dateAdd(date, interval, units) {
			var ret = new Date(date);
			switch(interval.toLowerCase()) {
				case 'year'   :  ret.setFullYear(ret.getFullYear() + units);  break;
				case 'quarter':  ret.setMonth(ret.getMonth() + 3*units);  break;
				case 'month'  :  ret.setMonth(ret.getMonth() + units);  break;
				case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
				case 'day'    :  ret.setDate(ret.getDate() + units);  break;
				case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
				case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
				case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
				default       :  ret = undefined;  break;
			}
			return ret;
		}

		/**
		 * Verbinde Datum mit Zeit
		 *
		 * @param date
		 * @param time
		 * @returns {Date}
		 */
		function combineDateTime(date, time) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0);
		}


		/**
		 *
		 * @param tmpBusinessHours
		 * @returns {{1: {day: string, dayShort: string, rows: *}, 2: {day: string, dayShort: string, rows: *}, 3: {day: string, dayShort: string, rows: *}, 4: {day: string, dayShort: string, rows: *}, 5: {day: string, dayShort: string, rows: *}, 6: {day: string, dayShort: string, rows: *}, 7: {day: string, dayShort: string, rows: *}}}
		 */
		function getBusinessHours(tmpBusinessHours) {

			var businessHours = {
				1: {
					day: 'Montag',
					dayShort: 'Mo',
					rows: getBusinessDay(tmpBusinessHours['mo'])
				},
				2: {
					day: 'Dienstag',
					dayShort: 'Di',
					rows: getBusinessDay(tmpBusinessHours['di'])
				},
				3: {
					day: 'Mittwoch',
					dayShort: 'Mi',
					rows: getBusinessDay(tmpBusinessHours['mi'])
				},
				4: {
					day: 'Donnerstag',
					dayShort: 'Do',
					rows: getBusinessDay(tmpBusinessHours['do'])
				},
				5: {
					day: 'Freitag',
					dayShort: 'Fr',
					rows: getBusinessDay(tmpBusinessHours['fr'])
				},
				6: {
					day: 'Samstag',
					dayShort: 'Sa',
					rows: getBusinessDay(tmpBusinessHours['sa'])
				},
				7: {
					day: 'Sonntag',
					dayShort: 'So',
					rows: getBusinessDay(tmpBusinessHours['so'])
				}
			};


			return businessHours;
		}


		function getBusinessDay(businessDay) {

			if (typeof businessDay == "undefined") return false;

			var tmp = businessDay;
			businessDay = [];
			businessDay[0] = (tmp[0]) ? tmp[0] : '';
			businessDay[1] = (tmp[1] && tmp[0] != 'NV') ? tmp[1] : '';
			if (businessDay[0] != 'NV') {
				businessDay[2] = (tmp[2]) ? tmp[2] : '';
				businessDay[3] = (tmp[3] && tmp[2] != 'NV') ? tmp[3] : '';
			} else if (tmp[1] != 'NV') {
				businessDay[2] = (tmp[1]) ? tmp[1] : '';
				businessDay[3] = (tmp[2] && tmp[1] != 'NV') ? tmp[2] : '';
			} else {
				businessDay[2] = '';
				businessDay[3] = '';
			}

			businessDay[0] = businessDay[0].replace('NV', 'n.V.');
			businessDay[1] = businessDay[1].replace('NV', 'n.V.');
			businessDay[2] = businessDay[2].replace('NV', 'n.V.');
			businessDay[3] = businessDay[3].replace('NV', 'n.V.');

			return businessDay;
		}


		function getProfileDataFormatted(profileDetails) {

			// init
			var data = {};

			// full ref id
			data.fullRefId = profileDetails.ref_id + '_' + profileDetails.art;

			// has profile image
			data.hasProfileImage = (profileDetails.portrait && profileDetails.portrait.pfad);

			// portrait
			data.portrait = (data.hasProfileImage) ? profileDetails.portrait : false;

			// replace http with https
			if (data.portrait !== false) {
				data.portrait.pfad = replaceHttp(data.portrait.pfad);
			}

			// set sprite class
			data.spriteClass = '';
			if (profileDetails.portrait && profileDetails.portrait.sprite) {
				data.spriteClass = 'portrait-' + profileDetails.portrait.sprite;
			}

			// format overall score
			data.gesamt_note = profileDetails.gesamt_note;
			data.gesamtNoteFormatted = '-';
			if (profileDetails.gesamt_note >= 1) {
				data.gesamtNoteFormatted = $filter('number')(profileDetails.gesamt_note, 1).toLocaleString();
				data.gesamtNoteFormatted = data.gesamtNoteFormatted.replace(".", ",");
			}
			data.rateInt = parseInt(data.gesamt_note);

			// profile link
			data.profileLink = CONFIG.urlPrefix + profileDetails.url + 'uebersicht/' + profileDetails.url_hinten;

			// review link
			if (profileDetails.ist_bewertbar) {
				data.reviewLink = CONFIG.urlPrefix + profileDetails.url +'schritt-1/bewerten/' + profileDetails.ref_id + '_' + profileDetails.art + '/';
			}

			// profile name
			data.profileName = cleanName(profileDetails.name_nice);

			// distance
			data.distance = createFloat(profileDetails.entfernung,'0') + ' km entfernt';

			// profile fach
			data.fachStringComplete = '-';
			if (profileDetails.typ_string && (profileDetails.typ != 'OS' || typeof profileDetails.fach_string != 'object')) {
				data.fachStringComplete = profileDetails.typ_string;

				if (profileDetails.fach_string) data.fachStringComplete += ', ' + profileDetails.fach_string.join(', ');
				if (profileDetails.zfach_string) data.fachStringComplete += ', ' + profileDetails.zfach_string.join(', ');
			}

			// address
			data.address = profileDetails.strasse;
			data.city = profileDetails.plz + ' ' + profileDetails.ort;

			// telephone
			data.telephone = (profileDetails.tel) ? profileDetails.tel : '';
			data.telephoneLink = data.telephone.replace(/[^0-9\.]+/g, '');

			// website
			data.website = (profileDetails.home_url) ? profileDetails.home_url : '';


			// return formatted profile data
			return data;
		}


		function openDoctorWebsite(url, params, source) {

			// track url klick
			trackUrlKlick(params);


			// GATRACKING
			switch (source) {
				case 'profile':
					AnalyticsHelper.trackEvent('Profil - Klicks', 'Kunden-Homepage geklickt');
					break;
				case 'premium-contents':
					AnalyticsHelper.trackEvent('Premium Contents - Klicks', 'Kunden-Homepage geklickt');
					break;
			}


			url = (url.indexOf('http://') == 0) ? url : 'http://' + url;
			window.open(url, '_system');
		}


		function roundAndPercent(value) {
			return Math.round(value / 10);
		}

		function decodeString(string) {
			return decodeURIComponent(string);
		}

		function setPageTitle(pageTitleText, pageType) {
			switch (pageType) {
				case 'profile':

					break;
				case 'searchResultList':
					$(document).attr('title', pageTitleText);
					break;
			}
		}

		function numberWithDot(number) {

			var newNumber = parseInt(number).toLocaleString();

			if (newNumber.indexOf('.') == -1) {
				newNumber = newNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
			}
			return newNumber;
		}


		function addReviewDetails(fullRefId, section, value) {

			if (!fullRefId) return false;


			// get review details
			var reviewDetails = localStorageService.get('reviewDetails');
			if (!reviewDetails) {
				reviewDetails = {};
			} else {
				reviewDetails = JSON.parse(reviewDetails);
			}


			// add details
			if (!reviewDetails[fullRefId]) {
				reviewDetails[fullRefId] = {};
			}
			reviewDetails[fullRefId][section] = value;


			// check step-1 overall rating value
			tmpValue = '-';
			if (typeof reviewDetails[fullRefId][1] != 'undefined' && reviewDetails[fullRefId][1] != false &&
				typeof reviewDetails[fullRefId][2] != 'undefined' && reviewDetails[fullRefId][2] != false &&
				typeof reviewDetails[fullRefId][3] != 'undefined' && reviewDetails[fullRefId][3] != false &&
				typeof reviewDetails[fullRefId][4] != 'undefined' && reviewDetails[fullRefId][4] != false &&
				typeof reviewDetails[fullRefId][5] != 'undefined' && reviewDetails[fullRefId][5] != false) {
				// calculate rating

				var tmpValue = ((reviewDetails[fullRefId][1] + reviewDetails[fullRefId][2] + reviewDetails[fullRefId][3] + reviewDetails[fullRefId][4] + reviewDetails[fullRefId][5]) / 5);
				if (tmpValue && tmpValue >= 1) {
					tmpValue = ((Math.round(tmpValue * 10)) / 10).toFixed(1).toString().replace(/\./g, ',');
				} else {
					tmpValue = '-';
				}
			}
			reviewDetails[fullRefId]['step-1-rating'] = tmpValue;


			// add to cache
			localStorageService.set('reviewDetails', JSON.stringify(reviewDetails));


			return true;
		}


		function resetReviewDetails(fullRefId) {

			if (!fullRefId) return false;


			// get review details
			var reviewDetails = localStorageService.get('reviewDetails');
			if (!reviewDetails) {
				reviewDetails = {};
			} else {
				reviewDetails = JSON.parse(reviewDetails);
			}


			// reset current details
			if (!reviewDetails[fullRefId]) {
				reviewDetails[fullRefId] = {};
			}
			reviewDetails[fullRefId] = {};


			// add to cache
			localStorageService.set('reviewDetails', JSON.stringify(reviewDetails));


			return true;
		}


		function getReviewDetails(fullRefId) {

			if (typeof fullRefId == 'undefined') return false;


			// get review details
			var reviewDetails = localStorageService.get('reviewDetails');
			if (!reviewDetails) {
				reviewDetails = false;
			} else {
				reviewDetails = JSON.parse(reviewDetails);
				if (typeof reviewDetails[fullRefId] != 'object') {
					reviewDetails = false;
				} else {
					reviewDetails = reviewDetails[fullRefId];
				}
			}


			// return cache
			return reviewDetails;
		}


		function loadOptionalRatingDetails(profileDetails) {

			if (typeof profileDetails != 'object') return false;

			// set params
			var params = {
				aktion: 'kriterien',
				bewertungskriterien: profileDetails.kriterien_key,
				ref_id: profileDetails.ref_id
			};

			// set hash
			JamSyncService.ajax(CONFIG.apiUrl + '/_scripts/json-api.php', params).success(function(resultData) {

				if (resultData.data) {

					var data = resultData.data;
					profileDetails.optionalRatingDetails = data;
					addProfileToCache(profileDetails.ref_id + '_' + profileDetails.art, profileDetails);

					data = undefined;
					return profileDetails.optionalRatingDetails;
				}


			}).error(function(errorResponse) {

				if (errorResponse.code == 404 || errorResponse.code == '404') {
					pageNotFound();
				} else {
					showHashTimeout('', true, false, errorResponse.code);
				}

				return [];
			});
		}


		function isValidEmail(email) {

			var isValid = false;

			if (email.length > 7) {
				var filter = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
				if (filter.test(email)) {
					isValid = true;
				}
			}

			return isValid;
		}

		function isValidMobileNumber(telephone) {

			var isValid = false;

			if (telephone.length > 5) {
				var tmpTelefon = telephone.replace(/[^\+0-9]/g, "");
				var telefonCheck = tmpTelefon.match(/((^(\+|[0]{2})49)|(^01[5-7][0-9]))[0-9]+$/);
				if (telefonCheck) {
					isValid = true;
				}
			}

			return isValid;
		}


		/** getWeekNumber (ISO) */
		function getWeekNumber(d, two_digit) {

			var two_digit = two_digit || false;
			d = new Date(+d);
			d.setHours(0,0,0);
			d.setDate(d.getDate() + 4 - (d.getDay()||7));

			var yearStart = new Date(d.getFullYear(),0,1);
			var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)

			if ( two_digit===true && weekNo<10 ) {
				weekNo = '0'+weekNo;
			}
			return [d.getFullYear(), weekNo];
		}


		function getMonday(d) {

			d = new Date(d);
			var day = d.getDay(),
				diff = d.getDate() - day + (day == 0 ? -6:1);
			d.setDate(diff)
			return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
		}


		// Check if Element is inside Viewport
		function isScrolledIntoView(elem) {

			if (elem.length == 0) return 0;
			var docViewTop = $(window).scrollTop(),
				docViewBottom = docViewTop + $(window).height(),
				elemTop = elem.offset().top,
				elemBottom = elemTop + elem.height();

			return (((elemTop > docViewTop) && (elemTop < docViewBottom)) || ((elemBottom > docViewTop) && (elemBottom < docViewBottom)));
		}


		function addOtbDataToCache(otbData) {

			if (typeof otbData != 'object') return false;

			// add profile
			localStorageService.set('otbData', JSON.stringify(otbData));

			return true;
		}


		function getOtbDataFromCache(fullRefId) {

			if (typeof fullRefId == 'undefined') return false;


			// get profile cache
			var otbData = localStorageService.get('otbData');
			if (!otbData) {

				otbData = { fullRefId: fullRefId };

			} else {

				otbData = JSON.parse(otbData);

				if (typeof otbData != 'object' || otbData.fullRefId != fullRefId) {
					otbData = { fullRefId: fullRefId };
				}
			}

			// return cache
			return otbData;
		}

		function getCanvasIcon(glyph, color, size, shadow, topDefault) {

			var canvas, ctx, scaleFactor, paddingTop = 10;

			size = size || 20;
			if (typeof shadow =='undefined') shadow = true;

			canvas = document.createElement('canvas');
			canvas.width = canvas.height = size;
			ctx = canvas.getContext('2d');

			scaleFactor = backingScale(ctx);

			if (scaleFactor > 1) {

				canvas.width = canvas.width * scaleFactor;
				canvas.height = canvas.height * scaleFactor;

				// update the context for the new canvas scale
				ctx = canvas.getContext("2d");

				if (typeof topDefault == 'undefined' || !topDefault) paddingTop = 24;
			}

			if (color) {
				ctx.fillStyle  = color;
			}

			// Text Shadow
			if (shadow) {

				ctx.shadowColor = '#999'
				ctx.shadowOffsetX = 2;
				ctx.shadowOffsetY = 2;
				ctx.shadowBlur = 2;
			}

			//ctx.textAlign = "center";

			// Font Styles
			ctx.font = size+'px Ionicons';
			ctx.fillText(glyph, 3, size-paddingTop);

			return (canvas.toDataURL());
		}


		/**
		 * Backing Scale
		 * get current scaleFactor of screen
		 *
		 * @param context
		 * @returns {integer}
		 */
		function backingScale(context) {
			if ('devicePixelRatio' in window) {
				if (window.devicePixelRatio > 1) {
					return window.devicePixelRatio;
				}
			}
			return 1;
		}


		function setCityImage(cityData) {

			// get side menu
			var sideMenu = $('.city-bg');


			// get current city
			var curCity = false;
			if (typeof cityData == 'object' && cityData.suche && cityData.suche.geo && cityData.suche.geo.stadt) {
				// found a city
				curCity = cityData.suche.geo.stadt;
			} else if (typeof cityData == 'string') {
				curCity = cityData;
			}

			// prepare city string
			if (typeof curCity == 'string' && curCity !== false) {
				curCity = decodeURIComponent(curCity).toLowerCase();
				curCity = curCity.replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/\s/g,"-");
			}


			// check city
			if (CONFIG.jamCities.indexOf(curCity) !== -1 && curCity != false && curCity != 'false') {
				// add image

				var isLoaded = false,
					imgPath = '../',
					timer = 8000;
				if (CONFIG.environment == 'app') {

					imgPath = '';
					timer = 1000;
				}

				if (JamHelperFactory.pageLoaded) {

					isLoaded = true;
					sideMenu.css({'background-image':'url(' + imgPath + 'img/cities/' + curCity +'.jpg)'});
					//sideMenu = curCity = null;
				} else {

					var updateImage = angular.element($window).bind('load', function() {
						JamHelperFactory.pageLoaded = true;

						isLoaded = true;

						sideMenu.css({'background-image':'url(' + imgPath + 'img/cities/' + curCity +'.jpg)'});
						updateImage.unbind('load');
						//sideMenu = curCity = null;
					});
				}

				$timeout(function() {

					if (!isLoaded) {
						sideMenu.css({'background-image':'url(' + imgPath + 'img/cities/' + curCity +'.jpg)'});
					}
				},timer);

			} else {
				// remove city image
				sideMenu.css({'background-image':'none'});
				sideMenu = curCity = null;
			}

			// ciao
			return true;
		}


		/**
		 *
		 * @param {string} type 				use 'burger' to show the burger menu, use 'back' to show a customizable back button
		 * @param {object} params				title: mandatory! title of the back button, url: (optional) back button target url
		 * 									-> if no url is set history.back() is used
		 * @returns {boolean}
		 */
		function setBackButton(type, params, refId) {

			// params optional
			params = params || {};
			refId = refId || false;

			var navBar = angular.element('.nav-bar-block[nav-bar="active"]');

			// navbar-element not found?
			if (navBar.length == 0) {
				navBar = angular.element('.nav-bar-block[nav-bar="staged"]');
				if (navBar.length == 0) {
					navBar = angular.element('.nav-bar-block[nav-bar="entering"]');
				}
			}

			var buttonsContainer = navBar.find('span.left-buttons'),
				burgerButton = buttonsContainer.find('button[menu-toggle="left"]'),
				customButton = buttonsContainer.find('.jam-custom-back-button');

			switch (type) {
				case 'burger':

					// hide custom button and show burger menu
					customButton.addClass('hide');
					burgerButton.removeClass('hide');
					break;

				case 'back':

					// check params
					if (!(params !== false && typeof params == 'object')) return false;

					// hide burger menu
					burgerButton.addClass('hide');

					// check if it's a profile back button which is already set
					var currentStateName = $ionicHistory.currentStateName();
					if (currentStateName == 'profile') {

						// get from back button cache?
						if (refId !== false) {

							var profileBackParams = getFromCache('profileBackParams');
							if (!profileBackParams || typeof profileBackParams[refId] == 'undefined') {

								// add to cache
								if (!profileBackParams) profileBackParams = {};
								profileBackParams[refId] = params;

								setIntoCache('profileBackParams', profileBackParams);

							} else {

								// use cache values?
								if (params.resetCache) {
									profileBackParams[refId] = params;
								} else {
									params = profileBackParams[refId];
								}
							}
						}
					}

					// set title
					if (params == null) params = {};
					params.title = params.title || '';
					customButton.html(params.title);

					// go back in view or to specific url?
					if (params.url && params.url != '') {
						// go to specific url
						customButton.attr('href', CONFIG.urlPrefix + params.url);
					} else {
						// go back in history
						customButton.attr('href', 'javascript: window.history.back()');
					}

					// show custom button
					customButton.removeClass('hide');
					customButton = params = currentStateName = undefined;
					break;
			}
			return true;
		}


		function resetBackButton() {

			// get elements
			var navBar = $('.nav-bar-block[nav-bar="active"]');
			if (navBar.length == 0) {
				navBar = $('.nav-bar-block[nav-bar="staged"]');
				if (navBar.length == 0) {
					navBar = $('.nav-bar-block[nav-bar="entering"]');
				}
			}

			var buttonsContainer = navBar.find('span.left-buttons'),
				burgerButton = buttonsContainer.find('button[menu-toggle="left"]'),
				customButton = buttonsContainer.find('.jam-custom-back-button');

			// hide burger menu
			burgerButton.addClass('hide');

			// hide custom button
			customButton.addClass('hide');

			return true;
		}


		function goToReview(event, profileData, source) {

			event.stopPropagation();

			// GATRACKING
			switch (source) {
				// mini profile clicks
				//case 'miniprofile-review':
					//AnalyticsHelper.trackEvent('Anrufen geklickt', 'Miniprofil - Bewertungsabgabe');
					//break;
				case 'miniprofile-premium-contents':
					AnalyticsHelper.trackEvent('Bewerten geklickt', 'Miniprofil - Premium Contents');
					break;
				case 'miniprofile-profile-subs':
					AnalyticsHelper.trackEvent('Bewerten geklickt', 'Miniprofil - Subs');
					break;
				case 'miniprofile-profile-evaluates':
					AnalyticsHelper.trackEvent('Bewerten geklickt', 'Miniprofil - Bewertungen');
					break;
			}

			var params = {
				state: 'review',
				stateGoParams: {
					path: 'profil',
					curStepId: 'schritt-1',
					fullRefId: profileData.ref_id + '_' + profileData.art
				},
				data: profileData.reviewLink
			};
			goToProfileUrl(params);

			return false;
		}

		/**
		 * Gehe zur externen Seite
		 *
		 * @param url
		 * @param onlyApp
		 * @param stopEvent
		 * @returns {boolean}
		 */
		function goToExternal(url, onlyApp, stopEvent) {

			onlyApp = onlyApp || false;
			stopEvent = stopEvent || false;

			if ((onlyApp && CONFIG.environment != 'app') || url == '') {
				return false;
			}

			if (event && stopEvent) {
				event.preventDefault();
				event.stopPropagation();
			}
			$window.open(url, CONFIG.urlTarget, (CONFIG.environment == 'app' ? '?location=yes' : ''));
		}


		/**
		 * TrackAction
		 *
		 * @param id (fullrefid)
		 * @param action
		 * @param trackingParams
		 * @returns {boolean}
		 */
		function trackAction(id, action, trackingParams) {

			var url = CONFIG.apiUrl+'/_scripts/json-api.php',
				ajaxParams;

			id = id || 0;
			action = action || '';
			trackingParams = trackingParams || [];

			// Breche ab falls keine eindeutigen ID oder keine Aktion übergeben
			if (id == 0 || action == '') return false;

			ajaxParams = {
				aktion: 'countstats',
				stat: action,
				id: id
			};

			// Führe die Aktion durch (jsonp)
			JamSyncService.ajax(url, ajaxParams);
			url = ajaxParams = undefined;

			// Track Events
			if (trackingParams.length > 0) {

				switch (trackingParams.length) {
					case 1:
						AnalyticsHelper.trackEvent(trackingParams[0]);
						break;
					case 2:
						AnalyticsHelper.trackEvent(trackingParams[0], trackingParams[1]);
						break;
					case 3:
						AnalyticsHelper.trackEvent(trackingParams[0], trackingParams[1], trackingParams[2]);
						break;
				}
			}
			return true;
		}


		function doAnrufen(event, params, source) {

			event.stopPropagation();

			var fullRefId,
				trackingParams;

			// GATRACKING
			switch (source) {
				case 'profile-number':
					trackingParams = ['Anrufen geklickt', 'Profil', 'Nummer'];
					break;
				case 'profile-button':
					trackingParams = ['Anrufen geklickt', 'Profil', 'Button'];
					break;
				case 'profile-tpf-button':
					trackingParams = ['Anrufen geklickt', 'Profil TPF', 'Button'];
					break;
				case 'profile-tpf-number':
					trackingParams = ['Anrufen geklickt', 'Profil TPF', 'Nummer'];
					break;
				case 'favourites':
					trackingParams = ['Anrufen geklickt', 'Gemerkte Ärzte'];
					break;
				case 'resultlist-tpf-number':
					trackingParams = ['Anrufen geklickt', 'Ergebnisliste TPF', 'Nummer'];
					break;
				case 'resultlist-tpf-button':
					trackingParams = ['Anrufen geklickt', 'Ergebnisliste TPF', 'Button'];
					break;
				case 'miniprofile-premium-contents':
					trackingParams = ['Anrufen geklickt', 'Miniprofil - Premium Contents'];
					break;
				case 'miniprofile-profile-subs':
					trackingParams = ['Anrufen geklickt', 'Miniprofil - Subs'];
					break;
				case 'miniprofile-profile-evaluates':
					trackingParams = ['Anrufen geklickt', 'Miniprofil - Bewertungen'];
					break;
			}

			// Setze die richtige Ref_id
			if (params.fullRefId) {
				fullRefId = params.fullRefId;
			} else {
				fullRefId = params.ref_id + '_' + params.art;
			}

			// Tracke Aktion (zähle die Statistik hoch)
			trackAction(fullRefId, (CONFIG.environment == 'app') ? 'tel_anrufe_app' : 'tel_anrufe_mobi', trackingParams);
			trackingParams = fullRefId = params = undefined;
			// done
			return true;
		}


		function trackUrlKlick(params) {

			var fullRefId;

			// set ref id
			if (params.fullRefId) {
				fullRefId = params.fullRefId;
			} else {
				fullRefId = params.ref_id + '_' + params.art;
			}

			// Tracke klick auf URL
			return trackAction(fullRefId, 'url_klicks_mobi');
		}


		function trackMapKlick(params) {

			var fullRefId;

			// set ref id
			if (params.fullRefId) {
				fullRefId = params.fullRefId;
			} else {
				fullRefId = params.ref_id + '_' + params.art;
			}

			// Tracke klick auf URL
			return trackAction(fullRefId, 'karten_klicks_mobi');
		}


		/**
		 * Fügt Inhalt in den lokalen Cache
		 * @param url
		 * @param content
		 * @param cacheKey
		 * @returns {boolean}
		 */
		function addContentToCache(url, content, cacheKey) {

			if (url == null || !localStorageSupport()) return false;

			var cache = getFromCache(cacheKey, CONFIG.storageTimeout.expertArticles);

			// clear articleCache, if it is currently not set, or we want to refresh it
			if (!cache) cache = {};

			cache[url] = content;

			return setIntoCache(cacheKey, cache);
		}

		function removeContentFromCache(cacheKey) {
			if (!localStorageSupport()) return false;

			clearLocalStorageKey(cacheKey);
		}


		/**
		 * Holt den Inhalt eines angegebenen Cache-Keys aus dem lokalen Cache
		 * @param url
		 * @param cacheKey
		 * @returns {*|string}
		 */
		function getContentFromCache(url, cacheKey) {

			if (url == null || !localStorageSupport()) return false;

			// Get profileData from cache (localStorage)
			var contentFromCache = getFromCache(cacheKey, CONFIG.storageTimeout.categoryArticles);

			if (!contentFromCache || typeof contentFromCache[url] != 'object') return false;

			if (contentFromCache[url]) contentFromCache = contentFromCache[url];

			return contentFromCache;
		}

		/**
		 * Fürs Profil: setzt die "lange" Url und ruft sie auf
		 * @param params (Object)
		 */
		function goToProfileUrl(params) {
			if (typeof params.data == 'undefined' && ((typeof params.data.url == 'undefined' && typeof params.data.url_hinten == 'undefined') || typeof params.data.autor_url == 'undefined')) return false;

			$timeout(function() {
				var url = '';

				if (typeof params.data.url != 'undefined' && typeof params.data.url_hinten != 'undefined') {
					url = params.data.url + 'uebersicht/' + params.data.url_hinten;
				} else if (typeof params.data.autor_url != 'undefined') {
					url = params.data.autor_url;
				} else if (angular.isString(params.data)) {
					url = params.data;
				}

				if (CONFIG.environment == 'app') {
					$state.go(params.state, params.stateGoParams);
				} else {
					$location.url(url);
				}

				url = undefined;
			}, 10);
		}

	}
})();