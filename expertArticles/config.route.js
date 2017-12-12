(function () {
	'use strict';

	/*
	Übersicht:
	/gesundheit/

	Kategorie:
	/gesundheit/ernaehrung-fitness/

	Artikel:
	/gesundheit/ernaehrung-fitness/Schritt-fuer-Schritt-zum-Wunschgewicht/
	/gesundheit/frauen-schwangerschaft/alternative-behandlungsmethoden-bei-krampfadern/
	/gesundheit/haut-haare/venenprobleme-in-jungen-jahren-ursachen-und-behandlung/
	*/

	angular
		.module('app.expertArticles',[])
		.config(function($stateProvider) {

			$stateProvider
				.state('expertOverview', {

					url: "/gesundheit/",
					views: {
						menuContent: {
							templateUrl: "app/expertArticles/overview/expertOverview.html"
						}
					}
				})

				.state('expertCategory', {

					url: "/gesundheit/:categoryId/",
					views: {
						menuContent: {
							templateUrl: "app/expertArticles/category/expertCategory.html"
						}
					}
				})

				.state('expertSpecial', {

					url: "/gesundheit/:categoryId/:specialId/kategorie/",
					views: {
						menuContent: {
							templateUrl: "app/expertArticles/category/expertCategory.html"
						}
					}
				})

				.state('expertArticle', {

					url: "/gesundheit/:categoryId/:articleId/",
					views: {
						menuContent: {
							templateUrl: "app/expertArticles/article/expertArticle.html"
						}
					}
				});
		});
})();