# nativescript-permissions
A NativeScript plugin to deal with Android permissions (mainly for API 23+/Android 6+)

## License

This is released under the MIT License, meaning you are free to include this in any type of program -- However for entities that need a support contract, changes, enhancements and/or a commercial license please contact me (nathan@master-technology.com).

## Sample Snapshot
![Sample](docs/permissions.gif)

You can see me do something that requests permissions; then I deny the permissions.  The second time through you will see the **toast** about why I think I need these permissions; then I finally accept them.

## Requirements
Unfortunately the required support didn't quite make it into 1.7 of NativeScript.   So this requires NativeScript 1.8+ to actually work properly

The required low level support is available in the master branch and if you would like to play with it now, you can install the masters by doing each of the following steps:

- npm install http://nativescript.rocks/master/tns-core-modules-master.tgz
- tns platform remove android
- tns platform add android@next

## Installation 

tns plugin add nativescript-permissions


## Usage

To use the module you just `require()` it:

```js
var permissions = require( "nativescript-permissions" );
```


## You ask, how exactly does this help?
This wraps up the entire Android 6 permissions system into a nice easy to use promise. In addition, you can also have multiple permissions pending and each one will resolve properly.

```js
var permissions = require('naitvescript-permissions');
permissions.requestPermission(android.Manifest.permission.READ_CONTACTS, "I need these permissions because I'm cool")
  .then(function() {
     console.log("Woo Hoo, I have the power!");
  })
  .catch(function() {
     console.log("Uh oh, no permissions - plan B time!");
  });
```

The explanation won't be showed unless they have denied the request once.

## Why use this?
This simplifies the checks and allows you to have two courses of action depending on the results of the permission request.

## API
### Functions
#### permissions.hasPermission(permissionName);
**permissionName** - The permission you are requesting; will return true of false if you already have been granted the permission.

#### \<Promise> = permissions.requestPermission(permissionName[, explanation]);
**\<Promise>** - the **.then()** path will be permission granted, the **.catch()** will be permission denied
**permissionName** - The permission you are requesting
**explanation** - This can be either a string that will show as a toast at the top of the screen **or** this can be a function callback that will be called so that you can show whatever you want.


## Notes
Because this uses support.v4; this code works on ALL versions that nativescript supports currently.  So you can start coding this into your app at this point and your app should work on everything.

You still need to put all the permissions you need in the manifest as usual, even on Android 6.    On Android 6 you ALSO must ask the user for permissions each time you go to do anything that needs a "dangerous" permission.  You can see all the permissions at [https://developer.android.com/reference/android/Manifest.permission.html](https://developer.android.com/reference/android/Manifest.permission.html).

Warning: even though the application has been granted permissions once, does NOT mean the app still has permissions; the user can revoke the "dangerous" permissions even while the app is running.  So again YOU MUST use requestPermissions each time.  If the app still has the permissions you will be granted it immediately without the user seeing a dialog.

In NativeScript when using the permissions names/strings in your code; they are accessed as: android.**Manifest**.permission.PERMISSION_NAME rather than the android.permission.PERMISSION_NAME that you would put inside the manifest and are listed on the Android documentation site listed above.

