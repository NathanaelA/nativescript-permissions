var observable = require("data/observable");
var permissions = require("nativescript-permissions");

var HelloWorldModel = (function (_super) {
    __extends(HelloWorldModel, _super);
    function HelloWorldModel() {
        _super.call(this);
        this.set("message", "Click to see if I have permissions!");
    }
    HelloWorldModel.prototype.tapAction = function () {
        var that = this;
        that.set("message", "Checking permissions!");
        var perm = permissions.requestPermission(android.Manifest.permission.READ_CONTACTS, "I need Read Contact!");
        perm.then(function() {
            that.set("message", "WooHoo you granted me permissions!");
        }).catch(function() {
            that.set("message", "Oops, I'm so sad -- no permissions!");
        });
    };
    return HelloWorldModel;
})(observable.Observable);
exports.HelloWorldModel = HelloWorldModel;
exports.mainViewModel = new HelloWorldModel();
