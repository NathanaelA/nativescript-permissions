/**********************************************************************************
 * (c) 2016-2019, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 1.3.0                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/* jshint camelcase: false */
/* global UIDevice, UIDeviceOrientation, getElementsByTagName, android, Promise, java, require, exports */

const application = require('application');

//noinspection JSUnresolvedVariable,JSUnresolvedFunction
if (typeof application.AndroidApplication.activityRequestPermissionsEvent === 'undefined') {
	throw new Error("You must be using at least version 2.0 of the TNS runtime and core-modules!");
}

// Variables to track any pending promises
let pendingPromises = {}, promiseId = 3000;
let androidSupport=null;


//noinspection JSUnresolvedVariable,JSUnresolvedFunction
/**
 * This handles the results of getting the permissions!
 */
application.android.on(application.AndroidApplication.activityRequestPermissionsEvent, function (args) {

	// get current promise set
	//noinspection JSUnresolvedVariable
	const promises = pendingPromises[args.requestCode];

	// We have either gotten a promise from somewhere else or a bug has occurred and android has called us twice
	// In either case we will ignore it...
	if (!promises || typeof promises.granted !== 'function') {
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
		if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_GRANTED) {
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

	if (failureCount === 0) {
		promises.granted(trackingResults);
	} else {
		promises.failed(trackingResults);
	}

});

function setupSupport() {
	if (hasAndroidX()) {
		console.log("AndroidX.core");
		androidSupport = androidx.core;
	} else if (hasSupportVersion4()) {
		console.log("Android.support.v4");
		androidSupport = android.support.v4;
	}
}

setupSupport();

exports.hasPermission = hasPermission;
exports.requestPermission = request;
exports.requestPermissions = request;


/**
 * Checks to see if v4 is installed and has the proper calls with it
 * @returns {boolean}
 */
function hasSupportVersion4() {
	//noinspection JSUnresolvedVariable
	if (!android.support || !android.support.v4 || !android.support.v4.content || !android.support.v4.content.ContextCompat || !android.support.v4.content.ContextCompat.checkSelfPermission) {
		console.log("No v4 support");
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
	if (!androidx || !androidx.core || !androidx.core.content || !androidx.core.content.ContextCompat || !androidx.core.content.ContextCompat.checkSelfPermission) {
		console.log("No AndroidX");
		return false;
	}
	return true;
}

/**
 *
 * @param perm
 * @returns {boolean}
 */
function hasPermission(perm) {

	// If we don't have support v4 or androidx loaded ; then we can't run any checks and have to assume
	// that they have put the permission in the manifest and everything is good to go
	if (androidSupport === null) return true;

	// Check for permission
	return android.content.pm.PackageManager.PERMISSION_GRANTED ===
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
		let totalFailures = 0, totalSuccesses = 0;
		const totalCount = perms.length;
		let permTracking = [], permResults = {};
		for (let i = 0; i < totalCount; i++) {
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

		// If we have all perms, we don't need to continue
		if (totalSuccesses === totalCount) {
			granted(permResults);
			return;
		}

		//noinspection JSUnresolvedVariable
		if (totalFailures > 0 && android.os.Build.VERSION.SDK_INT < 23) {
			// If we are on API < 23 and we get a false back, then this means they forgot to put a manifest permission in...
			failed(permResults);
			return;
		}

		handleRequest(granted, failed, perms, explanation, permResults, permTracking);
	});
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
					const toast = android.widget.Toast.makeText(getContext(), explanation, android.widget.Toast.LENGTH_LONG);
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

	//noinspection JSUnresolvedVariable,JSUnresolvedFunction
	androidSupport.app.ActivityCompat.requestPermissions(activity, requestPerms, promiseId);
}
