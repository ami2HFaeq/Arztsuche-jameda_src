(function () {
	'use strict';

	angular
		.module('app.searchResultList',[])
		.config(function($stateProvider) {

			$stateProvider

				.state('searchResultList', {
					url: "/ergebnisliste/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps&isSearch",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false,
						isSearch: true
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultList.arztsuche', {
					url: "/arztsuche/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps&isSearch",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false,
						isSearch: true
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchAppointment', {
					url: "/termine/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps&isSearch",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false,
						isSearch: true
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListFachgebiet', {
					url: "^/{path:.*}/fachgebiet/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListGruppe', {
					url: "^/{path:.*}/gruppe/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListStadt', {
					url: "^/{path:.*}/stadt/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListLand', {
					url: "^/{path:.*}/land/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListPostleitzahl', {
					url: "^/{path:.*}/postleitzahl/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListBehandlung', {
					url: "^/{path:.*}/behandlung/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListFachaerzte', {
					url: "^/{path:.*}/fachaerzte/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListGruppe-land', {
					url: "^/{path:.*}/gruppe-land/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListStadtteil', {
					url: "^/{path:.*}/stadtteil/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListSpezialisten', {
					url: "^/{path:.*}/spezialisten/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListGruppe-postleitzahl', {
					url: "^/{path:.*}/gruppe-postleitzahl/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListPlz-ort', {
					url: "^/{path:.*}/plz-ort/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListBehandlung-land', {
					url: "^/{path:.*}/behandlung-land/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListArzt-stadt', {
					url: "^/{path:.*}/arzt-stadt/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListAerzte-behandlung', {
					url: "^/{path:.*}/aerzte-behandlung/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListFachgebiet-land', {
					url: "^/{path:.*}/fachgebiet-land/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListEmpfehlung-land', {
					url: "^/{path:.*}/empfehlung-land/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListEmpfehlung-stadt', {
					url: "^/{path:.*}/empfehlung-stadt/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListAerzte-stadtteil', {
					url: "^/{path:.*}/aerzte-stadtteil/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListEmpfehlung-behandlung', {
					url: "^/{path:.*}/empfehlung-behandlung/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListPraxis-behandlung', {
					url: "^/{path:.*}/praxis-behandlung/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListempfehlung-postleitzahl', {
					url: "^/{path:.*}/empfehlung-postleitzahl/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListpraxis-postleitzahl', {
					url: "^/{path:.*}/praxis-postleitzahl/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListarztgruppe', {
					url: "^/{path:.*}/arztgruppe/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListaerzte-land', {
					url: "^/{path:.*}/aerzte-land/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListspezialist-stadtteil', {
					url: "^/{path:.*}/spezialist-stadtteil/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListlandaerzte', {
					url: "^/{path:.*}/landaerzte/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListstadtaerzte', {
					url: "^/{path:.*}/stadtaerzte/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListempfehlung-stadtteil', {
					url: "^/{path:.*}/empfehlung-stadtteil/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListpraxis', {
					url: "^/{path:.*}/praxis/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListspezialist', {
					url: "^/{path:.*}/spezialist/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListpostleitzahl-aerzte', {
					url: "^/{path:.*}/postleitzahl-aerzte/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListstadtteil-aerzte', {
					url: "^/{path:.*}/stadtteil-aerzte/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListdeutschland', {
					url: "^/{path:.*}/deutschland/?was&skpid&was_i&was_sel&gruppe&fachgebiet&namen&kid&kuid&address&address_i&address_sel&geoball&geo&dist&fsid&curGeoPos&loadnewpage&search&ajaxparams[]&reset_all_filter&showMaps",
					params: {
						'ajaxparams[]': { array: true },
						isAddressChanged: "false",
						historyBack: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultList.html"
						}
					}
				})

				.state('searchResultListSub', {
					url: "^/{path:.*}arztsuche/auswahl/uebersicht/:refId/",
					params: {
						'refId': 0,
						isSearch: false
					},
					views: {
						'menuContent': {
							templateUrl: "app/searchResultList/searchResultListSub.html"
						}
					}
				});
		});
})();