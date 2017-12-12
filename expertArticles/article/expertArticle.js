/**
 * Created by riccardo.carano on 21.03.2016.
 */
(function () {

	'use strict';

	angular.module('app.expertArticles').controller('ExpertArticle', function ($scope, $timeout, $ionicPopup, $window, $ionicNavBarDelegate, $ionicHistory, $sce, $location, $ionicScrollDelegate, CONFIG, JamHelperFactory, $state, LoaderFactory, JamExpertArticlesService, AnalyticsHelper) {

		// set view model
		var vm = this;

		// set vars
		vm.JamHelperFactory = JamHelperFactory;
		vm.config = CONFIG;
		vm.pageTitle = 'Artikel';
		vm.isLoggedIn = false;
		vm.isTablet = (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'landscape') ? true : false;
		vm.isTabletPortrait = (CONFIG.deviceType == 'tablet' && CONFIG.deviceOrientation == 'portrait') ? true : false;
		vm.backButtonParams = {};
		vm.trackingUrl = '';
		vm.popup;
		vm.scrollHeight = CONFIG.windowHeight - 105;
		vm.userFormData = {};
		vm.showError = '';
		vm.errorMessage = '';
		vm.enableAnchor = false;

		vm.comments;
		vm.commentData = {
			name: {
				value: '',
				error: false
			},
			mail: {
				value: '',
				error: false
			},
			comment: {
				value: '',
				error: false
			}
		};
		vm.commentsCount = 0;
		vm.commentsPage = 1;
		vm.commentsStepPage = 20;
		vm.commentError = false;
		vm.commentErrorMessage = '';
		vm.loadedComments = false;

		vm.isReadonly = false;
		vm.deviceType = (CONFIG.deviceType == 'phone') ? 'jam-is-phone' : 'jam-is-tablet';
		vm.deviceOrientation = CONFIG.deviceOrientation;

		vm.article = {};
		vm.clickEvent = null;
		$scope.showScrollTop = false;

		vm.scrollTop = scrollTop;
		vm.getScrollPosition = getScrollPosition;
		vm.showNextCommentPage = showNextCommentPage;
		vm.saveComment = saveComment;
		vm.clearInput = clearInput;
		vm.updateUserRating = updateUserRating;

		vm.currentUrl = '';
		vm.currentKat = '';

		// show nav bar
		$ionicNavBarDelegate.showBar(true);


		// before entering the scope
		$scope.$on('$ionicView.beforeEnter', function() {
			
			// zeige Loader an
			LoaderFactory.showLoader(2);

			// init step variables
			if (Object.keys(vm.article).length == 0) {
				initArticle();
			} else {
				LoaderFactory.hideLoader(400);
			}

			// set default back button
			vm.backButtonParams = {
				buttonType: 'burger',
				buttonParams: {}
			};

			// reset error
			vm.showError = '';
			vm.errorMessage = '';

			// Fülle automatisch die E-Mail Adresse ein, wenn User ist angemeldet
			if (vm.commentData.mail.value.length == 0 && CONFIG.userMail.length > 0) {
				vm.commentData.mail.value = CONFIG.userMail;
			}
		});


		// after entering the scope
		$scope.$on('$ionicView.afterEnter', function() {

			// set back button
			JamHelperFactory.resetBackButton();

			$timeout(function () {

				var urlParts,
					url = '';

				vm.backButtonParams.buttonType = 'back';
				vm.backButtonParams.buttonParams.title = 'zurück';

				if ($ionicHistory.backView() == null) {
					// wenn über Google gekommen
					urlParts = $location.path().split("/");
					urlParts.splice(3, 1);
					url = urlParts.join('/');

				} else if($ionicHistory.backView().stateName == 'expertOverview' || $ionicHistory.backView().stateName == 'expertCategory'){
					url = '';

				} else {
					urlParts = $ionicHistory.backView().url.split("/");

					// von Übersichtsseite gekommen
					if (urlParts.length == 3) {
						urlParts.splice(2, 1);
						url = urlParts.join('/') + '/';
					}

					// von Themenseite gekommen
					if (urlParts.length == 4) {
						urlParts.splice(3, 1);
						url = urlParts.join('/') + '/';
					}
				}

				vm.backButtonParams.buttonParams.url = url;

				JamHelperFactory.setBackButton(vm.backButtonParams.buttonType, vm.backButtonParams.buttonParams);
			}, CONFIG.backButtonDelay + 400);


			// Set height for tablet
			if (vm.isTablet) {
				$timeout(function() {
					var contentHeight = CONFIG.windowHeight - angular.element('.bar-stable .title').height();
					angular.element('.right-content').height(contentHeight);
				}, 200);
			}
		});


		// before leaving the scope
		$scope.$on('$ionicView.beforeLeave', function(res,res2,res3) {

			if (typeof vm.clickEvent != 'undefined' && vm.clickEvent != null && CONFIG.environment != 'app') {
				vm.clickEvent.unbind('click');
			}

			if (typeof vm.popup != 'undefined' && vm.popup != null) {
				vm.popup.close();
			}

			// Anchor Links deaktivieren
			vm.enableAnchor = false;

			// lösche custom_vars wieder
			AnalyticsHelper.deleteCustomVar(8);
			AnalyticsHelper.deleteCustomVar(9);
			AnalyticsHelper.deleteCustomVar(10);
		});

		$scope.goToAnchorLink = function(anchor) {
			event.preventDefault();
			event.stopPropagation();

			if (!vm.enableAnchor) return false;

			anchor = anchor.replace(/\s/gi, '');

			$location.hash(anchor);

			var handle = $ionicScrollDelegate.$getByHandle('expert-article');
			handle.anchorScroll(true);

			// Zurück-Button berücksichtigen, damit nicht ständig auf den zurück-Button geklickt werden muss
			$timeout(function() {
				window.history.back();
				handle = undefined;
			}, 400);
		};


		function initArticle() {

			vm.currentUrl = $ionicHistory.currentView().url;

			// get article data
			JamExpertArticlesService.getArticle(vm.currentUrl).success(function(data) {

				if (vm.isTablet) {
					data.article.inhalt = data.article.inhalt + '<br><br><br>';
				}
				data.article.inhalt = vm.trustAsHtml(data.article.inhalt);

				vm.article = data;

				// Generiere das Rating für den Artikel
				var tmpUserRating = getUserRating();

				vm.article.article.total_votes = vm.article.article.total_votes || 0;
				vm.article.userRating = (tmpUserRating.rating) ? tmpUserRating.rating : 0;
				vm.article.ratingInit = (vm.article.userRating == 0);

				if (vm.article.ratingInit) {
					vm.article.userRating = (data.article.total_votes > 0) ? (data.article.total_value / data.article.total_votes) : 0;

					// Falls der Wert doch größer als 5 sein sollte, beschränke ihn auf max 5
					if (vm.article.userRating > 5) {
						vm.article.userRating = 5;
					}
				} else {
					vm.isReadonly = true;
					vm.article.article.total_votes = tmpUserRating.votes;
				}

				vm.currentKat = vm.article.article.current_kat;

				// Custom Vars setzen für das weitere Tracking
				if (typeof data != 'undefined' && typeof data.adParams != 'undefined') {
					if (typeof data.adParams.adsc_kategorie != 'undefined') {
						AnalyticsHelper.setCustomVar({index: 8, name: 'Content-Kategorie', value: data.adParams.adsc_kategorie, opt_scope: 3});
					}

					if (typeof data.adParams.adsc_fachgebiet != 'undefined') {
						AnalyticsHelper.setCustomVar({index: 9, name: 'Fachgebiet', value: data.adParams.adsc_fachgebiet, opt_scope: 3});
					}
				}

				if (typeof data.autor != 'undefined' && typeof data.autor.acxid_p != 'undefined' && typeof data.article.id != 'undefined') {
					AnalyticsHelper.setCustomVar({index: 10, name: data.autor.acxid_p , value: data.article.id, opt_scope: 3});
				}

				// GATRACKING
				AnalyticsHelper.trackPageview('/gesundheit/artikel/');

				// Titel bereinigen
				// entfernt alle Vorkommen eines Backslashes \
				vm.article.article.titel = vm.article.article.titel.replace(/\\/g, "");

				// set canonical
				if (vm.article.canonical == null) {
					// kein canonical mitgegeben, es kann die aktuelle URL verwendet werden
					JamHelperFactory.setCanonical(CONFIG.apiUrl + vm.currentUrl, true);
				} else {
					// canonical übernehmen
					JamHelperFactory.setCanonical(vm.article.canonical, true);
				}

				// Lade Kommentare
				if (data.article.art == 'blog' && data.article.is_werbe_kunde == 0 && data.article.titel.indexOf('jameda-Interview') < 1) {

					vm.comments = [];
					JamExpertArticlesService.getComments(vm.article.article.id).success(function(result) {

						// speicher ergebnis im array ab
						Object.keys(result.comments).forEach(function(key) {
							vm.comments.push(result.comments[key]);
						});

						// Zeige ergebnis erst nach 300ms an
						$timeout(function() {
							vm.commentsCount = result.numFound;
							vm.commentsPage = 1;
							vm.loadedComments = true;

							// Fülle automatisch die E-Mail Adresse ein, wenn User ist angemeldet
							// (falls es beim initialen Laden nicht geklappt haben sollte)
							if (CONFIG.userMail != '') {
								vm.commentData.mail.value = CONFIG.userMail;
							}
						}, 300);

					}).error(function(nothingFound) {
						vm.loadedComments = true;
					});
				}

				// set page title
				$timeout(function() {

					// Setze Meta-Informatione
					JamHelperFactory.setMetaData(vm.article.meta);

					// Timeout für die neuberechnung der Höhe
					$timeout(function() {
						$ionicScrollDelegate.$getByHandle('expert-article').resize();
					}, 200);
				}, 300);

				initLinksHandler();

				$timeout(function() {
					vm.enableAnchor = true;
				}, 300);

				LoaderFactory.hideLoader(600);

			}).error(function(errorResponse) {

				// hide loader
				LoaderFactory.hideLoader(600);
				if (typeof errorResponse.message != 'undefined' && errorResponse.message.indexOf('Zugriff') > -1) {
					JamHelperFactory.showHashTimeout();
				}
			});
		}


		function initLinksHandler() {

			// CSS-Klassen für Anchor-Links setzen
			// sowie für phone (portrait) Artikelbild mit Blur Effekt
			$timeout(function() {

				var anchorLinks = angular.element(".article-html a.inline-menu"),
					anchorParent = false,
					anchorLink,
					tmpHtml;

				for (var i = 0; i < anchorLinks.length; i++) {
					anchorLink = anchorLinks[i];

					if (anchorParent === false) {
						anchorParent = angular.element(anchorLink).parent();
					}
				}

				// unerwünschte Zeichen ersetzen
				if (anchorParent !== false) {
					tmpHtml = anchorParent.html();
					anchorParent.html(tmpHtml.replace(/»|<br>|<br\/>|<br \/>/gi, ''));

					if (anchorParent[0].nodeName == 'LI') {
						anchorParent.parent().addClass('list-elements');
						if (!vm.isTabletPortrait) {
							anchorParent.parent().addClass('full-width');
						}
					}
				}
				anchorLinks = anchorParent = anchorLink = tmpHtml = undefined;

				// Blur Effekt bei phone-portrait
				// Mit Timout, da manche Geräte das Bild noch nicht fertig gerendert hatten
				var images = angular.element('.jam-article .article-image'),
					elem = null,
					styleAttr = '',
					elemUrl,
					cssClass = '';

				// Gehe jedes Bild Tag durch
				for (var i = 0; i < images.length; i++) {

					elem = angular.element(images[i]);
					styleAttr = elem[0].style.backgroundImage;

					if (styleAttr.indexOf('"') > -1) {
						elemUrl = styleAttr.substring(5, styleAttr.length-2);
					} else {
						elemUrl = styleAttr.substring(4, styleAttr.length-1);
					}
					cssClass = '';

					if ((CONFIG.deviceType == 'phone' && CONFIG.deviceOrientation == 'portrait') || CONFIG.deviceType == 'tablet') {
						if (elem.attr('data-image-width') < elem.attr('data-image-height')) {

							elem.addClass('blur-background');

							if (vm.isTablet) {
								cssClass = 'big-image'
							} else if(vm.isTabletPortrait) {
								cssClass = 'margin-top';
							}
							elem.after('<img src="'+elemUrl+'" class="'+cssClass+'">');
							elem.wrap('<div class="wrapper-blur '+cssClass+'"></div>');
						}
					}
				}
				images = elem = styleAttr = elemUrl = cssClass = undefined;


				// Targets hinzufügen
				var externalLinks = angular.element('.jam-article .article-html a:not(.inline-menu)'),
					addTargetByURL = [
						'/medikamente/',
						'/gesundheits-lexikon/',
						'/krankheiten-lexikon/',
						'/naehrstoffe/',
						'/laborwerte/',
						'/heilpflanzen/',
						'/hausmittel/',
						'/gesundheit/downloads/',
						'/gesundheits-tipps/',
						'/gesundheit/naturheilkunde/',
						'/blog/',
						'/gesundheits-specials/'
				];

				for (var i = 0; i < externalLinks.length; i++) {

					var elem = angular.element(externalLinks[i]);
					var href = elem.attr('href');

					if (typeof href != 'undefined' && href != '') {

						// domain voranstellen
						if (href.indexOf('http') != 0 || href.indexOf('//www.jameda.de/') == 0) {
							elem.attr('href', 'https://www.jameda.de' + elem.attr('href'));
							href = elem.attr('href');
						}

						for (var y = 0; y < addTargetByURL.length; y++) {

							// Füge bei jedem Element ein Target "_blank|_system" hinzu
							if (href.indexOf(addTargetByURL[y]) != -1) {
								elem.attr('target', CONFIG.urlTarget);
							}

							// Erzwinge Desktop-Ansicht
							if (href.indexOf('/gesundheits-tipps/') != -1 || href.indexOf('/gesundheit/naturheilkunde/') != -1 || href.indexOf('/blog/') != -1) {
								elem.attr('href', href+'?show_desktop=yes');
								href = elem.attr('href');
								continue;
							}
						}
					} else {
						if (typeof elem.attr('name') != 'undefined' && elem.attr('name') != '') {
							elem.attr('id', elem.attr('name').replace(/\s/gi, ''));
						}
					}
				}
			}, 500);


			// Klicks abfangen (zuvor aber andere Events löschen)
			if (typeof vm.clickEvent != 'undefined' && vm.clickEvent != null && CONFIG.environment != 'app') {
				vm.clickEvent.unbind('click');
			}

			vm.clickEvent = $('body').on('click', '#article-' + vm.article.article.id + ' .article-html a', function(event) {

				if (CONFIG.environment == 'app') {
					event.preventDefault();
					event.stopPropagation();
				}

				var href = $(this).attr('href');
				if ($(this).attr('ng-click') && $(this).attr('ng-click').indexOf('AnchorLi') > -1) {

					$scope.goToAnchorLink($(this).attr('data-anchor').replace(/\s/gi, ''));

				} else if (typeof href != 'undefined') {

					// link typen unterscheiden (in der App, immer das gleiche Verfahren!)
					if (CONFIG.environment == 'app') {
						window.open(href, '_system', 'location=yes');
						return false;
					} else {
						if (href.indexOf('http') != 0 || href.indexOf('//www.jameda.de/') == 0) {
							if (href.indexOf('.pdf') != -1) {
								window.open(href, '_blank', true);
								return false;
							}
						} else {
							// externe Links
							$(this).attr('target', '_blank');
						}
					}
				}
				href = undefined;
			});
		}


		/**
		 * Hole aktuelle Scroll-Position und zeige den Button an oder nicht
		 */
		function getScrollPosition() {

			var position = $ionicScrollDelegate.$getByHandle('expert-article').getScrollPosition();

			$scope.$apply(function() {
				$scope.showScrollTop = (position.top > (CONFIG.windowHeight / 2));
			});
			return true;
		}


		/**
		 * Zähle die nächste Zeile hoch
		 */
		function showNextCommentPage() {
			vm.commentsPage++;
		}


		/**
		 * Speichere den Kommentar
		 */
		function saveComment() {
			event.preventDefault();
			event.stopPropagation();

			vm.commentError = false;
			vm.commentErrorMessage = '';

			Object.keys(vm.commentData).forEach(function(key) {
				if (typeof vm.commentData[key].value == 'undefined' || vm.commentData[key].value == '') {
					vm.commentData[key].error = true;
					vm.commentError = true;
					vm.commentErrorMessage = 'Bitte überprüfen Sie Ihre Eingaben.';
				} else {
					if (key == 'name' && vm.commentData[key].value.length == 0) {
						vm.commentData[key].error = true;
						vm.commentError = true;
						if (vm.commentErrorMessage.length > 0) vm.commentErrorMessage += '<br>';
						vm.commentErrorMessage += 'Bitte geben Sie einen Namen oder ein Pseudonym ein.';
					} else if (key == 'mail' && !JamHelperFactory.isValidEmail(vm.commentData[key].value)) {
						vm.commentData[key].error = true;
						vm.commentError = true;
						if (vm.commentErrorMessage.length > 0) vm.commentErrorMessage += '<br>';
						vm.commentErrorMessage += 'Bitte geben Sie eine gültige E-Mail Adresse ein.';
					} else if(key == 'comment' && vm.commentData[key].value.length < 10) {
						vm.commentData[key].error = true;
						vm.commentError = true;
						if (vm.commentErrorMessage.length > 0) vm.commentErrorMessage += '<br>';
						vm.commentErrorMessage += 'Ihr Kommentar sollte mindestens 10 Zeichen enthalten.';
					} else {
						vm.commentData[key].error = false;
					}
				}
			});

			// Erzeuge Fehlermeldung, falls ein Fehler aufgetreten sein sollte.
			if (!vm.commentError) {

				JamExpertArticlesService.saveComment(vm.article.article.id, vm.commentData).success(function(result) {

					if (typeof result.data != 'undefined') {

						vm.popup = $ionicPopup.show({
							template: '<div><i class="icons ion-ios-checkmark-empty"></i></div><span>'+result.data+'</span>',
							cssClass: 'hint-popup hint-popup-big',
							title: '',
							scope: $scope,
							buttons: []
						});

						// Lösche wieder alle Werte
						Object.keys(vm.commentData).forEach(function(key) {
							if (key != 'mail') vm.commentData[key].value = '';
						});

						$timeout(function() {
							vm.popup.close();
						}, 5000);
					}
				}).error(function(resultError) {

					vm.commentError = true;
					vm.commentErrorMessage = 'Ihr Kommentar konnte leider nicht gespeichert werden.';
				});
			}
		}

		/**
		 * Entferne aus dem Element die Klasse "error"
		 *
		 * @param elem
		 */
		function clearInput(elem) {
			elem.error = false;
		}

		/**
		 * ScrollToTop Handler
		 */
		function scrollTop() {
			event.preventDefault();
			event.stopPropagation();

			$timeout(function() {
				$ionicScrollDelegate.$getByHandle('expert-article').scrollTop(true);
			}, 150);
		}

		function gotoProfile(profileDetails, event) {

			event.stopPropagation();

			if (profileDetails.fullRefId == null && (profileDetails.ref_id == null || profileDetails.art == null)) {
				// ref id nicht vorhanden

				if (profileDetails.autor_url != null) {
					// auf desktop url verlinken
					if (CONFIG.environment == 'app') {
						window.open(CONFIG.apiUrl + profileDetails.autor_url, '_system', 'location=yes');
					} else {
						window.location.href = CONFIG.apiUrl + profileDetails.autor_url;
					}
				}
				return false;
			}

			var fullRefId = profileDetails.ref_id + '_' + profileDetails.art;
			if (typeof profileDetails.fullRefId != 'undefined') {
				fullRefId = profileDetails.fullRefId;
			}

			var params = {
				state: 'profile',
				stateGoParams: {
					path: 'profil',
					fullRefId: fullRefId,
					backLinkType: 'expertArticles',
					isSearch: false
				},
				data: profileDetails
			};
			JamHelperFactory.goToProfileUrl(params);

			return false;
		}
		vm.gotoProfile = gotoProfile;

		function goToArticle(url) {
			$state.go('expertArticle', {categoryId: $state.params.categoryId, articleId: url});
		}
		vm.goToArticle = goToArticle;

		function trustAsHtml(string) {
			return $sce.trustAsHtml(string);
		}
		vm.trustAsHtml = trustAsHtml;


		$scope.goToState = function(state, params) {
			event.preventDefault();
			event.stopPropagation();

			// format path
			if (typeof params.path != 'undefined') {
				params.path = params.path.replace(/(\s)/g, '');
				params.path = decodeURI(params.path);
				params.path = params.path.replace('%252F','/');
			}

			$state.go(state, params);
		};

		function getUserRating() {

			var url = $location.url().split('?')[0],
				userVotesArticles = JamHelperFactory.getFromCache('userVotesArticles') || {};
			url = url.split('#')[0];

			return (typeof userVotesArticles[url] == 'undefined') ? 0 : userVotesArticles[url];
		}

		function updateUserRating(rating) {

			var url = $location.url().split('?')[0],
				userVotesArticles = JamHelperFactory.getFromCache('userVotesArticles') || {};

			url = url.split('#')[0];
			vm.article.ratingInit = false;
			vm.isReadonly = true;

			// Mache nur weiter, wenn der Nutzer noch nicht Bewertet hat
			if (typeof userVotesArticles[url] == 'undefined') {
				vm.article.article.total_votes++;

				// Speicher nur, wenn nicht Entwicklungsumgebung
				if (!CONFIG.isDev) {
					JamExpertArticlesService.saveRating(vm.article.article.id, rating);
				}

				// Speicher zusätzlich das Nutzer-Voting im LocalStorage
				userVotesArticles[url] = {
					votes: vm.article.article.total_votes,
					rating: rating
				};
				JamHelperFactory.setIntoCache('userVotesArticles', userVotesArticles);
			}
		}
	});
})();
