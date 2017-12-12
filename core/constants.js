(function () {
	'use strict';

	angular.module('app.core').constant('CONFIG', {
		isLoaded: false,
		isDev: false,
		debugMode: true,
		environment: 'web',													// web or app
		urlTarget: '_blank',
		urlPopupTarget: '_self',
		maintenance: false,

		urlPrefix: '',														// add hashtag for app
		apiUrl: 'https://www.jameda.de',									// dev 'https://xyz:123@www.dev.frieder.jameda.de' or live 'https://www.jameda.de'
		apiUrlMobi: 'https://www.jameda.mobi/',								// dev 'https://mobi.local.dev/' or live 'https://www.jameda.mobi' or staging ...
		suggestUrl: 'https://suche.jameda-elements.de/',
		allSubjectsUrl: 'https://www.jameda.de/_scripts/json-api.php?aktion=fachstruktur',
		amazonCDN: 'https://d3tn0m43ubhoh6.cloudfront.net/',
		gaTrackingCode: 'UA-26741000-8',									// Web: UA-26741000-8 // App: UA-26741000-7 // Dev: UA-26741000-9
		appVersion: '4.3.2',
		appVersionDetail: 'Mobil',
		googleMapsApiKey: {
			current: false,
			dev: 'AIzaSyDIiNhR-nVwSceq7J2tLComAe63Yeh0HJY',
			live: 'AIzaSyA0I_zT1PGSC1wXGGskvjBZLDA1NCNCPbA',
			app: 'AIzaSyC-KO7N1B70fikjk9IjJC3q9gxLS_GhXxc'
		},
		deviceOs: false,													// unknown, iOS, Android
		deviceOsVersion: false,												// 2 digits e.g. 8.0
		deviceBrowser: 'unknown',											// unknown, chrome
		deviceType: '',														// phone, tablet
		deviceOrientation: '',												// portrait, landscape
		devicePixelDensity: '',												// Pixeldichte
		partner: '',														// wird anhand ermitteltem deviceType, deviceOs und environment gesetzt
		windowWidth: '',													// Fenster Breite
		windowHeight: '',													// Fenster Höhe
		contentHeight: '',													// Content Höhe
		hash: '',															// API Hash
		hashTime: '',														// API Hash timestamp
		ua: '',
		canonical: '',
		gaAccountIsSet: false,
		gaCounter: 0,
		homeIsTracked: false,
		backButtonDelay: 80,
		ocIsSet: false,														// orientation change listener is set?
		weekDays: [
			'So',
			'Mo',
			'Di',
			'Mi',
			'Do',
			'Fr',
			'Sa'
		],
		months: [
			'Januar',
			'Februar',
			'März',
			'April',
			'Mai',
			'Juni',
			'Juli',
			'August',
			'September',
			'Oktober',
			'November',
			'Dezember'
		],
		userProfile: {},
		localStorageMessage: false,
		userMail: "",
		storageTimeout: {
			evaluates: 86400,
			profile: 172800,
			premiumContents: 172800,
			favourites: 0,
			expertArticles: 604800,		// 7 Tage
			categoryArticles: 604800	// 7 Tage
		},
		insuranceTypeIds: {
			'kasse': [1, 2, 3, 5],
			'privat': [1, 2, 4]
		},
		jamCities: ['wuerzburg', 'ulm', 'trier', 'sylt-ost', 'stuttgart', 'schwerin', 'saarbruecken', 'magdeburg', 'muenchen', 'kiel', 'rothenburg-ob-der-tauber',
			'rostock', 'regensburg', 'potsdam', 'passau', 'oberhausen', 'nuernberg', 'noerdlingen', 'mannheim', 'lueneburg', 'luebeck', 'leipzig',
			'landshut', 'konstanz', 'koeln', 'koblenz', 'kassel', 'karlsruhe', 'jena', 'heidelberg', 'hannover', 'hamburg', 'garmisch-partenkirchen', 'freiburg-im-breisgau', 'freiburg',
			'frankfurt-am-main', 'frankfurt', 'essen', 'duisburg', 'duesseldorf', 'dortmund', 'dresden', 'cuxhaven', 'celle', 'bremerhaven', 'bremen', 'bonn', 'bochum', 'bielefeld',
			'berlin', 'bamberg', 'augsburg', 'aachen'],
		jamAcceptanceUsePolicyUrl: 'https://www.jameda.de/qualitaetssicherung/nutzungsrichtlinien/?overlay=yes&mobile=yes',
		tuev: 'https://www.certipedia.com/quality_marks/0000054120'
	});
})();