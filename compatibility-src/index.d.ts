//--------------------------
// @master.technology/permissions typings file.
//-------------------------

export function hasPermission(permission: any): boolean;

export function hasPermissions(permissions: Array<any>): any;

export function requestPermissions(permissions:Array<any>, explanation?:string|any):Promise<any>;

export function requestPermission(permission:any, explanation?:string|any):Promise<any>;

export const PERMISSIONS: {
    LOCATION: string,
    CAMERA: string,
    PHOTO: string,
    MICROPHONE: string,
    CONTACTS: string,
    CALENDAR: string,
    BLUETOOTH: string,
    MEDIA: string,

    // iOS
    APP_TRACKING: string,

    // Android
    READ_CALENDAR: string,
    READ_CONTACTS: string,
    READ_EXTERNAL_STORAGE: string,
    WRITE_EXTERNAL_STORAGE: string,
};
