(function () {
	'use strict';

	angular
		.module('app.searchByName')
		.controller('SearchByName', SearchByName);

	SearchByName.$inject = ['$scope', '$ionicConfig', '$ionicNavBarDelegate', 'SuggestFactory', '$state', '$stateParams', 'CONFIG', 'JamHelperFactory', 'AnalyticsHelper', 'LoaderFactory', 'OrientationchangeFactory', '$timeout', 'CacheFactory'];

	function SearchByName($scope, $ionicConfig, $ionicNavBarDelegate, SuggestFactory, $state, $stateParams, CONFIG, JamHelperFactory, AnalyticsHelper, LoaderFactory, OrientationchangeFactory, $timeout, CacheFactory) {
		/* jshint validthis: true */

		/* ViewModel */
		var vm = this;

		// set back-button
		$ionicConfig.backButton.text("Suche");

		vm.searchInput = {
			what: '',
			where: '',
			dist: 5,
			results: []
		};
		vm.searchInputTemp = {
			what: '',
			where: ''
		};
		vm.showWhatInputField = true;
		vm.showWhatSuggest = false;
		vm.showWhatCancel = false;

		vm.showWhereInputField = true;
		vm.showWhereSuggest = false;
		vm.showWhereCancel = false;

		vm.controlInputFieldPosition = controlInputFieldPosition; // Steuert das Ein- und Ausblenden

		vm.setChosenSuggestItem = setChosenSuggestItem;
		vm.getSuggestData = getSuggestData;
		vm.clearSearch = clearSearch;
		vm.search = search;
		vm.searchParamsObject = {};

		// wenn iOs-App dann wird eine extra iOS-Css-Klasse benötigt im bar-header
		vm.isIosApp = (CONFIG.environment == 'app' && CONFIG.deviceOs == 'iOS') ? true : false;
		vm.urlPrefix = CONFIG.urlPrefix;

		vm.isTablet = (CONFIG.deviceType == 'tablet') ? true : false;
		vm.hideNavBar = (CONFIG.deviceOrientation == 'landscape' && vm.isTablet) ? true : false;
		vm.removeFocusFromInput = removeFocusFromInput;
		vm.checkKey= checkKey;
		vm.bestMatchSuggest = {};
		vm.clearTextInput = clearTextInput;
		vm.lastSearchPersonSuggest = false;

		////////////

		$scope.$on('$ionicView.afterEnter', function() {

			// set last search object
			CacheFactory.getFromCache('searchCache').then(function(searchCache) {
				vm.lastSearchPersonSuggest = CacheFactory.lastSearchPersonSuggest(searchCache);
			}, function() {
				// empty cache
				vm.lastSearchPersonSuggest = false;
			});

			LoaderFactory.hideLoader();


			// add event listener
			OrientationchangeFactory.initListener();


			// set back button
			window.setTimeout(function() {
				JamHelperFactory.setBackButton('burger');
			}, CONFIG.backButtonDelay);

			// GATRACKING
			AnalyticsHelper.trackPageview('/namenssuche/');


			// set canonical
			JamHelperFactory.setCanonical('https://www.jameda.de/empfehlen/', true);


			// reset back button cache
			JamHelperFactory.setIntoCache('profileBackParams', {});
		});


		$scope.$on('$ionicView.beforeLeave', function() {
			JamHelperFactory.resetBackButton();
		});


		function checkKey(type) {
			// Keyboard wurde gedrückt (13 = Enter, 27 = Escape)
			if (event.keyCode == 13 || event.keyCode == 27) {

				hideKeyboard();

				if (type == 'what') {
					vm.setChosenSuggestItem({
						searchType: vm.bestMatchSuggest.searchType,
						inputItem: vm.bestMatchSuggest.was,
						selectedItem: vm.bestMatchSuggest.was,
						gruppe_fach_param: vm.bestMatchSuggest.gruppe_fach_param,
						was_sel: vm.bestMatchSuggest.was_sel
					});
				}
			}
		}

		function setBestMatchSuggest(type, data, input) {
			vm.bestMatchSuggest = {};

			if (type == 'what') {
				if (data && typeof data[0] !== 'undefined') {
					// Best Matches finden
					vm.bestMatchSuggest.searchType = 'what';
					vm.bestMatchSuggest.was_sel = 1;

					if (data[0].header == 'Fachbereiche') {
						vm.bestMatchSuggest.was = data[0].list[0].term;
						vm.bestMatchSuggest.gruppe_fach_param = data[0].list[0].select;
					} else if (data[0].header == 'Namen') {
						vm.bestMatchSuggest.was = input.what;
						vm.bestMatchSuggest.namen = input.what;
					}
				}

				if ((typeof data === 'undefined' || data == '') && input != '') {
					vm.bestMatchSuggest.searchType = 'what';
					vm.bestMatchSuggest.was = input.what;
					vm.bestMatchSuggest.namen = input.what;
					vm.bestMatchSuggest.was_sel = 1;
				}
			}
		}

		function removeFocusFromInput() {
			hideKeyboard();
			// Höhe für scrollbaren Bereich für den Suggest setzen
			setScrollHeight();
		}

		function hideKeyboard() {
			ionic.DomUtil.blurAll();
		}

		function clearTextInput() {
			// letzte Eingabe temporär zwischenspeichern
			vm.searchInputTemp.what = vm.searchInput.what;
			// Eingabe löschen
			vm.searchInput.what = "";
		}

		function setScrollHeight() {

			$timeout(function () {

				var suggestScrollArea = $('ion-nav-view[name="menuContent"] ion-view[nav-view="active"] #suggest-scroll-area');

				// Only on android tablets
				if (vm.isTablet && vm.deviceOs == 'Android') {

					var tmpHeight = $('ion-view[nav-view="active"] .jam-suggest-box-tablet').height();

					if (tmpHeight > CONFIG.windowHeight) {
						suggestScrollArea.height(CONFIG.windowHeight - 75);
					} else {
						suggestScrollArea.height(CONFIG.windowHeight - 124);
					}

				} else {
					if (vm.isTablet) {
						suggestScrollArea.height(CONFIG.windowHeight - 124);
					} else {
						suggestScrollArea.height(CONFIG.windowHeight - 75);
					}
				}

			}, 100);
		}

		function controlInputFieldPosition(type) {
			/* */
			if(type == 'what') {

				// GATRACKING
				if (vm.showWhereInputField) {
					AnalyticsHelper.trackEvent('Namenssuche - Klicks', 'Was Wen Suchleiste geklickt');
				}

				$ionicNavBarDelegate.showBar(false);

				// zeige Was-Input
				vm.showWhatInputField = true;
				vm.showWhatSuggest = true;

				/// verstecke Wo-Input
				vm.showWhereInputField = false;
				vm.showWhereSuggest = false;

				// zeige Abbrechen Button
				vm.showWhatCancel = true;

				// letzte Eingabe temporär zwischenspeichern
				vm.searchInputTemp.what = vm.searchInput.what;

				// Suggest-Daten holen mit Eingabe
				if(vm.searchInputTemp.what) {
					vm.getSuggestData(type);
				}

				// Höhe für scrollbaren Bereich für den Suggest setzen
				setScrollHeight();
			}

			if(type == 'cancelWhat' || type == 'cancelWhere') {

				if (CONFIG.deviceType == 'phone' || CONFIG.deviceOrientation != 'landscape') {
					$ionicNavBarDelegate.showBar(true);
				}

				// zeige Wo-Input
				vm.showWhereInputField = true;
				vm.showWhereSuggest = false;

				// zeige Was-Input
				vm.showWhatInputField = true;
				vm.showWhatSuggest = false;

				// verstecke Abbrechen Buttons
				vm.showWhatCancel = false;
				vm.showWhereCancel = false;

				// Immer dann wenn die Eingabe sich verändert hat
				// und auf Abbrechen geklickt,
				// erste Eingabe zurück schreiben

				if(type == 'cancelWhat') {
					if(vm.searchInput.what != vm.searchInputTemp.what) {
						vm.searchInput.what = vm.searchInputTemp.what;
					}
				}

				if(type == 'cancelWhere') {
					if(vm.searchInput.where != vm.searchInputTemp.where) {
						vm.searchInput.where = vm.searchInputTemp.where;
					}
				}
			}

			if(type == 'all') {
				$ionicNavBarDelegate.showBar(true);

				// zeige Wo-Input
				vm.showWhereInputField = true;
				vm.showWhereSuggest = false;

				// zeige Was-Input
				vm.showWhatInputField = true;
				vm.showWhatSuggest = false;

				// verstecke Abbrechen Buttons
				vm.showWhatCancel = false;
				vm.showWhereCancel = false;
			}
		}

		function setSearchParamsObject(params) {
			// Suche über Was / Wen
			if (params.searchType == "what") {
				vm.searchParamsObject.was = params.selectedItem;
				vm.searchParamsObject.was_i = params.inputItem;
				vm.searchParamsObject.was_sel = (typeof params.was_sel !== 'undefined' && params.was_sel) ? params.was_sel : 0;

				if (typeof params.gruppe_fach_param != 'undefined') {

					var params = params.gruppe_fach_param.split("&");
					for (var i=0; i<params.length; i++) {
						var pair = params[i].split("=");
						vm.searchParamsObject[pair[0]] = pair[1];
					}

					vm.searchParamsObject.namen = '';
				} else if (typeof params.selectedItem != 'undefined' && typeof params.deeplink == 'undefined') {
					vm.searchParamsObject.namen = params.selectedItem;
					vm.searchParamsObject.gruppe_fach_param = '';
				} else if (typeof params.deeplink != 'undefined' && params.deeplink != '' && typeof params.selectedItem != 'undefined') {
					var customerId = JamHelperFactory.strReplace('/profil/', '', params.deeplink);
					customerId = JamHelperFactory.strReplace('?beta=1', '', customerId);
					var customerIdClean = customerId.split("_")[0];

					if (typeof params.multi !== 'undefined' && params.multi.length > 1) {
						// mehrere Standorte, direkt auf die Auswahlseite leiten
						$state.go('searchResultListSub', {
							refId: customerIdClean,
							isSearch: true
						});
					} else {
						// direkt auf das Profil leiten, Beispiel: /profil/uebersicht/45897203100_2/
						$state.go('profile', {
							fullRefId: customerId,
							path: 'profil',
							backLinkType: 'deeplink',
							isSearch: true
						});
					}
				}
			}

			// Personen-Suche aus dem Cache aufrufen
			if (params.searchType == "personSearchFromCache") {

				// Profil
				if (typeof params.objFromCache.what_name_nice.refId !== 'undefined' && params.objFromCache.what_name_nice.refId != '') {
					// direkt auf das Profil leiten
					$state.go('profile', {
						fullRefId: params.objFromCache.what_name_nice.refId,
						path: 'profil',
						backLinkType: 'deeplink',
						isSearch: true
					});
				}
			}
		}

		function setChosenSuggestItem(params) {

			// GATRACKING
			AnalyticsHelper.trackEvent('Namenssuche - Klicks', 'Namenssuggest geklickt');


			/* */
			setSearchParamsObject(params);

			if(params.searchType == 'what') {
				vm.searchInput.what = params.selectedItem;
			}

			if(params.searchType == 'where') {
				vm.searchInput.where = params.selectedItem;
			}

			// zeige alles
			controlInputFieldPosition('all');
		}

		function getSuggestData(type) {
			/* */

			// hole Daten für Suggest
			SuggestFactory.getSuggestDataByName(vm.searchInput).then(
				function(data) {

					data = data.data;
					setBestMatchSuggest(type, data.suggests, vm.searchInput);
					vm.searchInput.results = data.suggests;

					setScrollHeight();
				}
			);

			// zeige Was-Suggest
			if(type == 'what') {
				vm.showWhatSuggest = true;
				vm.showWhereSuggest = false;
			}

			// zeige Wo-Suggest
			if(type == 'where') {
				vm.showWhatSuggest = false;
				vm.showWhereSuggest = true;
			}
		}

		function clearSearch(type) {
			/* */
			if(type == 'cancelWhat') {
				vm.searchInput.what = '';
			}

			if(type == 'cancelWhere') {
				vm.searchInput.where = '';
			}
		}

		function search() {
			$state.go('searchResultList', vm.searchParamsObject);
		}

		activate();

		$scope.$on('$ionicView.enter', function() {
			activateViewToForeground();
		});

		function activate() {
			// Aufruf aus dem Fachgebiete-Verzeichnis
			if($stateParams.what) {
				var params = {
					searchType: 'what',
					selectedItem: $stateParams.what,
					gruppe_fach_param: $stateParams.gruppe_fach_param
				};
				vm.setChosenSuggestItem(params);
			}
		}

		function activateViewToForeground() {
			//  Run code for when the view comes into foreground
			//  On initial launch this function fires prior to activate()
		}
	}
})();