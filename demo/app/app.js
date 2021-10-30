/*
In NativeScript, the app.js file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

const { Application } = require("@nativescript/core");

/*  Startup example asking for Permissions example */

/*
 application.on(application.launchEvent, function() {
 const permissions = require("@master.technology/permissions");
 const perm = permissions.requestPermission(android.Manifest.permission.READ_CONTACTS, "I need Read Contact!");
 perm.then(() => {
 console.log("WooHoo, Perms");
 }).catch(() => {
 console.log("So sad, no perms...");
 });

 });
 */


Application.run({ moduleName: "app-root" });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
