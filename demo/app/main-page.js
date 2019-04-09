const Observable = require("tns-core-modules/data/observable").Observable;
const permissions = require("nativescript-permissions");
/*
In NativeScript, a file with the same name as an XML file is known as
a code-behind file. The code-behind is a great place to place your view
logic, and to set up your page’s data binding.
*/

const obs = new Observable({message: 'Click to see if I have permissions!'});
function onNavigatingTo(args) {
    /*
    This gets a reference this page’s <Page> UI component. You can
    view the API reference of the Page to see what’s available at
    https://docs.nativescript.org/api-reference/classes/_ui_page_.page.html
    */
    const page = args.object;

    /*
    A page’s bindingContext is an object that should be used to perform
    data binding between XML markup and JavaScript code. Properties
    on the bindingContext can be accessed using the {{ }} syntax in XML.
    In this example, the {{ message }} and {{ onTap }} bindings are resolved
    against the object returned by createViewModel().

    You can learn more about data binding in NativeScript at
    https://docs.nativescript.org/core-concepts/data-binding.
    */
    page.bindingContext = obs;
}

/*
Exporting a function in a NativeScript code-behind file makes it accessible
to the file’s corresponding XML file. In this case, exporting the onNavigatingTo
function here makes the navigatingTo="onNavigatingTo" binding in this page’s XML
file work.
*/
exports.onNavigatingTo = onNavigatingTo;

exports.singlePermission = function() {
    obs.set("message", "Checking permission!");
    console.log("Permission REQUESTED is", android.Manifest.permission.READ_CONTACTS);
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
