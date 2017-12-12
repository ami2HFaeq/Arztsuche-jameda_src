(function () {

	'use strict';

	angular
		.module('app.premiumContents')
		.controller('PremiumContents', PremiumContents);

	PremiumContents.$inject = ['$scope', '$stateParams', '$ionicNavBarDelegate', 'CONFIG', 'JamHelperFactory', '$sce', 'AnalyticsHelper', 'LoaderFactory', 'OrientationchangeFactory', '$ionicModal', '$ionicSlideBoxDelegate', '$timeout', '$ionicHistory', 'JamSyncService'];

	function PremiumContents($scope, $stateParams, $ionicNavBarDelegate, CONFIG, JamHelperFactory, $sce, AnalyticsHelper, LoaderFactory, OrientationchangeFactory, $ionicModal, $ionicSlideBoxDelegate, $timeout, $ionicHistory, JamSyncService) {

		// set helper
		$scope.JamHelperFactory = JamHelperFactory;

		// show nav bar
		$ionicNavBarDelegate.showBar(true);

		// set config??
		$scope.config = CONFIG;

		// set current section id
		$scope.sectionId = $stateParams.sectionId;

		// page title
		$scope.pageTitle = 'jameda - Zusatzinformationen';


		// gallery data
		$scope.galleryImages = [];
		$scope.galleryIndexBig = 0;
		$scope.galleryIndexSmall = 0;
		$scope.bigGalleryDiff = 0;
		$scope.showBigGallery = (CONFIG.deviceOs == 'Android' && CONFIG.deviceBrowser != 'chrome') ? false : true;
		$scope.slideChangeCounter = 1;


		// prepare apiUrl
		var profileDetails, apiUrl = false, currentUrl = $ionicHistory.currentView().url;
		if (currentUrl.indexOf('/profil/') == 0) {
			// use short profile url
			apiUrl = '/profil/' + $stateParams.fullRefId + '/';

		} else {
			// use full profile url

			var curPos = currentUrl.indexOf('/' + $stateParams.sectionId + '/');
			if (curPos > 0) {
				apiUrl = currentUrl.substring(0, curPos) + '/uebersicht/' + $stateParams.fullRefId + '/';
			}

			if (apiUrl === false) {
				// use short profile url
				apiUrl = '/profil/' + $stateParams.fullRefId + '/';
			}
		}

		JamHelperFactory.getProfile($stateParams.fullRefId, apiUrl).success(function(data) {

			profileDetails = data;

			// set canonical
			JamHelperFactory.setCanonical('https://www.jameda.de' + profileDetails.url + $stateParams.sectionId + '/info/' + profileDetails.url_hinten, true);

			// image gallery
			if (profileDetails.bilder) {
				Object.keys(profileDetails.bilder).sort().forEach(function(key) {
					var curImage = profileDetails.bilder[key];
					$scope.galleryImages.push(curImage);
				});
			}


			if (profileDetails.bilder || profileDetails.hasProfileImage) {
				loadGalleryTemplate();
			}

			$scope.slideChangeCounter = 1;

			// add premium contents to profile details
			addPremiumContents(profileDetails, $scope.sectionId);

			// REST-458
			if (typeof profileDetails != 'undefined' && typeof profileDetails.testUser != 'undefined') {
				AnalyticsHelper.setCustomVar({index: 11, name: 'REST-457', value: profileDetails.testUser, opt_scope: 3});
			}

			if (typeof profileDetails != 'undefined' && typeof profileDetails.ref_id != 'undefined') {
				AnalyticsHelper.setCustomVar({index: 10, name: profileDetails.ref_id, value: '0', opt_scope: 3});
			}

			// GATRACKING
			AnalyticsHelper.trackPageview('/profil/premium-contents/' + $stateParams.sectionId + '/');

			LoaderFactory.hideLoader(600);
		});


		$scope.$on('$ionicView.beforeEnter', function() {
			LoaderFactory.showLoader(2,'','',true);
		});


		$scope.$on('$ionicView.afterEnter', function() {

			// add event listener
			OrientationchangeFactory.initListener();

			// set Back Button
			var buttonParams = {
				title: 'Profil',
				url: '/profil/uebersicht/' + $stateParams.fullRefId + '/'
			};

			$timeout(function() {
				JamHelperFactory.setBackButton('back', buttonParams);
			}, CONFIG.backButtonDelay);


			// agof tracking
			if (typeof iom != "undefined") {
				var iam_data = {"st":"mobjamed", "cp":"10141", "sv":"mo", "co":"kommentar"};
				iom.h(iam_data,1);
			}

			LoaderFactory.hideLoader(600);
		});


		$scope.$on('$ionicView.beforeLeave', function() {
			JamHelperFactory.resetBackButton();
			AnalyticsHelper.deleteCustomVar(10);
			AnalyticsHelper.deleteCustomVar(11);
		});


		function addPremiumContents(profileDetails, sectionId) {

			if (typeof profileDetails == 'undefined' || typeof sectionId == 'undefined') return false;

			// check cache
			if (!(profileDetails.premiumContents && typeof profileDetails.premiumContents[sectionId] == 'object')) {

				var url = CONFIG.apiUrl + profileDetails.url + sectionId + '/info/' + profileDetails.url_hinten;

				JamSyncService.ajax(url).success(function(resultData) {

					if (!profileDetails.premiumContents) profileDetails.premiumContents = {};

					var data = resultData.data;

					profileDetails.premiumContents[sectionId] = {
						content: data.content,
						styles: data.styles,
						meta: data.meta
					};

					JamHelperFactory.addProfileToCache(profileDetails.ref_id + '_' + profileDetails.art, profileDetails, true);

					// add data to current view
					$scope.data = profileDetails;
					$scope.data.currentPremiumContents = profileDetails.premiumContents[sectionId];

					// Setze Meta-Informationen
					JamHelperFactory.setMetaData(profileDetails.premiumContents[sectionId].meta);

					// set height
					$timeout(function() {
						setScrollHeights(profileDetails);

						$('a[target="_blank"]').click(function () {
							var url = $(this).attr('href');
							window.open(encodeURI(url), '_system', 'location=yes');
							return false;
						});
					}, 300);

				}).error(function (errorResponse) {

					LoaderFactory.hideLoader(0, true);

					if (errorResponse.code === 404 || errorResponse.code == '404') {
						JamHelperFactory.pageNotFound();
					}
				});

			} else {

				// add data to current view
				$scope.data = profileDetails;
				$scope.data.currentPremiumContents = profileDetails.premiumContents[sectionId];

				// Setze Meta-Informationen
				JamHelperFactory.setMetaData(profileDetails.premiumContents[sectionId].meta);

				// set height
				$timeout(function() {
					setScrollHeights(profileDetails);

					$('a[target="_blank"]').click(function () {
				     var url = $(this).attr('href');
				     window.open(encodeURI(url), '_system', 'location=yes');
				     return false;
				   });
				}, 300);
			}
		}


		function setScrollHeights(profileDetails) {

			// add height on tablets
			var tabletExtraHeight = 0;
			if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') {
				tabletExtraHeight = 60;
			}

			// app?
			if (CONFIG.environment == 'app') {
				tabletExtraHeight += 40;
			}

			// set height
			var miniProfileHeight = $('#premium-contents-' + profileDetails.ref_id + '_' + profileDetails.art + ' .mini-profile').height() + tabletExtraHeight;
			$('#premium-contents-' + profileDetails.ref_id + '_' + profileDetails.art + ' .jam-premium-contents').height((CONFIG.contentHeight - miniProfileHeight) + 'px');

			if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') {
				$('#premium-contents-' + profileDetails.ref_id + '_' + profileDetails.art + ' .jam-premium-contents-navi').height((CONFIG.contentHeight - miniProfileHeight + tabletExtraHeight) + 'px');
			}
		}


		$scope.trustAsHtml = function(string) {
			return $sce.trustAsHtml(string);
		};


		$scope.showPremiumContent = function(profileDetails, sectionId) {

			addPremiumContents(profileDetails, sectionId);

			$scope.sectionId = sectionId;
		};


		// gallery
		function loadGalleryTemplate() {

			$ionicModal.fromTemplateUrl('app/premiumContents/pc-gallery.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.galleryBigModal = modal;
			});

		}



		$scope.openModal = function() {

			// do not open on android and internet
			if (!$scope.showBigGallery) return false;


			// GATRACKING
			AnalyticsHelper.trackEvent('Premium Contents - Klicks', 'Praxisbild geklickt');


			// show big gallery
			$scope.galleryBigModal.show();


			// slide big gallery to current image
			var tryAgain = false;
			try {
				$ionicSlideBoxDelegate.$getByHandle('profile-gallery-big').slide($scope.galleryIndexBig);
			} catch (e) {
				//console.log(e);
				tryAgain = true;
			}


			// beim ersten klick funktioniert "slide" nicht, da der modal window nicht nicht existiert
			if (tryAgain) {
				$timeout(function() {
					try {
						$ionicSlideBoxDelegate.$getByHandle('profile-gallery-big').slide($scope.galleryIndexBig);
					} catch (e) {
						//console.log(e);
					}
				}, 300);
			}
		};


		$scope.closeModal = function() {

			// hide big gallery
			if ($scope.galleryBigModal) {
				$scope.galleryBigModal.hide();
			}
		};


		$scope.slideChanged = function(type) {

			// set gallery diff
			$scope.bigGalleryDiff = ($scope.data.hasProfileImage) ? 1 : 0;

			// set current gallery index
			if (type == 'small') {
				$scope.galleryIndexSmall = $ionicSlideBoxDelegate.$getByHandle('profile-gallery-small').currentIndex();
				$scope.galleryIndexBig = $scope.galleryIndexSmall + $scope.bigGalleryDiff;

				// GATRACKING
				AnalyticsHelper.trackEvent('Premium Contents - Klicks', 'Praxisbilder geswiped', $scope.slideChangeCounter + 'mal');
				$scope.slideChangeCounter++;

			} else {
				$scope.galleryIndexBig = $ionicSlideBoxDelegate.$getByHandle('profile-gallery-big').currentIndex();
				$scope.galleryIndexSmall = ($scope.galleryIndexBig > 0) ? $scope.galleryIndexBig - $scope.bigGalleryDiff : 0;

				// slide small gallery to current image
				$scope.galleryIndexSmall = $ionicSlideBoxDelegate.$getByHandle('profile-gallery-small').slide($scope.galleryIndexSmall);
			}
		};


		// Cleanup the modal when we're done with it!
		$scope.$on('$destroy', function() {
			if ($scope.modal) $scope.modal.remove();
		});
	}
})();