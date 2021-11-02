/**********************************************************************************
 * (c) 2016-2021, Master Technology
 * Licensed under the MIT license or contact me for a Support or Commercial License
 *
 * I do contract work in most languages, so let me solve your problems!
 *
 * Any questions please feel free to email me or put a issue up on the github repo
 * Version 2.0.1                                          Nathan@master.technology
 *********************************************************************************/
"use strict";

/* global NSObject, exports, ATTrackingManager, UIDevice, AVCaptureDevice, AVAuthorizationStatus,
  PHPhotoLibrary, PHAuthorizationStatus, ASIdentifierManager, AVAudioSession, CNContactStore,
  AVAudioSessionRecordPermissionGranted, CNAuthorizationStatus, EKEventStore, EKAuthorizationStatusAuthorized,
  CBManager, CBManagerAuthorization, CBPeripheralManager, CBPeripheralManagerAuthorizationStatus,
  MPMediaLibrary, ATTrackingManagerAuthorizationStatusAuthorized, MPMediaLibraryAuthorizationStatus,
  CLLocationManager, CLAuthorizationStatus */

const PERMISSIONS = Object.freeze({
    LOCATION: 'ios.LOCATION',
    CAMERA: 'ios.CAMERA',
    PHOTO: 'ios.PHOTO',
    MICROPHONE: 'ios.MICROPHONE',
    CONTACTS: 'ios.CONTACTS',
    CALENDAR: 'ios.CALENDAR',
    BLUETOOTH: 'ios.BLUETOOTH',
    MEDIA: 'ios.MEDIA',

    APP_TRACKING: 'ios.APP_TRACKING_TRANSPARENCY',

    // Compatibility with Android
    READ_CALENDAR: 'ios.CALENDAR',
    READ_CONTACTS: 'ios.CONTACTS',
    READ_EXTERNAL_STORAGE: 'approved',
    WRITE_EXTERNAL_STORAGE: 'approved',
});

// Get Versions
// noinspection JSUnresolvedVariable
const versionFloat = parseFloat(UIDevice.currentDevice.systemVersion);
// noinspection JSUnresolvedVariable
const versionInt = parseInt(UIDevice.currentDevice.systemVersion,10);


const DELEGATES={}, Pending=[];
function add_to_pending(me) {
    Pending.push(me);
}

function remove_from_pending(me) {
    me.cleanUp();
    let idx = Pending.indexOf(me);
    if (idx >= 0) {
        Pending.splice(idx, 1)
    }
}

class LOCATION {
    constructor() {
        if (DELEGATES.LOCATION == null) {
            // noinspection JSVoidFunctionReturnValueUsed
            DELEGATES.LOCATION = NSObject.extend({
                _owner: null,
                locationManagerDidChangeAuthorizationStatus: function (manager, status) {
                    // We will get a Status=0 before we get the first real status...
                    if (status === 0) { return; }
                    const owner = this._owner && this._owner.get();
                    if (owner) {
                        if (LOCATION.has()) {
                            owner._resolve(true);
                        } else {
                            owner._resolve(false);
                        }
                        remove_from_pending(owner);
                    }
                }
            }, {protocols: [CLLocationManagerDelegate]});
        }
    }

    static keys() {
        return ["NSLocationWhenInUseUsageDescription"];
    }

    static has() {
        if (!CLLocationManager.locationServicesEnabled()) {
            return false;
        }
        const status = CLLocationManager.authorizationStatus();
        switch (status) {
            case CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedAlways:
                return true;
            case CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedWhenInUse:
                return true;
            case CLAuthorizationStatus.kCLAuthorizationStatusDenied:
                return false;
            case CLAuthorizationStatus.kCLAuthorizationStatusRestricted:
                return false;
            default:
                return false;
        }
    }

    static async get() {
        if (this.has()) { return true; }
        const me = new LOCATION();
        return await me.get();
    }

    cleanUp() {
        this._manager.delegate = null;
        this._delegate = null;
        this._manager = null;
    }

    async get() {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._delegate = DELEGATES.LOCATION.alloc().init();
            this._delegate._owner = new WeakRef(this);
            add_to_pending(this);
            this._manager = CLLocationManager.alloc().init();
            this._manager.delegate = this._delegate;
            this._manager.requestWhenInUseAuthorization();
        });
    }
}

class CAMERA {

    static keys() {
        return ["NSCameraUsageDescription"];
    }

    static has() {
        const status = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
        return status === AVAuthorizationStatus.Authorized;
    }

    static async get() {
        return new Promise( (resolve) => {
            AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(AVMediaTypeVideo, () => {
               if (this.has()) { resolve(true); }
               else { resolve(false); }
            });
        });
    }
}

class PHOTO {
    static keys() {
        return  ["NSPhotoLibraryUsageDescription"];
    }

    static has() {
        let status;
        if (versionInt >= 14) {
            status = PHPhotoLibrary.authorizationStatusForAccessLevel(PHAccessLevel.ReadWrite);
        } else {
            status = PHPhotoLibrary.authorizationStatus();
        }
        return status === PHAuthorizationStatus.Authorized;
    }

    static async get() {
        return new Promise((resolve) => {
            PHPhotoLibrary.requestAuthorization(() => {
                if (this.has()) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }
}

class MICROPHONE {

    static keys() {
        return ["NSMicrophoneUsageDescription"];
    }

    static has() {
        let status = AVAudioSession.sharedInstance().recordPermission();
        return status === AVAudioSessionRecordPermissionGranted;
    }

    // TODO: see if Capture Method is better
    //        const status = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeAudio);
    //        return status === AVAuthorizationStatus.Authorized;
    //        AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(AVMediaTypeAudio, () => {

    static async get() {
        return new Promise((resolve) => {

            AVAudioSession.sharedInstance().requestRecordPermission(() => {
                if (this.has()) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }
}

class CONTACTS {
    static keys() {
        return  ["NSContactsUsageDescription"];
    }

    static has() {
        const status = CNContactStore.authorizationStatusForEntityType(CNEntityType.Contacts);
        return status === CNAuthorizationStatus.Authorized;
    }

    static async get() {
        return new Promise((resolve) => {
            const contact = CNContactStore.alloc().init();
            contact.requestAccessForEntityTypeCompletionHandler(CNEntityType.Contacts, (granted, error) => {
                if(error != null) {
                    return resolve(false);
                }
                if (this.has()) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }
}

class CALENDAR {
    static keys() {
        return ["NSCalendarsUsageDescription"];
    }

    static has() {
        const status = EKEventStore.authorizationStatusForEntityType(EKEntityType.Event);
        return status === EKAuthorizationStatusAuthorized;
    }

    static async get() {
        return new Promise((resolve) => {
            const event = EKEventStore.alloc().init();
            event.requestAccessToEntityType(EKEntityType.Event, (granted, error) => {
                if (error != null) {
                    return resolve(false);
                }
                if (this.has()) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }
}

class BLUETOOTH {
    constructor() {
        if (DELEGATES.BLUETOOTH == null) {
            // noinspection JSVoidFunctionReturnValueUsed
            DELEGATES.BLUETOOTH = NSObject.extend({
                _owner: null,
                peripheralManagerDidUpdateState: function (manager) {
                    let owner = this._owner && this._owner.get();
                    if (owner) {
                        if (BLUETOOTH.has()) {
                            owner._resolve(true);
                        } else {
                            owner._resolve(false);
                        }
                        remove_from_pending(owner);
                    }
                }
            }, {protocols: [CBPeripheralManagerDelegate]})
        }
    }

    static keys() {
        return [ "NSBluetoothPeripheralUsageDescription", "NSBluetoothAlwaysUsageDescription" ];
    }

    static has() {
        if (versionFloat >= 13.1) {
            const status = CBManager.authorization();
            return status === CBManagerAuthorization.AllowedAlways;
        } else {
            const status = CBPeripheralManager.authorizationStatus();
            return status === CBPeripheralManagerAuthorizationStatus.Authorized;
        }
    }

    static async get() {
        if (this.has()) { return true; }
        let me = new BLUETOOTH();
        return await me.get();
    }

    cleanUp() {
        this._manager.delegate = null;
        this._delegate = null;
        this._manager = null;
    }

    async get() {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._delegate = DELEGATES.BLUETOOTH.alloc().init();
            this._delegate._owner = new WeakRef(this);
            add_to_pending(this);

            this._manager = CBPeripheralManager.alloc().initWithDelegateQueueOptions(this._delegate, null, {CBPeripheralManagerOptionShowPowerAlertKey: false});
        });
    }

}

class MEDIA {
    static keys() {
        return ["NSAppleMusicUsageDescription"];
    }

    static has() {
        const status = MPMediaLibrary.authorizationStatus();
        return status === MPMediaLibraryAuthorizationStatus.Authorized;
    }

    static async get() {
        return new Promise((resolve) => {
            MPMediaLibrary.requestAuthorization(() => {
                if (this.has()) { resolve(true); }
                else { resolve(false); }
            });
        });
    }
}

class APP_TRACKING {
    static keys() {
        return ["NSUserTrackingUsageDescription"];
    }

    static has() {
        if (versionInt >= 14) {
            const status = ATTrackingManager.trackingAuthorizationStatus;
            return status ===  ATTrackingManagerAuthorizationStatusAuthorized;
        } else {
            return ASIdentifierManager.sharedManager().isAdvertisingTrackingEnabled();
        }
    }

    static async get() {
        return new Promise((resolve) => {
            if (versionInt >= 14) {
                ATTrackingManager.requestTrackingAuthorizationWithCompletionHandler((status) => {
                    if (this.has()) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                });
            } else {
                if (this.has()) {
                    return resolve(true);
                } else {
                    return resolve(false);
                }
            }
        });
    }
}


// noinspection DuplicatedCode
function hasPermissions(perms) {
    const results={success: 0, failed: 0, checked: 0};
    if (Array.isArray(perms)) {
        results.checked = perms.length;
        for (let i=0;i<perms.length;i++) {
            const val = hasPermission(perms[i]);
            results[perms[i]] = val;
            if (val) {
                results.success++;
            } else {
                results.failed++;
            }
        }
        return results;
    } else {
        return hasPermissions([perms]);
    }
}

/**
 * hasPermissions
 * @param perm
 * @returns {boolean}
 */
function hasPermission(perm) {

    if (Array.isArray(perm)) {
        return hasPermissions(perm);
    }

    if (perm === "approved") { return true; }
    if (perm.startsWith("android.")) { return false; }

    switch (perm) {
        case PERMISSIONS.LOCATION:
            return LOCATION.has();

        case PERMISSIONS.CAMERA:
            return CAMERA.has();

        case PERMISSIONS.PHOTO:
            return PHOTO.has();

        case PERMISSIONS.MICROPHONE:
            return MICROPHONE.has();

        case PERMISSIONS.CONTACTS:
            return CONTACTS.has();

        case PERMISSIONS.CALENDAR:
            return CALENDAR.has();

        case PERMISSIONS.BLUETOOTH:
            return BLUETOOTH.has();

        case PERMISSIONS.MEDIA:
            return MEDIA.has();

        case PERMISSIONS.APP_TRACKING:
            return APP_TRACKING.has();

        default:
            return false;
    }

}

/**
 * Request a set of permissions
 * @param inPerms
 * @param explanation
 * @returns {Promise<unknown>}
 */
function request(inPerms, explanation) {
    let perms;
    if (Array.isArray(inPerms)) {
        perms = inPerms;
    } else {
        perms = [inPerms];
    }

    return new Promise(async function (granted, failed) {
        let totalSuccesses = 0;
        const totalCount = perms.length;
        let permResults = {};

        for (let i = 0; i < totalCount; i++) {

            // Check if we already have permissions, then we can grant automatically
            if (hasPermission(perms[i])) {
                permResults[perms[i]] = true;
                totalSuccesses++;
            } else {
                console.log("Getting", perms[i]);
                let result = await handleRequest(perms[i]);
                console.log("Results", result);
                permResults[perms[i]] = result;
                if (result) {
                    totalSuccesses++;
                }
            }
        }

        if (totalSuccesses === totalCount) {
            granted(permResults);
        } else {
            failed(permResults);
        }

    });
}

async function handleRequest(perm) {
    if (perm === "approved") { return true; }
    if (perm.startsWith("android.")) { return false; }

    try {
        switch (perm) {
            case PERMISSIONS.LOCATION:
                return await LOCATION.get();

            case PERMISSIONS.CAMERA:
                return await CAMERA.get();

            case PERMISSIONS.PHOTO:
                return await PHOTO.get();

            case PERMISSIONS.MICROPHONE:
                return await MICROPHONE.get();

            case PERMISSIONS.CONTACTS:
                return await CONTACTS.get();

            case PERMISSIONS.CALENDAR:
                return await CALENDAR.get();

            case PERMISSIONS.BLUETOOTH:
                return await BLUETOOTH.get();

            case PERMISSIONS.MEDIA:
                return await MEDIA.get();

            case PERMISSIONS.APP_TRACKING:
                return await APP_TRACKING.get();

            default:
                return false;
        }
    } catch (e) {
        console.log("!!! Error occurred:", e);
        return false;
    }
}

exports.hasPermission = hasPermission;
exports.hasPermissions = hasPermissions;
exports.requestPermission = request;
exports.requestPermissions = request;
exports.PERMISSIONS = PERMISSIONS;
