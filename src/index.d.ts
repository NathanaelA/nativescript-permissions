//--------------------------
// nativescript-permissions typings file.
//-------------------------

export function hasPermission(permission: any): boolean;

export function hasPermissions(permissions: Array<any>): any;

export function requestPermissions(permissions:Array<any>, explanation?:string|any):Promise<any>;

export function requestPermission(permission:any, explanation?:string|any):Promise<any>;


