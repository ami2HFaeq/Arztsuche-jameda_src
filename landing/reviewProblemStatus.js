/**
 * Created by riccardo.carano on 14.02.2017.
 */
(function () {
	'use strict';

	angular.module('app.landing').controller('reviewProblemStatus', function ($scope, $state, $stateParams, $ionicViewSwitcher, $timeout, $ionicPopup, $ionicHistory, JamUserEvaluatesService, LoaderFactory, JamHelperFactory, CONFIG) {

		// variables
		var vm = this;

		vm.isTablet = (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') ? true : false;

		vm.title = 'Status';
		vm.loading = true;
		vm.error = true;
		vm.message = '';

		vm.status = 0;
		vm.statusMessages = [];
		vm.popup = null;
		vm.curDate = new Date();

		// ==================================================== //
		// Methods
		// ==================================================== //
		vm.__contrstuctor = __contrstuctor;
		vm.goTo = goTo;
		vm.showDeclaration = showDeclaration;

		// ==================================================== //
		// Bevor der Controller fertig initialisiert wird
		// ==================================================== //
		$scope.$on('$ionicView.beforeEnter', function() {
			LoaderFactory.hideLoader(400);
			vm.__contrstuctor();

			JamHelperFactory.setMetaData({'title': 'Status ihrer Bewertung | jameda'});
		});

		// ==================================================== //
		// Nachdem der Controller fertig initialisiert wurde
		// ==================================================== //
		$scope.$on('$ionicView.afterEnter', function() {
			// Back-Button
			if ($ionicHistory.viewHistory().backView !== null) {
				JamHelperFactory.resetBackButton();
				JamHelperFactory.setBackButton('back', { title: 'zurück' });
			} else if (vm.isTablet){
				JamHelperFactory.resetBackButton();
			}
		});


		/**
		 * Initialer Aufruf
		 *
		 * @private
		 */
		function __contrstuctor() {

			vm.error = false;
			vm.message = 'Der von Ihnen aufgerufene Link ist ungültig. Bitte überprüfen Sie noch einmal ob Sie den korrekten und vollständigen Link aus Ihrer E-Mail aufgerufen haben.';

			if ($stateParams.hash == null || $stateParams.hash == '') {

				vm.error = true;
				loaded();

			} else {

				JamUserEvaluatesService.getPMStatus({b_id: $stateParams.reviewId, pm_id: $stateParams.pmId, hash: $stateParams.hash}).success(function(data) {

					vm.statusMessages = data.statusMessages;
					vm.status = data.status;

					// Wenn es der letzte Schritt sein sollte, benötigen wir hier den Status
					// mit der Länge des Arrays, damit der Fortschritt komplett gefüllt wird.
					if (data.lastStep) {
						vm.status = vm.statusMessages.length;
					}
					loaded();

				}).error(function(error) {
					vm.error = true;

					if (typeof error.message != 'undefined') {
						vm.message = error.message;
					}
					loaded();
				});
			}
		}


		/**
		 * Zeige ein Popup an
		 * Der Inhalt kommt von der Schnittstelle
		 *
		 * @param index
		 */
		function showDeclaration(index) {
			
			if (event) {
				event.stopPropagation();
				event.preventDefault();
			}

			vm.popup = $ionicPopup.alert({
				title : vm.statusMessages[index].headline,
				template: vm.statusMessages[index].declaration,
				buttons: [
					{
						text: 'schließen'
					}
				]
			});
		}

		/**
		 * Seite fertig geladen
		 * Zeige den Loader nicht mehr an
		 */
		function loaded() {
			$timeout(function() {
				vm.loading = false;
			}, 400);
		}


		/**
		 * Gehe zur Seite XY
		 *
		 * @param state
		 * @param params
		 * @param direction
		 */
		function goTo(state, params, direction) {
			state = state || 'userMainMenu';
			params = params || {};
			direction = direction || 'forward';

			$ionicViewSwitcher.nextDirection(direction);
			$state.go(state, params);
		}
	});
})();