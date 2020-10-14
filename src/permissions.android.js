/**********************************************************************************
 * (c) 2016-2020, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 1.3.12                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/* jshint camelcase: false */
/* global android, Promise, java, require, exports */

const application = require('@nativescript/core/application');

//noinspection JSUnresolvedVariable,JSUnresolvedFunction
if (typeof application.AndroidApplication.activityRequestPermissionsEvent === 'undefined') {
	throw new Error("You must be using at least version 2.0 of the TNS runtime and core-modules!");
}

// Variables to track any pending promises
let pendingPromises = {}, promiseId = 3000, eventsAdded=0;
let androidSupport=null;


//noinspection JSUnresolvedVariable,JSUnresolvedFunction
/**
 * This handles the results of getting the permissions!
 */
function handlePermissionResults(args) {

	// get current promise set
	//noinspection JSUnresolvedVariable
	const promises = pendingPromises[args.requestCode];

	// We have either gotten a promise from somewhere else or a bug has occurred and android has called us twice
	// In either case we will ignore it...
	if (!promises || typeof promises.granted !== 'function') {
		console.warn("Handle Permissions was called with unknown request code", args.requestCode);
		return;
	}

	// Delete it, since we no longer need to track it
	//noinspection JSUnresolvedVariable
	delete pendingPromises[args.requestCode];

	let trackingResults = promises.results;

	//noinspection JSUnresolvedVariable
	const length = args.permissions.length;
	for (let i = 0; i < length; i++) {
		// Convert back to JS String
		//noinspection JSUnresolvedVariable
		const name = args.permissions[i].toString();

		//noinspection RedundantIfStatementJS,JSUnresolvedVariable,JSUnresolvedFunction
		if (args.grantResults[i] === global.android.content.pm.PackageManager.PERMISSION_GRANTED) {
			trackingResults[name] = true;
		} else {
			trackingResults[name] = false;
		}
	}

	// Any Failures
	let failureCount = 0;
	for (let key in trackingResults) {
		if (!trackingResults.hasOwnProperty(key)) continue;
		if (trackingResults[key] === false) failureCount++;
	}

	if (Object.keys(pendingPromises).length === 0) {
		removeEventListeners();
	}

	if (failureCount === 0) {
		promises.granted(trackingResults);
	} else {
		promises.failed(trackingResults);
	}

}

function handleApplicationResults(args) {
	// get current promise set
	//noinspection JSUnresolvedVariable
	const promises = pendingPromises[args.requestCode];

	// We have either gotten a promise from somewhere else or a bug has occurred and android has called us twice
	// In either case we will ignore it...
	if (!promises || typeof promises.granted !== 'function') {
		console.warn("Handle Application results was called with unknown request code", args.requestCode);
		return;
	}

	// Delete it, since we no longer need to track it
	//noinspection JSUnresolvedVariable
	delete pendingPromises[args.requestCode];

	let trackingResults = promises.results;
	trackingResults[promises.special] = hasPermission(promises.special);

	// Any Failures
	let failureCount = 0;
	for (let key in trackingResults) {
		if (!trackingResults.hasOwnProperty(key)) continue;
		if (trackingResults[key] === false) failureCount++;
	}

	if (Object.keys(pendingPromises).length === 0) {
		removeEventListeners();
	}

	if (failureCount === 0) {
		promises.granted(trackingResults);
	} else {
		promises.failed(trackingResults);
	}

}


function removeEventListeners() {
	if (!eventsAdded) { return; }
	application.android.off(application.AndroidApplication.activityRequestPermissionsEvent, handlePermissionResults);
	application.android.off(application.AndroidApplication.activityResultEvent, handleApplicationResults);
	eventsAdded = 0;
}

function addEventListeners(type) {
	if (type === 1) {
		if ((eventsAdded & 1) === 1) {
			return
		}
		application.android.on(application.AndroidApplication.activityRequestPermissionsEvent, handlePermissionResults);
		eventsAdded |= 1;
	} else {
		if ((eventsAdded & 2) === 2) {
			return;
		}
		application.android.on(application.AndroidApplication.activityResultEvent, handleApplicationResults);
		eventsAdded |= 2;
	}
}

function setupSupport() {
	if (hasAndroidX()) {
		androidSupport = global.androidx.core;
	} else if (hasSupportVersion4()) {
		androidSupport = global.android.support.v4;
	}
}

setupSupport();

exports.hasPermission = hasPermission;
exports.hasPermissions = hasPermissions;
exports.requestPermission = request;
exports.requestPermissions = request;


/**
 * Checks to see if v4 is installed and has the proper calls with it
 * @returns {boolean}
 */
function hasSupportVersion4() {
	//noinspection JSUnresolvedVariable
	if (!global.android.support || !global.android.support.v4 || !global.android.support.v4.content || !global.android.support.v4.content.ContextCompat || !global.android.support.v4.content.ContextCompat.checkSelfPermission) {
		return false;
	}
	return true;
}


/**
 * Checks to see if androidx is installed and has the proper calls for it.
 * @returns {boolean}
 */
function hasAndroidX() {
	//noinspection JSUnresolvedVariable
	if (!global.androidx || !global.androidx.core || !global.androidx.core.content || !global.androidx.core.content.ContextCompat || !global.androidx.core.content.ContextCompat.checkSelfPermission) {
		return false;
	}
	return true;
}

function hasPermissions(perms) {
	const results={success: 0, failed: 0, checked: 0};
	if (Array.isArray(perms)) {
		results.checked = perms.length;
		for (let i=0;i<perms.length;i++) {
			const val = hasPermission(perms[i]);
			results[perms[i]] = val;
			if (val) {
				results.success++;
			} else {
				results.failed++;
			}
		}
		return results;
	} else {
		return hasPermissions([perms]);
	}
}

/**
 *
 * @param perm
 * @returns {boolean}
 */
function hasPermission(perm) {

	if (Array.isArray(perm)) {
		return hasPermissions(perm);
	}

	if (androidSupport === null) {
		// If we are on Android M we are going to fail the permission, since one of these two methods should have existed!
		if (global.android.os.Build.VERSION.SDK_INT >= 23) { return false; }

		// If we don't have support v4 or androidx loaded; then we can't run any checks and have to assume
		// that they have put the permission in the manifest and everything is good to go
		return true;
	}

	// Special Setting on Android OS 23 and up
	if (global.android.os.Build.VERSION.SDK_INT >= 23) {
		if (perm === "android.permission.WRITE_SETTINGS") {
			return global.android.provider.Settings.System.canWrite(getContext());
		}
		if (perm === "android.permission.SYSTEM_ALERT_WINDOW") {
			return global.android.provider.Settings.canDrawOverlays(getContext());
		}
	}

	// Check for permission
	return global.android.content.pm.PackageManager.PERMISSION_GRANTED ===
		androidSupport.content.ContextCompat.checkSelfPermission(getContext(), perm);

}

/**
 * gets the current application context
 * @returns {*}
 * @private
 */
function getContext() {
	if (application.android.context) {
		return (application.android.context);
	}
	if (typeof application.getNativeApplication === 'function') {
		let ctx = application.getNativeApplication();
		if (ctx) {
			return ctx;
		}
	}


	//noinspection JSUnresolvedFunction,JSUnresolvedVariable
	let ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
	if (ctx) return ctx;

	//noinspection JSUnresolvedFunction,JSUnresolvedVariable
	ctx = java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
	if (ctx) return ctx;

	return ctx;
}



function request(inPerms, explanation) {
	let perms;
	if (Array.isArray(inPerms)) {
		perms = inPerms;
	} else {
		perms = [inPerms];
	}

	return new Promise(function (granted, failed) {
		let totalFailures = 0, totalSuccesses = 0, hasSpecial=0, version=global.android.os.Build.VERSION.SDK_INT;
		const totalCount = perms.length;
		let permTracking = [], permResults = {};
		for (let i = 0; i < totalCount; i++) {

			// This is a very special permission; have to handle it differently!
			if (perms[i] === "android.permission.WRITE_SETTINGS" && version >= 23 ) {
				hasSpecial=1;
				if (global.android.provider.Settings.System.canWrite(getContext())) {
					permTracking[i] = true;
					permResults[perms[i]] = true;
					totalSuccesses++;
				} else {
					permTracking[i] = false;
					permResults[perms[i]] = false;
					totalFailures++;
				}
			} else if (perms[i] === 'android.permission.SYSTEM_ALERT_WINDOW' && version >= 23) {
				hasSpecial=2;
				if (global.android.provider.Settings.canDrawOverlays(getContext())) {
					permTracking[i] = true;
					permResults[perms[i]] = true;
					totalSuccesses++;
				} else {
					permTracking[i] = false;
					permResults[perms[i]] = false;
					totalFailures++;
				}
			} else {
				// Check if we already have permissions, then we can grant automatically
				if (hasPermission(perms[i])) {
					permTracking[i] = true;
					permResults[perms[i]] = true;
					totalSuccesses++;
				} else {
					permTracking[i] = false;
					permResults[perms[i]] = false;
					totalFailures++;
				}
			}
		}

		// If we have all perms, we don't need to continue
		if (totalSuccesses === totalCount) {
			granted(permResults);
			return;
		}

		//noinspection JSUnresolvedVariable
		if (totalFailures > 0 && global.android.os.Build.VERSION.SDK_INT < 23) {
			// If we are on API < 23 and we get a false back, then this means they forgot to put a manifest permission in...
			failed(permResults);
			return;
		}

		if (hasSpecial) {
			// Because this permission has to go through a completely different flow; we can currently only handle it alone...
			// TODO: Possible fix; add a second level of callbacks; so that then when both are resolved; then the main promise is resolved???
			if (totalCount > 1) {
				throw new Error("You can only request WRITE_SETTINGS or SYSTEM_ALERT_WINDOW permission by itself!")
			}
			switch (hasSpecial) {
				case 1: handleWriteRequest(granted, failed, explanation, permResults); break;
				case 2: handleOverlayRequest(granted, failed, explanation, permResults); break;
			}
			return;
		}

		handleRequest(granted, failed, perms, explanation, permResults, permTracking);
	});
}

function handleWriteRequest(granted, failed, explanation, permResults) {
	const activity = application.android.foregroundActivity || application.android.startActivity;
	if (activity == null) {
		// Throw this off into the future since an activity is not available....
		setTimeout(function() {
			handleWriteRequest(granted, failed, explanation, permResults);
		}, 250);
		return;
	}

	if (typeof explanation === "function") {
		explanation();
	} else if (explanation && explanation.length) {
		//noinspection JSUnresolvedVariable,JSUnresolvedFunction
		const toast = global.android.widget.Toast.makeText(getContext(), explanation, global.android.widget.Toast.LENGTH_LONG);
		//noinspection JSUnresolvedFunction
		toast.setGravity((49), 0, 0);
		toast.show();
	}

	// Ask for permissions
	promiseId++;

	// Wrap the promise id; as the number can't be bigger than the lower 16 bits
	if (promiseId > 65535) { promiseId = 1; }

	pendingPromises[promiseId] = {granted: granted, failed: failed, results: permResults, special: "android.permission.WRITE_SETTINGS"};

	// Add the ActivityResult permissions handler
	addEventListeners(2);

	const intent = new global.android.content.Intent(global.android.provider.Settings.ACTION_MANAGE_WRITE_SETTINGS);
	intent.setData(global.android.net.Uri.parse("package:" + activity.getPackageName()));
	activity.startActivityForResult(intent, promiseId);
}

function handleOverlayRequest(granted, failed, explanation, permResults) {
	const activity = application.android.foregroundActivity || application.android.startActivity;
	if (activity == null) {
		// Throw this off into the future since an activity is not available....
		setTimeout(function() {
			handleOverlayRequest(granted, failed, explanation, permResults);
		}, 250);
		return;
	}

	if (typeof explanation === "function") {
		explanation();
	} else if (explanation && explanation.length) {
		//noinspection JSUnresolvedVariable,JSUnresolvedFunction
		const toast = global.android.widget.Toast.makeText(getContext(), explanation, global.android.widget.Toast.LENGTH_LONG);
		//noinspection JSUnresolvedFunction
		toast.setGravity((49), 0, 0);
		toast.show();
	}

	// Ask for permissions
	promiseId++;

	// Wrap the promise id; as the number can't be bigger than the lower 16 bits
	if (promiseId > 65535) { promiseId = 1; }

	pendingPromises[promiseId] = {granted: granted, failed: failed, results: permResults, special: "android.permission.SYSTEM_ALERT_WINDOW"};

	// Add the ActivityResult permissions handler
	addEventListeners(2);

	const intent = new global.android.content.Intent(global.android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
	intent.setData(global.android.net.Uri.parse("package:" + activity.getPackageName()));
	activity.startActivityForResult(intent, promiseId);
}


function handleRequest(granted, failed, perms, explanation, permResults, permTracking) {
	//noinspection JSUnresolvedVariable
	const activity = application.android.foregroundActivity || application.android.startActivity;
	if (activity == null) {
		// Throw this off into the future since an activity is not available....
		setTimeout(function() {
			handleRequest(granted, failed, perms, explanation, permResults, permTracking);
		}, 250);
		return;
	}

	const totalCount = perms.length;
	// Check if we need to show a explanation , if so show it only once.
	for (let i = 0; i < totalCount; i++) {
		if (permTracking[i] === false) {
			//noinspection JSUnresolvedVariable,JSUnresolvedFunction
			if (androidSupport.app.ActivityCompat.shouldShowRequestPermissionRationale(activity, perms[i])) {
				if (typeof explanation === "function") {
					explanation();
				} else if (explanation && explanation.length) {
					//noinspection JSUnresolvedVariable,JSUnresolvedFunction
					const toast = global.android.widget.Toast.makeText(getContext(), explanation, global.android.widget.Toast.LENGTH_LONG);
					//noinspection JSUnresolvedFunction
					toast.setGravity((49), 0, 0);
					toast.show();
				}

				// We don't need to show the explanation more than one time, if we even need to at all
				break;
			}
		}
	}

	// Build list of Perms we actually need to request
	let requestPerms = [];
	for (let i = 0; i < totalCount; i++) {
		if (permTracking[i] === false) {
			requestPerms.push(perms[i]);
		}
	}

	// Ask for permissions
	promiseId++;

	// Wrap the promise id; as the number can't be bigger than the lower 16 bits
	if (promiseId > 65535) { promiseId = 1; }

	pendingPromises[promiseId] = {granted: granted, failed: failed, results: permResults};

	// Add the Permissions Event handler
	addEventListeners(1);

	//noinspection JSUnresolvedVariable,JSUnresolvedFunction
	androidSupport.app.ActivityCompat.requestPermissions(activity, requestPerms, promiseId);
}
