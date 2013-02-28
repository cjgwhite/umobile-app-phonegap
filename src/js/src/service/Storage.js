/*global window:true, document:true, jQuery:true, _:true, umobile:true, config:true, GibberishAES:true, console:true */
(function ($, _, umobile, config) {
	'use strict';

	/**
	Manages persistence of data for the umobile application.

	@class Storage
	@submodule storage
	@namespace storage
	**/
	umobile.storage = umobile.storage || {};

	/**
	Method overrides Backbone.sync implementation
	to persist application data.

	@method sync
	**/
	umobile.storage.sync = function (storage, key) {
		storage.init();
		return function (method, model, options) {
			var id = model.id || key;
			var storageKey = key + '.' + model.id;
			switch (method) {
			case 'read':
				console.log('reading ' + storageKey);
				storage.getItem(
					storageKey,
					function (result) {
						if (result) {
							console.log('read ' + result);
							if (model.id) {
								model.set(JSON.parse(result));
							} else {
								var arr = JSON.parse(result);
								var modules = [];
								$(arr).each(function (idx, module) {
									modules.push(new model.model(module));
								});
								model.reset(modules);
							}
							options.success(model);
						} else {
							console.log('initializing new ' + storageKey + ' for ' + JSON.stringify(model));
							storage.setItem(storageKey, JSON.stringify(model));
							options.success(model);
						}
					}
				);
				break;
			case 'create':
				console.log('creating ' + storageKey + ': ' + JSON.stringify(model));
				storage.setItem(storageKey, JSON.stringify(model));
				options.success(model);
				break;
			case 'update':
				console.log('saving ' + storageKey + ': ' + JSON.stringify(model));
				storage.setItem(storageKey, JSON.stringify(model));
				options.success(model);
				break;
			case 'delete':
				console.log('removing ' + storageKey);
				storage.removeItem(storageKey);
				options.success(model);
				break;
			}
		};
	};

	/**
	Manages the persistance of data to local storage.

	@class Local
	@submodule storage
	@namespace storage
	**/
	umobile.storage.local = {
		init: function () {},
		getItem: function (storageKey, success) {
			return success(window.localStorage.getItem(storageKey));
		},
		setItem: function (storageKey, json) {
			window.localStorage.setItem(storageKey, json);
		},
		removeItem: function (storageKey) {
			window.localStorage.removeItem(storageKey);
		}
	};

	/**
	Manages the persistance of data to the umobile database.

	@class DB
	@submodule storage
	@namespace storage
	**/
	umobile.storage.db = {
		init: function () {
			var db = window.openDatabase('umobile', '1.0', 'uMobile DB', 1000000);
			db.transaction(
				function (tx) {
					tx.executeSql('CREATE TABLE IF NOT EXISTS umobile (id unique, data)');
				},
				function (tx, err) { console.log('Error processing SQL: ' + err); }
			);
		},
		getItem: function (storageKey, success) {
			var db = window.openDatabase('umobile', '1.0', 'uMobile DB', 1000000);
			db.transaction(
				function (tx) {
					tx.executeSql(
						'SELECT * FROM umobile WHERE id=?',
						[storageKey],
						function (tx, results) {
							if (results.rows.length > 0) {
								success(results.rows.item(0).data);
							} else {
								success(null);
							}
						},
						function (tx, err) { console.log('Error processing SQL: ' + err); }
					);
				},
				function (tx, err) { console.log('Error processing SQL: ' + err); }
			);

			return window.localStorage.getItem(storageKey);
		},
		setItem: function (storageKey, json) {
			var db = window.openDatabase('umobile', '1.0', 'uMobile DB', 1000000);
			db.transaction(
				function (tx) {
					tx.executeSql('DELETE FROM umobile WHERE id=?', [storageKey]);
					tx.executeSql('INSERT INTO umobile (id, data) VALUES (?, ?)', [storageKey, json]);
				},
				function (tx, err) { console.log('Error processing SQL: ' + err); }
			);
		},
		removeItem: function (storageKey) {
			var db = window.openDatabase('umobile', '1.0', 'uMobile DB', 1000000);
			db.transaction(
				function (tx) {
					tx.executeSql('DELETE FROM umobile WHERE id=?', [storageKey]);
				},
				function (tx, err) { console.log('Error processing SQL: ' + err); }
			);
			window.localStorage.removeItem(storageKey);
		}
	};

})(jQuery, _, umobile, config);