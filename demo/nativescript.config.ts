import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'technology.master.demo.permissions',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;