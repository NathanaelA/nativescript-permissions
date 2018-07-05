var Observable = require("data/observable").Observable;
var permissions = require("nativescript-permissions");

function createViewModel() {
	var viewModel = new Observable();
	viewModel.set("message", "Click to see if I have permissions!");
	viewModel.tapAction = function () {
		var that = this;
		this.set("message", "Checking permission!");
		console.log("Permission REQUESTED is", android.Manifest.permission.READ_CONTACTS);
		var perm = permissions.requestPermission(android.Manifest.permission.READ_CONTACTS, "I need Read Contact!");
		perm.then(function () {
			that.set("message", "WooHoo you granted me permissions!");
		}).catch(function () {
			that.set("message", "Oops, I'm so sad -- no permissions!");
		});
	};

	viewModel.multiTapAction = function () {
		var that = this;
		this.set("message", "Checking permissions!");
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
		.then(function (result) {
			that.set("message", "WooHoo you granted me all the permissions!");
		})
		.catch(function (result) {
			var count = 0;
			// console.dir(result);
			for (var res in result) {
				if (!result.hasOwnProperty(res)) {
					continue;
				}
				if (result[res] === true) {
					count++;
				}

			}
			that.set("message", "Oops, I'm so sad, I was only granted " + count + " of 4 permissions!");
		});
	};
	return viewModel;
}
    exports.createViewModel = createViewModel;

