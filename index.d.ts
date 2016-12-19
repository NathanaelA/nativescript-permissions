//--------------------------
// nativescript-permissions typings file.
//-------------------------
declare module 'nativescript-permissions' {

  export function hasPermission(permission: any): boolean;

  export function requestPermissions(permissions:Array<any>, explanation?:string):Promise<any>;

  export function requestPermission(permission:any, explanation?:string):Promise<any>;

  export function hasPermission(permission: any): boolean;

}

