/**********************************************************************************
 * (c) 2016-2020, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 0.0.3                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/** We will say everything is great on iOS; since there perm system is totally different */
const dummyRequest = function(inPerms) {
    let perms;
    if (Array.isArray(inPerms)) {
        perms = inPerms;
    } else {
        perms = [inPerms];
    }

    return new Promise(function (granted) {
        let permResults = {};
        for (let i=0;i<perms.length;i++) {
            permResults[perms[i]] = true;
        }
        granted(permResults);
    });
};

exports.hasPermission = function() { return true; };
exports.hasPermissions = function() { return {success: 0, failed: 0, checked: 0}; };
exports.requestPermission = dummyRequest;
exports.requestPermissions = dummyRequest;