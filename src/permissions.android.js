/**********************************************************************************
 * (c) 2016, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 1.1.3                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/* jshint camelcase: false */
/* global UIDevice, UIDeviceOrientation, getElementsByTagName, android, Promise, java, require, exports */

var application = require('application');

//noinspection JSUnresolvedVariable,JSUnresolvedFunction
if (typeof application.AndroidApplication.activityRequestPermissionsEvent === 'undefined') {
	throw new Error("You must be using at least version 2.0 of the TNS runtime and core-modules!");
}

// Variables to track any pending promises
var pendingPromises = {}, promiseId = 3000;


//noinspection JSUnresolvedVariable,JSUnresolvedFunction
/**
 * This handles the results of getting the permissions!
 */
application.android.on(application.AndroidApplication.activityRequestPermissionsEvent, function (args) {

	// get current promise set
	//noinspection JSUnresolvedVariable
	var promises = pendingPromises[args.requestCode];

	// We have either gotten a promise from somewhere else or a bug has occurred and android has called us twice
	// In either case we will ignore it...
	if (!promises || typeof promises.granted !== 'function') {
		return;
	}

	// Delete it, since we no longer need to track it
	//noinspection JSUnresolvedVariable
	delete pendingPromises[args.requestCode];

	var trackingResults = promises.results;

	//noinspection JSUnresolvedVariable
	var length = args.permissions.length;
	for (var i = 0; i < length; i++) {
		// Convert back to JS String
		//noinspection JSUnresolvedVariable
		var name = args.permissions[i].toString();

		//noinspection RedundantIfStatementJS,JSUnresolvedVariable,JSUnresolvedFunction
		if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_GRANTED) {
			trackingResults[name] = true;
		} else {
			trackingResults[name] = false;
		}
	}

	// Any Failures
	var failureCount = 0;
	for (var key in trackingResults) {
		if (!trackingResults.hasOwnProperty(key)) continue;
		if (trackingResults[key] === false) failureCount++;
	}

	if (failureCount === 0) {
		promises.granted(trackingResults);
	} else {
		promises.failed(trackingResults);
	}

});


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
 *
 * @param perm
 * @returns {boolean}
 */
function hasPermission(perm) {
	// If we don't have support v4 loaded; then we can't run any checks and have to assume
	// that they have put the permission in the manifest and everything is good to go
	if (!hasSupportVersion4()) return true;

	// Check for permission
	// Interesting, this actually works on API less than 23 and will return false if the manifest permission was forgotten...
	//noinspection JSUnresolvedVariable,JSUnresolvedFunction
	var hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ==
		android.support.v4.content.ContextCompat.checkSelfPermission(getContext(), perm);

	return (hasPermission);
}

function getContext() {
	//noinspection JSUnresolvedVariable,JSUnresolvedFunction
	var ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
	if (ctx) { return ctx; }

	//noinspection JSUnresolvedVariable,JSUnresolvedFunction
	return java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
}


function request(inPerms, explanation) {
	var perms;
	if (Array.isArray(inPerms)) {
		perms = inPerms;
	} else {
		perms = [inPerms];
	}

	return new Promise(function (granted, failed) {
		var totalFailures = 0, totalSuccesses = 0;
		var totalCount = perms.length;
		var permTracking = [], permResults = {};
		for (var i = 0; i < totalCount; i++) {
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
	var activity = application.android.foregroundActivity || application.android.startActivity;
	if (activity == null) {
		// Throw this off into the future since an activity is not available....
		setTimeout(function() {
			handleRequest(granted, failed, perms, explanation, permResults, permTracking);
		}, 250);
		return;
	}

	var totalCount = perms.length;
	// Check if we need to show a explanation , if so show it only once.
	for (var i = 0; i < totalCount; i++) {
		if (permTracking[i] === false) {
			//noinspection JSUnresolvedVariable,JSUnresolvedFunction
			if (android.support.v4.app.ActivityCompat.shouldShowRequestPermissionRationale(activity, perms[i])) {
				if (typeof explanation === "function") {
					explanation();
				} else if (explanation && explanation.length) {
					//noinspection JSUnresolvedVariable,JSUnresolvedFunction
					var toast = android.widget.Toast.makeText(getContext(), explanation, android.widget.Toast.LENGTH_LONG);
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
	var requestPerms = [];
	for (i = 0; i < totalCount; i++) {
		if (permTracking[i] === false) {
			requestPerms.push(perms[i]);
		}
	}

	// Ask for permissions
	promiseId++;
	pendingPromises[promiseId] = {granted: granted, failed: failed, results: permResults};

	//noinspection JSUnresolvedVariable,JSUnresolvedFunction
	android.support.v4.app.ActivityCompat.requestPermissions(activity, requestPerms, promiseId);

}
