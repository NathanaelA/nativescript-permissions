const Observable = require("tns-core-modules/data/observable");
const permissions = require("nativescript-permissions");

const obs = new Observable.fromObject({message: 'Click to see if I have permissions!'});
function onNavigatingTo(args) {
    const page = args.object;

    page.bindingContext = obs;
}

exports.onNavigatingTo = onNavigatingTo;

exports.singlePermission = function() {
    obs.set("message", "Checking permission!");
    console.log("Permission REQUESTED is", android.Manifest.permission.READ_CONTACTS);

    // You do NOT need to do the hasPermission check, this is just to show you how you CAN do
    // the hasPermission check, you can easily just always do the requestPermission and it will
    // do the hasPermission check internally and not request any additional permissions
    if (permissions.hasPermission(android.Manifest.permission.READ_CONTACTS)) {
        obs.set("message", "WooHoo, you have already granted me this permission!");
        return;
    }

    const perm = permissions.requestPermission(android.Manifest.permission.READ_CONTACTS, "I need Read Contact!");
    perm.then(() => {
        obs.set("message", "WooHoo you granted me permissions!");
    }).catch(() => {
        obs.set("message", "Oops, I'm so sad -- no permissions!");
    });
};

exports.writePermission = function() {
    obs.set("message", "Checking permission!");
    console.log("Permission REQUESTED is", android.Manifest.permission.WRITE_SETTINGS);

    // You do NOT need to do the hasPermission check, this is just to show you how you CAN do
    // the hasPermission check, you can easily just always do the requestPermission and it will
    // do the hasPermission check internally and not request any additional permissions
    if (permissions.hasPermission(android.Manifest.permission.WRITE_SETTINGS)) {
        obs.set("message", "You have already granted this permission");
        return;
    }

    const perm = permissions.requestPermission(android.Manifest.permission.WRITE_SETTINGS, "I need Access to write the settings!");
    perm.then(() => {
        obs.set("message", "WooHoo you granted me permissions!");
    }).catch(() => {
        obs.set("message", "Oops, I'm so sad -- no permissions!");
    });
};


exports.multiPermission = function() {
    obs.set("message", "Checking permissions!");
    console.log("Requested permissions:", [
        android.Manifest.permission.CAMERA,
        android.Manifest.permission.ACCESS_FINE_LOCATION,
        android.Manifest.permission.READ_EXTERNAL_STORAGE,
        android.Manifest.permission.WRITE_EXTERNAL_STORAGE]);

    permissions.requestPermission([
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.READ_EXTERNAL_STORAGE,
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE],
        "I really need all the permissions in the world!")
        .then((result) => {
            obs.set("message", "WooHoo you granted me all the permissions!");
        })
        .catch((result) => {
            let count = 0;
            console.dir(result);
            for (let res in result) {
                if (!result.hasOwnProperty(res)) { continue; }
                if (result[res] === true) { count++; }
            }
            obs.set("message", "Oops, I'm so sad, I was only granted " + count + " of 4 permissions!");
        });
};
