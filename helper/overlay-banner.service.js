(function(){
	'use strict';

	angular.module('app.helper').service('JamOverlayBannerService', function($window, $state, $ionicModal, CONFIG, JamHelperFactory) {

		function show(params) {

			params = params || {};
			params.template = params.template || 'arztsucheOverlay';
			$window.popup = null;

			var displayed = JamHelperFactory.getFromCache('OverlayDisplayed'+params.template) || false,
				counter = JamHelperFactory.getFromCache('Overlay'+params.template) || 0;

			// Seiten ausschließen
			var blacklist = ['review', 'otb', 'premiumLogin', 'userForgotPassword', 'userRegister', 'userAppointments', 'userAppointmentsSingle', 'premiumAppointments'];
            if (blacklist.indexOf($state.current.name) >= 0) {
				return false;
			}

			// Bereits angezeigt?
			if (displayed) return false;
            counter++;

			if (counter > 2) {
				JamHelperFactory.setIntoCache('OverlayDisplayed'+params.template, true);

                // Template vorbereiten
                params.template = 'app/directives/'+params.template+'.html';

                $ionicModal.fromTemplateUrl(params.template, {
                    backdropClickToClose: false
                }).then(function(modal) {
                    $window.popup = modal;
					modal.show();
                });
			}

            JamHelperFactory.setIntoCache('Overlay'+params.template, counter);

		}

		return {
			show: show
		}
	}).controller('JamOverlayBannerController', function($scope, $window, CONFIG) {

		var vm = this;
		vm.dismiss = dismiss;
		vm.openHref = openHref;

		// Bei verlassen der Seite Popup schließen
        $scope.$on('$ionicView.beforeLeave', function() {
        	if (typeof $window.popup !== 'undefined') {
                $window.popup.remove();
			}
        });

        // Schließt das Overlay
		function dismiss() {
            if (typeof $window.popup !== 'undefined') {
                $window.popup.remove();
            }
		}

        // Öffnet eine URL in einem neuen Tap und schließt das Overlay.
        function openHref(url) {
            window.open(url, CONFIG.urlTarget);
            if (typeof $window.popup !== 'undefined') {
                $window.popup.remove();
            }
		}
	});
})();