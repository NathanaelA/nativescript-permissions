/**********************************************************************************
 * (c) 2016, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 0.0.1                                      Nathan@master-technology.com
 *********************************************************************************/
"use strict";

/** We will say everything is great on iOS; since there perm system is totally different */
var dummyRequest = function(inPerms) {
    var perms;
    if (Array.isArray(inPerms)) {
        perms = inPerms;
    } else {
        perms = [inPerms];
    }

    return new Promise(function (granted) {
        var permResults = {};
        for (var i=0;i<perms.length;i++) {
            permResults[perms[i]] = true;
        }
        granted(permResults);
    });
};

exports.hasPermission = function() { return true; };
exports.requestPermission = dummyRequest;
exports.requestPermissions = dummyRequest;