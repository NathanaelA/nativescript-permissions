const Observable = require("@nativescript/core/data/observable");
const permissions = require("@master.technology/permissions");

const obs = new Observable.fromObject({
    message: 'Click to see if I have permissions!',
    bgSingle: '#ffffff',
    bgMulti: '#ffffff',
    bgWrite: '#ffffff',
    custompermission: global.android ? "Write Permission" : "App Tracking",
    tried: 0
});
function onNavigatingTo(args) {
    const page = args.object;
    checkPerms();

    page.bindingContext = obs;
}

function checkPerms() {
    if (permissions.hasPermission(permissions.PERMISSIONS.READ_CONTACTS)) {
        obs.set("bgSingle","#00FF00");
    } else if ((obs.tried & 1) === 1) {
        obs.set("bgSingle","#FF0000");
    } else {
        obs.set("bgSingle","#FFFFFF");
    }

    if (global.android) {
      if (permissions.hasPermission(android.Manifest.permission.WRITE_SETTINGS)) {
        obs.set("bgWrite", "#00FF00");
      } else if ((obs.tried & 2) === 2) {
        obs.set("bgWrite", "#FF0000");
      } else {
        obs.set("bgWrite", "#FFFFFF");
      }
    } else {
      if (permissions.hasPermission(permissions.PERMISSIONS.APP_TRACKING)) {
        obs.set("bgWrite", "#00FF00");
      } else if ((obs.tried & 2) === 2) {
        obs.set("bgWrite", "#FF0000");
      } else {
        obs.set("bgWrite", "#FFFFFF");
      }
    }

    const perms = permissions.hasPermissions([
            permissions.PERMISSIONS.CAMERA,
            permissions.PERMISSIONS.LOCATION,
            permissions.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);

    if (perms.failed === 0) {
        obs.set("bgMulti","#00FF00");
    } else if ((obs.tried & 4) === 4 && perms.failed === perms.checked) {
        obs.set("bgMulti", "#FF0000");
    } else if ((obs.tried & 4) === 4 && perms.failed !== perms.checked) {
        obs.set("bgMulti","#ffd700");
    } else {
        obs.set("bgMulti","#FFFFFF");
    }


}

exports.onNavigatingTo = onNavigatingTo;

exports.singlePermission = function() {
    obs.set("message", "Checking permission!");
    obs.set("tried", obs.tried | 1);
    console.log("Permission REQUESTED is", permissions.PERMISSIONS.READ_CONTACTS);

    // You do NOT need to do the hasPermission check, this is just to show you how you CAN do
    // the hasPermission check, you can easily just always do the requestPermission and it will
    // do the hasPermission check internally and not request any additional permissions
    if (permissions.hasPermission(permissions.PERMISSIONS.READ_CONTACTS)) {
        obs.set("message", "WooHoo, you have already granted me this permission!");
        return;
    }

    const perm = permissions.requestPermission(permissions.PERMISSIONS.READ_CONTACTS, "I need Read Contact!");
    perm.then(() => {
        obs.set("message", "WooHoo you granted me permission!");
        checkPerms();
    }).catch(() => {
        obs.set("message", "Oops, I'm so sad -- no permission!");
        checkPerms();
    });
};

exports.writePermission = function() {
    let permission = global.android ? android.Manifest.permission.WRITE_SETTINGS : permissions.PERMISSIONS.APP_TRACKING;
    obs.set("message", "Checking permission!");
    obs.set("tried", obs.tried | 2);


    console.log("Permission REQUESTED is", permission);

    // You do NOT need to do the hasPermission check, this is just to show you how you CAN do
    // the hasPermission check, you can easily just always do the requestPermission and it will
    // do the hasPermission check internally and not request any additional permissions
    if (permissions.hasPermission(permission)) {
        obs.set("message", "You have already granted this permission");
        return;
    }

    const perm = permissions.requestPermission(permission, "I need Access to write the settings!");
    perm.then(() => {
        obs.set("message", "WooHoo you granted me permissions!");
        checkPerms();
    }).catch(() => {
        obs.set("message", "Oops, I'm so sad -- no permissions!");
        checkPerms();
    });
};

exports.multiPermission = function() {
    obs.set("message", "Checking permissions!");
    obs.set("tried", obs.tried | 4);

    console.log("Requested permissions:", [
      permissions.PERMISSIONS.CAMERA,
      permissions.PERMISSIONS.LOCATION,
      permissions.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);

    // You do NOT need to do the hasPermissions check, this is just to show you how you CAN do
    // the hasPermissions check, you can easily just always do the requestPermissions and it will
    // do the hasPermissions check internally and not request any additional permissions
    const perms = permissions.hasPermissions([
      permissions.PERMISSIONS.CAMERA,
      permissions.PERMISSIONS.LOCATION,
      permissions.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);
    if (perms.failed === 0) {
        obs.set("message", "You have already granted these permissions!");
        return;
    }


    permissions.requestPermission([
      permissions.PERMISSIONS.CAMERA,
      permissions.PERMISSIONS.LOCATION,
      permissions.PERMISSIONS.WRITE_EXTERNAL_STORAGE],
        "I really need all the permissions in the world!")
               .then((result) => {
                   obs.set("message", "WooHoo you granted me all the permissions!");
                   checkPerms();
               })
               .catch((result) => {
                   let count = 0;
                   console.dir(result);
                   for (let res in result) {
                       if (!result.hasOwnProperty(res)) { continue; }
                       if (result[res] === true) { count++; }
                   }
                   obs.set("message", "Oops, I'm so sad, I was only granted " + count + " of 3 permissions!");
                   checkPerms();
               });
};
