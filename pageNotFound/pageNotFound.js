(function () {
	'use strict';

	angular
		.module('app.pageNotFound')
		.controller('PageNotFound', PageNotFound);

	PageNotFound.$inject = ['$scope', '$timeout','JamHelperFactory', 'CONFIG', '$state', 'LoaderFactory','$ionicHistory', '$ionicSideMenuDelegate'];

	function PageNotFound($scope, $timeout, JamHelperFactory, CONFIG, $state, LoaderFactory, $ionicHistory, $ionicSideMenuDelegate) {

		/* View Model */
		var vm = this;
		vm.pageTitle = 'Fehler 404';
		vm.isTablet = (CONFIG.deviceType == 'tablet') ? true : false;

		vm.image = 'img/404.jpg';
		vm.headline = 'Fehler <strong>404</strong>';
		vm.message = 'Wir bitten um Entschuldigung.<br>Leider können wir Sie auf dieser Seite nicht verarzten, da es die Seite bei uns leider nicht (mehr) gibt.';
		vm.showButton = true;

		$scope.config = CONFIG;



		vm.activate = activate;
		vm.goToHome = goToHome;
		vm.showGoogleHeader = showGoogleHeader;

		vm.activate ();

		// ================================================================== //
		// Methods
		// ================================================================== //

		$scope.$on('$ionicView.beforeEnter',function() {

			if ($state.current.name == 'serverError') {

				if (!CONFIG.maintenance) {
					$state.go('home', {});
				}

				// Wartungsarbeiten
				vm.pageTitle = 'Wartungsarbeiten';
				vm.headline = 'Planmäßige Wartungsarbeiten';
				vm.message = 'Wir bitten um Entschuldigung, denn wir sind derzeit nicht erreichbar.<br><br>Heute Nacht werden Wartungsarbeiten durchgeführt, ab Mittwochmorgen (31.08.) sind wir wieder online.<br><br>Vielen Dank für Ihr Verständnis.';
				vm.showButton = false;
				vm.image = 'img/503.jpg';

				$ionicSideMenuDelegate.canDragContent(false);
				$('.left-buttons').hide();

			} else {

				// Seite nicht gefunden
				vm.pageTitle = 'Fehler 404';
				vm.image = 'img/404.jpg';
				vm.headline = 'Fehler <strong>404</strong>';
				vm.message = 'Wir bitten um Entschuldigung.<br>Leider können wir Sie auf dieser Seite nicht verarzten, da es die Seite bei uns leider nicht (mehr) gibt.';
				vm.showButton = true;

				if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') {
					$timeout(function() {
						JamHelperFactory.resetBackButton();
					}, CONFIG.backButtonDelay);
				} else {
					$timeout(function() {
						JamHelperFactory.setBackButton('burger');
					}, CONFIG.backButtonDelay);
				}
			}

			// App Fix
			if (CONFIG.environment != 'app') {
				vm.image = '/'+vm.image;
			}

			vm.activate();
		});

		// Menu wieder aktiv machen
		$scope.$on('$ionicView.leave', function () {
			$ionicSideMenuDelegate.canDragContent(true);
			$('.left-buttons').show();
		});

		function activate() {
			LoaderFactory.hideLoader(0,true);
		}

		function goToHome() {
			$state.go('home', {});
		}

		function showGoogleHeader() {

			var showGoogleHeader = false,
				currentView = $ionicHistory.currentView();
			if (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape' && typeof currentView != 'undefined' && currentView.backViewId == null) {
				// nur bei tablet landscape wegen Pfeil Navigation
				showGoogleHeader = true;
			}

			return showGoogleHeader;
		}
	}
})();