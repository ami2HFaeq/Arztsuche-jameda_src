(function(){
	'use strict';

	angular
		.module('app.helper')
		.factory('JamAppointmentCalendar', JamAppointmentCalendar);

	JamAppointmentCalendar.$inject = ['$ionicPopup', '$state', '$ionicViewSwitcher', '$timeout', 'CONFIG', 'JamHelperFactory', 'AnalyticsHelper', 'JamSyncService'];

	function JamAppointmentCalendar($ionicPopup, $state, $ionicViewSwitcher, $timeout, CONFIG, JamHelperFactory, AnalyticsHelper, JamSyncService) {

		/* This Object */
		var vm = this;
		vm.popup = null;

		function AppointmentCalendar(params) {

			this.cur_datum_obj = params.cur_datum_obj || {}; 					// aktuelles Datum als Object/Array
			this.cur_week = params.cur_week || false; 							// aktuelle Woche
			this.cur_startDay = params.cur_startDay || false; 					// erster Tag der aktuellen Woche
			this.cur_startDay_visible = params.cur_startDay_visible || false; 	// erster Tag der anzuzeigenden Woche
			this.cur_startDay_visible_org = params.cur_startDay_visible;
			this.fullRefId = params.fullRefId || false;
			this.isInHoliday = false;

			this.current_page_id = $state.current.name+'-'+this.fullRefId;

			this.Kalender = [];
			this.KalenderIDs = [];

			this.errorOccured = false;
		}


		AppointmentCalendar.prototype.addKalender = function(cur_eintrag) {

			var newKal = {
				cur_eintrag: cur_eintrag || {},
				termine: {},
				selected_termine: [],
				kalender_inited: false,
				termin_vorlauf: 0
			};

			this.Kalender[newKal.cur_eintrag.ref_id] = newKal;
			this.KalenderIDs.push(newKal.cur_eintrag.ref_id);
		};


		AppointmentCalendar.prototype.initKalender = function(load_params) {

			// load_params: kasse_privat | grund | dauer
			var me = this,
				otbData = JamHelperFactory.getOtbDataFromCache(load_params.fullRefId);

			// check, ob mit diesen params schon initialisiert?
			if (me.ajax_is_loading === true) {
				vm.popup = $ionicPopup.alert({
					title: 'Hoppla...',
					template: 'Der Kalender lädt gerade. Bitte warten Sie etwas.'
				});
				return false;
			}

			me.load_params = load_params || {};
			me.load_params.kasse_privat = me.load_params.kasse_privat || 'kasse';
			me.load_params.grund = me.load_params.grund || false;
			me.load_params.serviceId = load_params.serviceId || me.load_params.serviceId || otbData.serviceId || 0;
			me.load_params.dauer = me.load_params.dauer || false;
			me.load_params.useApi = me.load_params.useApi || false;
			me.cur_startDay_visible = me.cur_startDay_visible_org;
			me.loadedweeks = [];

			$('.kalender_head_text, .kalender_viewport div, .kalender_slider').css({'margin-left': 0});

			if (typeof me.load_params.kasse_privat != 'undefined' && me.load_params.kasse_privat != 'leer' && me.load_params.grund != 'leer') {

				$('#' + me.current_page_id + ' #preselect_overlay').hide();
				$('#' + me.current_page_id + " .otv_kasseprivat_switch").removeClass('but-g-hover');
				$('#' + me.current_page_id + " .otv_kasseprivat_switch_"+me.load_params.kasse_privat).addClass('but-g-hover');

				// vorhandene Kalender reseten
				$('#' + me.current_page_id + ' .jamOTV.pfeil_weiter').addClass('pfeil_weiter_disabled');
				$('#' + me.current_page_id + ' .jamOTV.pfeil_weiter_ohnetext').addClass('pfeil_weiter_disabled');
				$('.kalender_container #kalender_slider_content').css({'margin-left':0});

				for (var i in me.KalenderIDs) {
					me.Kalender[me.KalenderIDs[i]].kalender_inited = false;
					$('#' + me.current_page_id + ' .kalender_week:not(.init_week)').remove();
					$('#' + me.current_page_id + ' .kalender_week_header').remove();
					$('#' + me.current_page_id + ' #kalender_ausgegraut' + me.KalenderIDs[i]).show();
					$('#' + me.current_page_id + ' #kalender_container' + me.KalenderIDs[i] + ' .kalender_slider, #' + me.current_page_id + ' #kalender_slider_header').css({'margin-left':0});
				}

				// erste Wochen laden
				me.loadWeeks('next');

			} else if (typeof me.load_params.kasse_privat == 'undefined' || me.load_params.kasse_privat == 'leer') {
				vm.popup = $ionicPopup.alert({
					title: 'Hoppla...',
					template: 'Bitte wählen Sie zuerst Ihre Versicherungsart aus.'
				});
			}

			return false;
		};


		AppointmentCalendar.prototype.loadWeeks = function(prev_or_next) {

			// aufgrund aktueller sichtbarer Woche die noch nötige nächste Woche laden
			prev_or_next = prev_or_next || 'next';

			var me = this,
				next_startDay,
				num_weeks_min_load = 1;

			me.errorOccured = false;
			$('button').removeClass('jam-button-inactive').attr('disabled', false);

			if (me.ajax_is_loading === true) {
				vm.popup = $ionicPopup.alert({
					title: 'Hoppla...',
					template: 'Der Kalender lädt gerade. Bitte warten Sie etwas.'
				});

			} else if (me.KalenderIDs.length > 0) {

				if (me.loadedweeks.length == 0) {
					// initialer Aufruf
					if (me.cur_startDay_visible > me.cur_startDay) {
						// bei Start in zukünftiger Woche auch eine Woche vor Start laden, damit links und rechts was ist
						next_startDay = me.cur_startDay_visible - (86400*2);
						num_weeks_min_load = 3;
					} else {
						next_startDay = me.cur_startDay_visible;
						num_weeks_min_load = 2;
					}

				} else {
					next_startDay = (prev_or_next == 'prev') ? me.cur_startDay_visible - (86400*2) : me.cur_startDay_visible + (87000*7);
					num_weeks_min_load = 1;
				}

				var next_startDay_Obj = new Date(next_startDay*1000),
					week_to_load = JamHelperFactory.getWeekNumber(next_startDay_Obj,true).join('_');

				if (me.loadedweeks.indexOf(week_to_load) === -1) {

					me.ajax_is_loading = true;
					var otbDataServices = current_profil.otb.services,
						startzeit = new Date().getTime(),
						tmpKalenderIds = me.KalenderIDs.join(),
						url = CONFIG.apiUrl + '/_scripts/ajax.php?ref_ids[]=' + tmpKalenderIds;

					// Starte nur einen Request, wenn es Behandlungsgründe gibt
					if (typeof otbDataServices == 'object' && $state.current.name == 'profile') {

						var counterServices = 0;

						// Zähle den Counter hoch
						Object.keys(otbDataServices).forEach(function(key) {
							if (CONFIG.insuranceTypeIds[me.load_params.insuranceType].indexOf(otbDataServices[key].insurance_type) > -1) {
								counterServices++;
							}
						});

						if (counterServices == 0) {
							me.ajax_is_loading = false;

							// Keine Behandlungsgründe vorhanden? Zeige Meldung an, dass der Arzt keine Termine für Kassenart hat.
							$timeout(function() {
								var insuranceType = (me.load_params.insuranceType != 'kasse') ? 'Privatpatienten' : 'Kassenpatienten',
									msg = current_profil.name_kurz+' bietet keine Online-Termine für '+insuranceType+' an.',
									startDay = new Date(next_startDay * 1000),
									endDay = new Date(startDay.setDate(startDay.getDate() + 7));

								me.showMessage(me.Kalender[current_profil.ref_id], 0, msg);
								$('.jamOTV.pfeil_weiter').addClass('pfeil_weiter_disabled');
								$('#kalender_head_text').html(me.getHeader(next_startDay_Obj, endDay));

								insuranceType = msg = startDay = endDay = undefined;
							}, 600);

							return false;
						}
						counterServices = undefined;
					}

					// set params
					var params = {
						which: 'load_otv_termine',
						kasse_privat: me.load_params.kasse_privat,
						serviceId: (me.load_params.serviceId == 0) ? '' : me.load_params.serviceId,
						dauer: me.load_params.dauer,
						week: week_to_load,
						num_weeks_min_load: num_weeks_min_load,
						useApi: me.load_params.useApi
					};

					JamSyncService.ajax(url, params).success(function(data) {

						$timeout(function() {
							me.ajax_is_loading = false;
						}, 1600);

						if (typeof data.data != 'undefined' && data.data.ergebnis === 'ok') {

							data = data.data;

							var ajax_time = new Date().getTime() - startzeit;
							data.ajax_time = ajax_time;
							data.prev_or_next = prev_or_next;
							data.num_weeks_min_load = num_weeks_min_load;

							if (ajax_time < 1500) {
								$timeout(function () {
									me.loadWeeksSuccess(data);
								}, 1500 - ajax_time);
							} else {
								me.loadWeeksSuccess(data);
							}

							if (me.load_params.hideCal) {
								$timeout(function() {
									$('#' + me.current_page_id + ' #otb1-calendar-box').slideUp();
									checkOtb1Termin();
								}, 1600);
								me.load_params.hideCal = false;
							}
						} else {

							data = data.data;

							if (data.isInHoliday) {
								jamOTVKalProfil.isInHoliday = true;
							}

							// Element leeren und ausblenden
							angular.element('#' + me.current_page_id + ' .kalender_ausgegraut_msg').html('');
							angular.element('#kalender_ausgegraut' + current_profil.ref_id).hide();

							var navView = $('[nav-view="active"]');
							if (navView.length == 0) {
								navView = $('[nav-view="staged"]');
								if (navView.length == 0) {
									navView = $('[nav-view="entering"]');
								}
							}

							if ($state.current.name != 'profile') {

								vm.popup = $ionicPopup.alert({
									title: 'Hoppla...',
									template: data.msg,
									buttons: [
										{
											text: 'OK',
											onTap: function(e) {
												if (typeof data.error_typ != 'undefined' && data.error_typ == 'no_slots') {

													var newKasse = (params.kasse_privat == 'kasse') ? 'privat' : 'kasse',
														tmpElement = navView.find('#otb-insurance-type-' + newKasse);

													$timeout(function() {
														tmpElement.triggerHandler('click');
														newKasse = tmpElement = undefined;
													}, 0);
												}
											}
										}
									]
								});

							} else {
								me.errorOccured = true;
								angular.element('.jam-next-page.show-otb-step-2a-button').addClass('jam-button-inactive').attr('disabled', true);

								var tmpElement = navView.find('#' + me.current_page_id + ' .jam-otb'),
									tmpLeft = Math.round((($(tmpElement).width() + 3) / 2) - 130),
									html;

								html = '<div class="kalender_info_container" style="margin-top: -' + Math.round((angular.element('#' + me.current_page_id + ' .kalender_slider').height() / 2) + 100) + 'px; position: relative; width: 260px; left: ' + tmpLeft + 'px;">' +
											'<div class="kalender_info" style="left: initial;">' +
												'<div style="white-space: normal;">' +
													data.msg +
												'</div></div></div>';

								$('.kalender_info_container').remove();
								$('#' + me.current_page_id + ' .kalender_slider').children().append(html);

								html = navView = tmpElement = tmpLeft = undefined;
							}
						}
					}).error(function() {

						me.ajax_is_loading = false;
						me.errorOccured = true;
						angular.element('#' + me.current_page_id + ' .kalender_ausgegraut_msg').html('');
						angular.element('.jam-next-page.show-otb-step-2a-button').addClass('jam-button-inactive').attr('disabled', true);


						// GATRACKING
						AnalyticsHelper.trackEvent('OTB - Aufrufe', 'Fehler beim Laden der Termine');

						vm.popup = $ionicPopup.alert({
							title: 'Hoppla...',
							template: 'Beim Laden der Termine ist ein Fehler aufgetreten.'
						});
					});

				} else {

					me.errorOccured = false;
					// wenn Woche schon geladen, Pfeile wieder aktivieren
					if (me.cur_startDay_visible > me.cur_startDay) {
						$('#' + me.current_page_id + ' .jamOTV.ion-chevron-left').show().removeClass('pfeil_weiter_disabled');
					}
					$('#' + me.current_page_id + ' .jamOTV.ion-chevron-right').show().removeClass('pfeil_weiter_disabled');
				}
			}
		};


		AppointmentCalendar.prototype.loadWeeksSuccess = function(response) {

			var me = this;
			me.ajax_is_loading = false;

			if (!$('#' + me.current_page_id + ' #kalender_container' + current_profil.ref_id).is(':visible')) {
				return false;
			}
			$timeout(function() {

				if (response.ergebnis == 'ok' && response.loadedweeks) {

					$('#' + me.current_page_id + ' .kalender_info_container_slots').remove();

					// globale, einmalige Sachen, zum einmaligen Bereinigen
					if (me.loadedweeks.length == 0) {
						var KalenderIDsInResult = [],
							first_termin_over_all_obj = (response.first_termin_over_all) ? new Date(Date.parse(response.first_termin_over_all)) : false,
							slideTo = (first_termin_over_all_obj) ? first_termin_over_all_obj.getTime() / 1000 : false,
							cur_startDay_Obj = new Date(me.cur_startDay_visible * 1000),
							cur_endDay_Obj = new Date(me.cur_startDay_visible * 1000 + (86500000 * 6));

						$('#' + me.current_page_id + ' .jamOTV.kalender_head_text').html(me.getHeader(cur_startDay_Obj, cur_endDay_Obj));
					}

					// ist ein Fehler aufgetreten? Keine Termine, oder bietet keine Termine an?
					if (response.loadedweeks[0].results[0].no_slots) {

						// Arzt bietet keine Termine für Kasse/Privatpatienten an
						var insuranceType = (me.load_params.insuranceType != 'kasse') ? 'Privatpatienten' : 'Kassenpatienten';
							msg = me.Kalender[response.loadedweeks[0].results[0].ref_id].cur_eintrag.name_kurz+' bietet keine Online-Termine für '+insuranceType+' an.';
						me.showMessage(me.Kalender[response.loadedweeks[0].results[0].ref_id], response.loadedweeks[0].weekstart, msg);

					} else if(response.loadedweeks[0].results[0].isAbsent) {

						// Arzt hat Urlaub
						var curKalObj = me.Kalender[response.loadedweeks[0].results[0].ref_id],
							msg = 'Die Praxis von ' + curKalObj.cur_eintrag.name_kurz + ' ist vom ' + curKalObj.absenceStart + ' bis zum ' + curKalObj.absenceEnd + ' geschlossen und nimmt deshalb derzeit keine Terminbuchungen entgegen.';
						me.showMessage(curKalObj, response.loadedweeks[0].weekstart, msg);

					} else {

						// einzelne Kalender updaten
						for (var w in response.loadedweeks) {
							if (me.loadedweeks.indexOf(response.loadedweeks[w].week) === -1) {

								me.loadedweeks.push(response.loadedweeks[w].week);

								for (var i in response.loadedweeks[w].results) {
									var curKalResult = response.loadedweeks[w].results[i],
										curKalObj = me.Kalender[curKalResult.ref_id],
										append_html = '',
										append_html_header = '';

									// Termine ins Kalender-Objekt speichern
									curKalObj.termine['week' + response.loadedweeks[w].week] = { 'filled_weekdays': 0 };
									for (var dayTimestamp in curKalResult.termine) {
										var curDay_Obj = new Date(dayTimestamp * 1000),
											curWeekday = (curDay_Obj.getDay() == 0) ? 7 : curDay_Obj.getDay();
										curKalObj.termine['week'+response.loadedweeks[w].week]['weekday' + curWeekday] = curKalResult.termine[dayTimestamp];
										curKalObj.termine['week'+response.loadedweeks[w].week].filled_weekdays++;
									}

									// Erstinitialisierung eines Kalenders
									if (!curKalObj.kalender_inited) {
										KalenderIDsInResult.push(curKalResult.ref_id);
										curKalObj.kalender_inited = true;
										curKalObj.termin_vorlauf = curKalResult.calced_vorlauf;
										$('#' + me.current_page_id + ' #kalender_container' + curKalObj.cur_eintrag.ref_id + ' .init_week').hide();
										$('#' + me.current_page_id + ' #kalender_ausgegraut' + curKalObj.cur_eintrag.ref_id).fadeOut(200);
									}

									// Wochen ausgeben / anhängen // ota-kalender-container
									if ($('#' + me.current_page_id + ' #kalender_container' + curKalObj.cur_eintrag.ref_id + ' .week_' + response.loadedweeks[w].week).length == 0) {
										var tmp = me.outputWeek(curKalObj.cur_eintrag.ref_id, response.loadedweeks[w].weekstart);
										if (tmp !== false) {
											append_html_header += tmp.html_header;
											append_html += tmp.html;
										}
									}

									if (response.prev_or_next == 'prev' || (response.num_weeks_min_load == 3 && w == 0)) { // Kalender vor HTML-Append eins nach links schieben, weil links eine Woche Puffer geladen wurde. Bei Pfeil-Links-Klick oder wenn Woche in Zukunft geladen und erste (Puffer)-Woche wird gerade eingefügt
										var slideRange = (kalender_day_column_width * 7),
											move_slider = '-=' + slideRange;
									} else {
										$('#' + me.current_page_id + ' #kalender_container' + curKalObj.cur_eintrag.ref_id + ' #kalender_slider_header').append(append_html_header);
										$('#' + me.current_page_id + ' #kalender_container' + curKalObj.cur_eintrag.ref_id + ' .kalender_slider #kalender_slider_content').append(append_html);
									}
								}
							}
						}

						// restliche Listeneinträge/Kalender entfernen, die nicht im Result enthalten waren (weil z.B. nicht richtig konfiguriert)
						if (typeof KalenderIDsInResult == 'object') {
							for (var i in me.KalenderIDs) {
								if (KalenderIDsInResult.indexOf(me.KalenderIDs[i]) === -1) {
									me.Kalender[me.KalenderIDs[i]] = null;
									$('#' + me.current_page_id + ' #kalender_container'+me.KalenderIDs[i]).parent().parent().remove();
								}
							}
							me.KalenderIDs = KalenderIDsInResult;
						}

						// zu frühestem Termin sliden (einmalig zum Init)
						if (slideTo) {
							while (me.cur_startDay_visible + (87000 * 6) < slideTo) {
								me.slideKalender('links', false, 0);
							}
						}

						// Pfeile wieder aktivieren
						if (me.cur_startDay_visible > me.cur_startDay) {
							$('#' + me.current_page_id + ' .jamOTV.ion-chevron-left').show().removeClass('pfeil_weiter_disabled');
						}
						$('#' + me.current_page_id + ' .jamOTV.ion-chevron-right').show().removeClass('pfeil_weiter_disabled');
					}

					// Scroller aktivieren
					$.each($('#' + me.current_page_id + ' .kalender_week'), function(key, weekElement) {
						if ($(weekElement).height() > calendarWeekHeight)
						//noinspection JSUnresolvedVariable
							calendarWeekHeight = $(weekElement).height();
					});

					// Höhe für Scroller setzen
					$('#' + me.current_page_id + ' #kalender_slider_content').height(calendarWeekHeight + 'px');
					$('#' + me.current_page_id + ' #kalender_slider_content .kalender_day_column').css('min-height', calendarWeekHeight + 'px');

				} else {

					$('#' + me.current_page_id + ' .kalender_ausgegraut_msg').html('');
					$('#' + me.current_page_id + ' #kalender_ausgegraut' + current_profil.ref_id).fadeOut(200);

					if (response.error_typ && response.error_typ == 'no_slots') {

						// Enstprechende Meldung im Kalender ausgeben
						$timeout(function () {

							var navView = $('[nav-view="active"]');
							if (navView.length == 0) {
								navView = $('[nav-view="staged"]');
								if (navView.length == 0) {
									navView = $('[nav-view="entering"]');
								}
							}

							var tmpElement = navView.find('#' + me.current_page_id + ' .jam-otb'),
								tmpLeft = Math.round((($(tmpElement).width() + 3) / 2) - 130),
								msg = response.msg,
								html;

							msg = msg.replace('der Arzt', current_profil.name_kurz);

							// GATRACKING
							AnalyticsHelper.trackEvent('OTB-Prozess - Fehlermeldungen', 'Leider hat der Arzt keine buchbaren Zeiten');

							html = '<div class="kalender_info_container kalender_info_container_slots" style="margin-top: -' + Math.round(($('#' + me.current_page_id + ' .kalender_slider').height() / 2) + 80) + 'px; position: relative; width: 260px; left: ' + tmpLeft + 'px;"><div class="kalender_info" style="left: initial;"><div style="white-space:normal;">' + msg + '</div></div></div>';
							$('#' + me.current_page_id + ' .kalender_slider').children().append(html);

						}, 200);

					} else if (!response.loadedweeks) {

						// OTB wurde deaktiviert! Damit das Profil neu geladen wird, müssen wir hier den Cache löschen
						$('#' + me.current_page_id + ' .jam-otb').remove();
						JamHelperFactory.clearLocalStorageKey('profileCache');

					} else {

						vm.popup = $ionicPopup.alert({
							title: 'Hoppla...',
							template: response.msg || 'Es ist ein Fehler beim Laden aufgetreten'
						});
					}

					/*if (_gaq) {
					 _gaq.push(['_trackEvent', 'Profil - Aktionen', 'OTB Fehler beim Termine laden', me.KalenderIDs[0]]);
					 }*/
				}
			}, 400);
		};


		AppointmentCalendar.prototype.showMessage = function(curKalObj, weekstart, msg) {

			var append_html = '',
				append_html_header = '',
				tmp = this.outputWeek(curKalObj.cur_eintrag.ref_id, weekstart, msg);

			if (tmp !== false) {
				append_html_header += tmp.html_header;
				append_html += tmp.html;
			}

			$('#' + this.current_page_id + ' #kalender_container' + curKalObj.cur_eintrag.ref_id + ' .init_week').hide();
			$('#' + this.current_page_id + ' #kalender_ausgegraut' + curKalObj.cur_eintrag.ref_id).fadeOut(200);

			$('#' + this.current_page_id + ' #kalender_container' + curKalObj.cur_eintrag.ref_id + ' #kalender_slider_header').append(append_html_header);
			$('#' + this.current_page_id + ' #kalender_container' + curKalObj.cur_eintrag.ref_id + ' .kalender_slider #kalender_slider_content').append(append_html);
		};

		AppointmentCalendar.prototype.outputWeek = function(ref_id, startDay, errorMsg) {

			errorMsg = errorMsg || false;

			var startDay_Obj = new Date(startDay * 1000),
				week_id = JamHelperFactory.getWeekNumber(startDay_Obj, true).join('_'),
				html = '<div class="week_' + week_id + ' kalender_week">',
				html_header = '<div id="week_header_' + week_id + '" class="kalender_week_header">',
				visibleTermineWeek = 0,
				curCssWidth,
				curCssHeight,
				fullRefId = (typeof $state.params.fullRefId != 'undefined') ? $state.params.fullRefId : ref_id;

			if ($('.jam-page-'+$state.current.name+' #kalender_container'+ref_id+' #week_header_' + week_id).length > 0) {
				return false;
			}

			if (typeof kalender_day_column_height == 'undefined' || kalender_day_column_height <= 0)
				//noinspection JSUnresolvedVariable
				kalender_day_column_height = 135;
			if (typeof kalender_day_column_width == 'undefined' || kalender_day_column_width <= 0) {
				//noinspection JSUnresolvedVariable
				kalender_day_column_width = Math.round((angular.element('#'+$state.current.name+'-'+$state.params.fullRefId+' .jam-otb').width() + 3) / 7);
			}

			curCssWidth = 'width: ' + kalender_day_column_width + 'px; ';
			curCssHeight = 'min-height: ' + kalender_day_column_height + 'px; ';

			if (!errorMsg) {
				for (var i=0; i<=6; i++) {

					var curDay_Obj = new Date(startDay * 1000 + (i * 86500000)),
						is_current_day = (curDay_Obj.getDate() == this.cur_datum_obj.tag && curDay_Obj.getMonth() + 1 == this.cur_datum_obj.monat && curDay_Obj.getFullYear() == this.cur_datum_obj.jahr) ? true : false,
						curWeekday = (curDay_Obj.getDay() == 0) ? 7 : curDay_Obj.getDay(),
						termineToday = this.Kalender[ref_id].termine['week' + week_id]['weekday' + curWeekday],
						visibleTermine = 0,

						// set classes
						colClass = (i%2 == 0) ? 'even' : 'odd',
						dayClass = ((curDay_Obj.getMonth() < dateToday.getMonth() && curDay_Obj.getFullYear() < dateToday.getFullYear()) || (curDay_Obj.getMonth() == dateToday.getMonth() && curDay_Obj.getDate() == dateToday.getDate() && curDay_Obj.getFullYear() == dateToday.getFullYear())) ? 'kalender_weekday_disabled' : '',
						headClass = (i == 0) ? 'first' : '';

					headClass += (is_current_day) ? ' kalender_day_head_current' : '';

					// Header html
					html_header +=	'<div class="kalender_day_header_column" style="' + curCssWidth + '">';
					html_header +=		'<div class="kalender_day_head' + headClass + '">';
					html_header += 			'<div class="kalender_weekday ' + dayClass + '">' + CONFIG.weekDays[curDay_Obj.getDay()] + '.</div>';
					html_header += 			'<div class="kalender_daydate">' + curDay_Obj.getDate() + '.' + (curDay_Obj.getMonth() + 1) + '.</div>';
					html_header += 		'</div>';
					html_header += 	'</div>';

					// Calendar html
					html +=	'<div class="kalender_day_column ' + colClass + '" style="' + curCssWidth + curCssHeight + '">';

					for (var j in termineToday) {

						var curTermin = new Date(Date.parse(termineToday[j].start)),
							curTerminStamp = curTermin.getTime()/1000,
							curTerminStd = ((curTermin.getHours() < 10) ? "0" + curTermin.getHours() : curTermin.getHours()),
							curTerminMin = ((curTermin.getMinutes() < 10) ? "0" + curTermin.getMinutes() : curTermin.getMinutes()),
							is_preselected = (this.Kalender[ref_id].selected_termine.indexOf(curTerminStamp) !== -1) ? 'rounded_button_aktiv' : '';

						if ($state.current.name == 'profile') {
							html +=	'<a onclick="jamOTVKalProfil.selectZeit(this, ' + ref_id + ', ' + curTerminStamp + ', false, \'' + fullRefId + '\');" class="terminlink' + curTerminStamp + ' kalender_zeit rounded_button ' + is_preselected + '">' + curTerminStd + ':' + curTerminMin + '</a>';
						} else {
							html +=	'<a onclick="jamOTVKalOtb1.selectZeit(this, ' + ref_id + ', ' + curTerminStamp + ', false, \'' + fullRefId + '\');" class="terminlink' + curTerminStamp + ' kalender_zeit rounded_button ' + is_preselected + '">' + curTerminStd + ':' + curTerminMin + '</a>';
						}
						visibleTermine++;
					}

					// add empty div for min-height
					if (i == 6) html += '<div class="kalender_minheight"></div>';

					html +=	'</div>';

					// appointment counter
					visibleTermineWeek += visibleTermine;
				}
			}

			// Fehler Container aufbauen (nur anzeigen, wenn isError auf true gesetzt wird)
			var isError = true,
				errorContainer = '<div class="kalender_info_container"><div class="kalender_info" style="'+((CONFIG.windowWidth-83 > 276 && $state.current.name == 'profile') ? (CONFIG.deviceOs == 'Android') ? "" : "": "")+'"><div style="white-space:normal;">';

			if (errorMsg != false) {
				errorContainer += errorMsg;

			} else if (this.Kalender[ref_id].termine.length == 0) {
				errorContainer += 'Leider sind keine Termine verfügbar. Bitte kontaktieren<br>Sie ' + this.Kalender[ref_id].cur_eintrag.name_kurz + ' telefonisch unter ' + this.Kalender[ref_id].cur_eintrag.tel + '.';

			} else if (visibleTermineWeek == 0) {
				var tmpOnclick = ($state.current.name == 'profile') ? "return jamOTVKalProfil.slideKalender('links',this);" : "return jamOTVKalOtb1.slideKalender('links',this);";
				errorContainer += 'Leider sind in dieser Woche keine Online-Termine mehr verfügbar.<br />Versuchen Sie es bitte telefonisch oder zu einem <a onclick="' + tmpOnclick + '" class="link-mehr">späteren Zeitpunkt</a>.';

			} else {
				// Kein Fehler aufgetreten? Setze isError auf false um keine Meldung anzuzeigen
				isError = false;
			}

			errorContainer += '</div></div></div>';

			if (isError) {
				html += errorContainer;
			}

			html +=	'</div>';
			html_header += '</div>';

			return { html: html, html_header: html_header };
		};


		AppointmentCalendar.prototype.selectZeit = function(selbst, ref_id, timestamp, is_preselect, fullRefId) {

			if (selbst === false || !$(selbst).hasClass('rounded_button_aktiv')) {

				if (this.ajax_is_loading === true) return false;

				$('#' + this.current_page_id + ' .rounded_button_aktiv').removeClass('rounded_button_aktiv');
				$(selbst).addClass('rounded_button_aktiv');

				// get otb data
				var otbData = JamHelperFactory.getOtbDataFromCache(fullRefId),
					tmpParams;

				if ($state.current.name == 'profile') {
					var val = $('.otb1-content select[name="service"]:last').val();
					if (val != 'select') {
						otbData.serviceId = parseInt(val);
					}
				}

				// set data
				otbData.insuranceType = otbData.kasse_privat;
				otbData.appointmentStart = timestamp;
				otbData.formattedDate = JamHelperFactory.formatDate(timestamp, true);
				otbData.formattedDateLong = JamHelperFactory.formatDate(timestamp, false);

				JamHelperFactory.addOtbDataToCache(otbData);

				this.Kalender[ref_id].selected_termine = [timestamp];

				// show loader
				$('#' + this.current_page_id + ' #kalender_ausgegraut' + ref_id).show();

				// do stuff depending on current page
				if ($state.current.name == 'profile') {
					is_preselect = is_preselect || false;
					if (!is_preselect) {

						// GATRACKING
						AnalyticsHelper.trackEvent('Profil - Klicks', 'OTB Termin geklickt');

						$ionicViewSwitcher.nextDirection('forward');
						$state.go('otb', { path: 'profil', curStepId: 'schritt-3', fullRefId: fullRefId });
					}
				} else {

					// hide calendar
					$('#' + this.current_page_id + ' #otb1-calendar-box').slideUp();

					// set new date
					$('#' + this.current_page_id + ' .appointment-date').html(otbData.formattedDate);

					// checkOtb1Termin
					//noinspection JSUnresolvedVariable
					selectedTerminIsChecked = false;
					tmpParams = {
						from: 'versichselect',
						ref_id: current_profil.ref_id,
						kasse_privat: otbData.insuranceType,
						dauer: otbData.serviceDuration,
						fullRefId: otbData.fullRefId,
						skipCheckTermin: true
					};
					jamOTVKalOtb1.checkTermin(tmpParams);
				}
			} else {
				this.removeSelectedTermin(ref_id, timestamp);
			}
			this.checkTerminContainer(ref_id);

			otbData = tmpParams = undefined;
			return false;
		};


		AppointmentCalendar.prototype.removeSelectedTermin = function(ref_id, timestamp) {
			delete this.Kalender[ref_id].selected_termine.splice(this.Kalender[ref_id].selected_termine.indexOf(timestamp), 1);
			$('#' + this.current_page_id + ' #kalender_container' + ref_id + ' .terminlink' + timestamp).removeClass('rounded_button_aktiv');
			$('#' + this.current_page_id + ' #selectedTermin_' + timestamp).slideUp(400, function(){$(this).remove()});
			this.checkTerminContainer(ref_id);
			return false;
		};


		AppointmentCalendar.prototype.checkTermin = function(params) {

			// get otb data
			var otbData = JamHelperFactory.getOtbDataFromCache(params.fullRefId),
				skipCheckTermin = params.skipCheckTermin || false,
				navView = angular.element('[nav-view="active"]'),
				me = this;

			if (otbData.serviceId == '0') otbData.serviceId = '?';

			// Wenn Terminkalender offen, dann neu initen
			if (navView.length == 0) {
				navView = angular.element('[nav-view="staged"]');
				if (navView.length == 0) {
					navView = angular.element('[nav-view="entering"]');
				}
			}

			if ($state.current.name == 'otb' && navView.find('#otb1-calendar-box:hidden').length == 0 && !skipCheckTermin) {
				if (otbData.serviceId == 0) {
					this.initKalender({
						fullRefId: otbData.fullRefId,
						kasse_privat: otbData.insuranceType,
						useApi: me.load_params.useApi || false
					});
				} else {
					otbData.dauer = jamTmpDuration;
					otbData.useApi = me.load_params.useApi || false;
					this.initKalender(otbData);
				}
				return false;
			}

			// check values
			if (otbData.serviceId == 0 || typeof me.Kalender[params.ref_id] == 'undefined') {

				$('#' + me.current_page_id + ' #ota_form_preisspanne').html('k.A.');
				$('#' + me.current_page_id + ' #ota_form_preisspanne_container').show();
				$('#' + me.current_page_id + ' #messages_container_title').hide();
				$('#' + me.current_page_id + ' #messages_container').hide();

				// add margin
				$('#' + me.current_page_id + ' .otb-message-to-doctor-box').addClass('no-message-margin');
				angular.element('.otb-service-info').show();
				return false;
			}

			// Termin checken
			if (typeof me.Kalender[params.ref_id].selected_termine[0] != 'undefined') {

				var tmpDate = (!Date.now()) ? new Date().getTime() : Date.now(),
					params = {
						which: 'check_termin',
						from: params.from,
						ref_id: params.ref_id,
						kasse_privat: params.kasse_privat,
						serviceId: (params.serviceId == 0) ? '' : params.serviceId,
						isSameServiceName: params.isSameServiceName || false,
						dauer: jamTmpDuration,
						termin: this.Kalender[params.ref_id].selected_termine[0]
					};

				angular.element('button').removeClass('jam-button-inactive').attr('disabled', false);

				JamSyncService.ajax(CONFIG.apiUrl + '/_scripts/ajax.php', params).success(function(data) {

					if (typeof data.data != 'undefined') {
						data = data.data;

						if (data.ergebnis == 'error' || data.ergebnis == 'no') {

							angular.element('.otb-service-info').hide();
							angular.element('#' + me.current_page_id + ' #ota_form_preisspanne_container').hide();
							angular.element('#' + me.current_page_id + ' #messages_container_title').hide();
							angular.element('#' + me.current_page_id + ' #messages_container').hide();

							angular.element('#ota_service_error .content-box-red br').show();
							angular.element('#ota_service_error .content-box-red a.button').show();
							angular.element('.jam-next-page.show-otb-step-2a-button').addClass('jam-button-inactive').attr('disabled', true);

							if ($state.current.name == 'otb') {
								angular.element('#' + me.current_page_id + ' #ota_service_error .content-box-red p span').html(data.msg);
								angular.element('#' + me.current_page_id + ' #ota_service_error').show();

								if (typeof data.error_typ != 'undefined' && data.error_typ == 'no_slots') {
									angular.element('#ota_service_error .content-box-red br').hide();
									angular.element('#ota_service_error .content-box-red a.button').hide();
								}
							}
						} else {

							//noinspection JSUnresolvedVariable
							selectedTerminIsChecked = true;

							// Fehler ausblenden
							if ($state.current.name == 'otb') {
								me.showServiceInformations(otbData);
								$('#' + me.current_page_id + ' #ota_service_error').hide();
							}
						}
					}
				}).error(function() {

					var tmpDate2 = (!Date.now()) ? new Date().getTime() : Date.now();

					if (tmpDate2-tmpDate < 120000) {
						// Show Error-Alert
						vm.popup = $ionicPopup.alert({
							title: 'Hoppla...',
							template: 'Beim Überprüfen des Termins ist ein Fehler aufgetreten.'
						});
					}
				});
			}
			return false;
		};

		AppointmentCalendar.prototype.showServiceInformations = function(otbData) {

			var me = this;

			angular.element('.otb-service-info').show();

			// Preisspanne und Behandlungsgrund-Beschreibung anzeigen
			if (current_profil.otb && typeof current_profil.otb == 'object' && typeof current_profil.otb.services[otbData.serviceId] == 'object') {

				var curService = current_profil.otb.services[otbData.serviceId],
					preis = 'k.A.';

				if (curService.min_price && curService.min_price > 0) {
					if (curService.max_price && curService.max_price > 0) {
						preis = curService.min_price + '-' + curService.max_price + ' &euro;';
					} else {
						preis = curService.min_price + ' &euro;';
					}
				}

				$('#' + me.current_page_id + ' #ota_form_preisspanne').html(preis);
				$('#' + me.current_page_id + ' #ota_form_preisspanne_container').show();

				if (current_profil.otb.services[otbData.serviceId].description != '') {
					$('#' + me.current_page_id + ' #messages_container').html(current_profil.otb.services[otbData.serviceId].description).show();
					$('#' + me.current_page_id + ' #messages_container_title').show();

					// remove margin
					$('#' + me.current_page_id + ' .otb-message-to-doctor-box').removeClass('no-message-margin');
				} else {
					$('#' + me.current_page_id + ' #messages_container_title').hide();
					$('#' + me.current_page_id + ' #messages_container').hide();

					// add margin
					$('#' + me.current_page_id + ' .otb-message-to-doctor-box').addClass('no-message-margin');
				}

			} else {
				$('#' + me.current_page_id + ' #ota_form_preisspanne').html('k.A.');
				$('#' + me.current_page_id + ' #messages_container_title').hide();
				$('#' + me.current_page_id + ' #messages_container').hide();

				// add margin
				$('#' + me.current_page_id + ' .otb-message-to-doctor-box').addClass('no-message-margin');
			}

		};


		AppointmentCalendar.prototype.checkTerminContainer = function(ref_id) {
			if (this.Kalender[ref_id].selected_termine.length > 0) {
				$('#' + this.current_page_id + ' #kalender_selected_desc').hide();
				$('#' + this.current_page_id + ' #kalender_selected').show();
				$('#' + this.current_page_id + ' #weiter_button').addClass('but-b');
			} else {
				$('#' + this.current_page_id + ' #kalender_selected_desc').show();
				$('#' + this.current_page_id + ' #kalender_selected').hide();
				$('#' + this.current_page_id + ' #weiter_button').removeClass('but-b');
			}
		};


		AppointmentCalendar.prototype.getWeekStartTimestamp = function(stamp) {
			var d = new Date(stamp * 1000);
			var day = d.getDay();
			var diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
			var start = new Date(d.setDate(diff));
			start.setHours(0);
			start.setMinutes(0);
			start.setSeconds(0);
			return start.getTime()/1000;
		};


		AppointmentCalendar.prototype.slideKalender = function(richtung, selbst, speed) {

			var me = this;
			if (me.ajax_is_loading == true) {
				return false;
			}

			if (!$(selbst).hasClass('pfeil_weiter_disabled') || selbst === false) {

				me.ajax_is_loading = true;
				var slideRange = (kalender_day_column_width * 7);

				$('#' + me.current_page_id + ' .jamOTV.pfeil_weiter').addClass('pfeil_weiter_disabled');
				$('#' + me.current_page_id + ' .jamOTV.pfeil_weiter_ohnetext').addClass('pfeil_weiter_disabled');
				if (richtung == 'links') {
					var next_startDay = me.getWeekStartTimestamp(me.cur_startDay_visible + (86400 * 8)), // sicher in die nächste Woche (darum 8)
						move_slider = '-=' + slideRange,
						move_title_dir = -1;
				} else if (richtung == 'rechts') {
					var next_startDay = me.getWeekStartTimestamp(me.cur_startDay_visible - (86400 * 2)), // sicher in die vorherige Woche (darum 2)
						move_slider = '+=' + slideRange,
						move_title_dir = 1;
				}

				var next_startDay_Obj = new Date(next_startDay * 1000),
					next_endDay_Obj = new Date(next_startDay * 1000 + (87000000 * 6)),
					first_i_with_ani = 'unset';

				if (typeof speed == 'undefined') speed = 1000;

				for (var i in me.KalenderIDs) {
					var cur_speed = (JamHelperFactory.isScrolledIntoView($('#' + me.current_page_id + ' #kalender_container' + me.KalenderIDs[i] + ' .kalender_slider'))) ? speed : 0; // nur Kalender im Viewport animieren
					first_i_with_ani = (cur_speed > 0 && first_i_with_ani == 'unset') ? i : first_i_with_ani;
					var cur_delay = (cur_speed>0) ? 100*(i-first_i_with_ani) : 0;
					$timeout( function() {
						$('#' + me.current_page_id + ' #kalender_container' + me.KalenderIDs[i] + ' .kalender_slider').animate({'margin-left': move_slider}, cur_speed, 'swing', function() { $('#' + me.current_page_id + ' .ota-arrow').stop().fadeOut(300); });
						$('#' + me.current_page_id + ' #kalender_container' + me.KalenderIDs[i] + ' #kalender_slider_header').animate({'margin-left': move_slider}, cur_speed, 'swing', function() { $('#' + me.current_page_id + ' .ota-arrow').stop().fadeOut(300); });
					}, cur_delay);
				}

				me.ajax_is_loading = false;
				me.cur_startDay_visible = next_startDay;
				me.loadWeeks((richtung == 'rechts') ? 'prev' : 'next');

				$('#' + me.current_page_id + ' .jamOTV.kalender_head_text').animate({ 'margin-left': 150 * move_title_dir, opacity: 0 }, speed*0.4, function() {
					var header_output = me.getHeader(next_startDay_Obj,next_endDay_Obj,this);
					$(this).html(header_output).css({ 'margin-left': -150 * move_title_dir, opacity: 0 }).animate({ 'margin-left': 0, opacity: 1 }, speed * 0.4);
				});

				// GATRACKING
				if ($state.current.name == 'profile') {
					AnalyticsHelper.trackEvent('Profil - Klicks', 'OTB - Pfeil geklickt');
				} else {

				}
			}
			return false;
		};


		AppointmentCalendar.prototype.getHeader = function(startDay_Obj, endDay_Obj) {
			return startDay_Obj.getDate()+'. ' + CONFIG.months[startDay_Obj.getMonth()]+'&nbsp;&nbsp;-&nbsp;&nbsp;'+endDay_Obj.getDate()+'. ' + CONFIG.months[endDay_Obj.getMonth()];
		};


		AppointmentCalendar.prototype.getOtbInsuranceType = function() {

			// TODO current_profil
			if (typeof current_profil == 'undefined') return 'kasse';

			// Check ob vom Benutzer bereits ein Versicherungs Typ gewählt wurde
			if (otbUserInsuranceType !== false) {
				return otbUserInsuranceType;
			}

			// Check ob Arzttyp HP, TA oder HE, dann privat anzeigen
			if (current_profil.typ == 'HP' || current_profil.typ == 'HP-s' || current_profil.typ == 'TA' || current_profil.typ == 'HE') {
				return 'privat';
			}

			// Check ob Arzttyp ZA oder HA --> Dann nach abrtyp gehen
			if (current_profil.typ == 'ZA' || current_profil.typ == 'HA') {
				return (current_profil.abrtyp == 2) ? 'privat' : 'kasse';
			}

			// In allen anderen Fällen --> kasse
			return 'kasse';
		};
		return AppointmentCalendar;
	}
})();