(function () {
	'use strict';

	angular
		.module('app.jamDirectives')
		.directive('jamFacebookOverlay', facebookOverlay);

	function facebookOverlay($state, $ionicModal, JamHelperFactory, CONFIG, $window, AnalyticsHelper, $ionicHistory) {

		var directive = {
			restrict: 'E',
			link: function(scope, element, attrs) {
				
				if (CONFIG.windowHeight < 455) {
					scope.overlayStyle = 'mini';
				} else {
					scope.overlayStyle = 'normal';
				}

				if (CONFIG.environment == 'app') {
					return false;
				}

				var templateUrl = 'app/directives/facebookOverlay.html',
					fbOverlayData = JamHelperFactory.getFromCache('fbOverlayData', (60*60*24*7)),
					overlayDelay = 4000;

				scope.config = CONFIG;
				scope.abTestLottery = Math.floor((Math.random() * 2) + 1);	// 1 = A (Arzt), 2 = B (Smoothie)
				scope.trackingText = (scope.abTestLottery == 1) ? '(Arzt)' : '(Smoothie)';
				scope.overlayText = {
					header: 'Verpasse keinen Experten-Tipp für Deine Gesundheit',
					teaser: 'Unsere Ärzte und Gesundheits&shy;experten wissen, wie man gesund wird und es bleibt. Erfahre mehr auf Facebook.',
					likeHeader: 'Facebook-Fan werden:',
					dismissNoThanks: 'Nein, danke',
					dismissIsFan: 'Ich bin bereits Facebook-Fan'
				};


				// FB Like Button einbinden
				window.setTimeout(function() {

					var currentView = $ionicHistory.currentView().stateName;
					if (currentView != 'expertArticle') {
						return false;
					}

					(function (d, s, id) {
						var js, fjs = d.getElementsByTagName(s)[0];
						if (d.getElementById(id)) return;
						js = d.createElement(s);
						js.id = id;
						js.async = true;
						js.src = "//connect.facebook.net/de_DE/sdk.js#xfbml=1&version=v2.6";
						fjs.parentNode.insertBefore(js, fjs);
					}(document, 'script', 'facebook-jssdk'));

				}, overlayDelay + 500);


				// FB Like Button Tracking
				window.setTimeout(function() {

					var currentView = $ionicHistory.currentView().stateName;
					if (currentView != 'expertArticle') {
						return false;
					}

					if ($window.FB == null) {
						return false;
					}

					$window.FB.Event.subscribe('edge.create', function(targetUrl) {
						AnalyticsHelper.trackEvent('AB-Test FB Overlay', 'Like geklickt ' + scope.trackingText, undefined, undefined, true);
						//console.log('AB-Test FB Overlay', 'Like geklickt ' + scope.trackingText);
						scope.dismissFbOverlay('hasLiked');
					});

					$window.FB.Event.subscribe('edge.remove', function(targetUrl) {
						AnalyticsHelper.trackEvent('AB-Test FB Overlay', 'Unlike geklickt ' + scope.trackingText, undefined, undefined, true);
						//console.log('AB-Test FB Overlay', 'Unlike geklickt ' + scope.trackingText);
					});

				}, overlayDelay + 1000);


				// Object mit FB Overlay Daten erstellen wenn noch nicht vorhanden
				if (fbOverlayData === false) {
					fbOverlayData = {
						showAgainAfter: Date.now()
					};

					// Daten Speichern
					JamHelperFactory.setIntoCache('fbOverlayData', fbOverlayData);
				}
				

				// Wenn timestamp älter ist -> Overlay anzeigen
				if (fbOverlayData.showAgainAfter <= Date.now()) {
					$ionicModal.fromTemplateUrl(templateUrl, {
						scope: scope,
						backdropClickToClose: false
					}).then(function(modal) {
						scope.fbModal = modal;
					});

					window.setTimeout(function() {

						var currentView = $ionicHistory.currentView().stateName;
						if (currentView != 'expertArticle') {
							return false;
						}

						// Popup Tracking
						if (scope.abTestLottery == 1) {
							AnalyticsHelper.trackEvent('AB-Test FB Overlay', 'Overlay Variante-A angezeigt ' + scope.trackingText, undefined, undefined, true);
							//console.log('AB-Test FB Overlay', 'Overlay Variante-A angezeigt (Arzt)');
						} else {
							AnalyticsHelper.trackEvent('AB-Test FB Overlay', 'Overlay Variante-B angezeigt ' + scope.trackingText, undefined, undefined, true);
							//console.log('AB-Test FB Overlay', 'Overlay Variante-B angezeigt (Smoothie)');
						}

						// Overlay anzeigen
						scope.fbModal.show();

						// State Name prüfen
						scope.checkStateName();

					}, overlayDelay);
				}

				
				// Overlay schließen, mit entsprechender Aktion/Dauer
				scope.dismissFbOverlay = function(type) {

					// Neuen Timestamp für Anzeige speichern
					switch (type) {
						case 'hasLiked':
							fbOverlayData.showAgainAfter = Date.now() + (60*60*24*365*1000);
							break;
						case 'isFan':
							fbOverlayData.showAgainAfter = Date.now() + (60*60*24*365*1000);
							AnalyticsHelper.trackEvent('AB-Test FB Overlay', 'Ich bin schon Fan - geklickt ' + scope.trackingText, undefined, undefined, true);
							//console.log('AB-Test FB Overlay', 'Ich bin schon Fan - geklickt ' + scope.trackingText);
							break;
						case 'noThanks':
						default:
							fbOverlayData.showAgainAfter = Date.now() + (60*60*24*30*1000);
							AnalyticsHelper.trackEvent('AB-Test FB Overlay', 'Nein danke - geklickt ' + scope.trackingText, undefined, undefined, true);
							//console.log('AB-Test FB Overlay', 'Nein danke - geklickt ' + scope.trackingText);
							break;
					}

					// Anzeige cachen
					JamHelperFactory.setIntoCache('fbOverlayData', fbOverlayData);

					scope.fbModal.hide();
				};


				// Check ob Seitenwechsel stattfand
				scope.checkStateName = function() {

					var currentView = $ionicHistory.currentView().stateName;
					if (currentView != 'expertArticle') {
						scope.fbModal.hide();
					} else {
						window.setTimeout(function() {
							scope.checkStateName();
						}, 2000);
					}
				};
			}
		};
		return directive;
	}

})();