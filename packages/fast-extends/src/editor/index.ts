import ExtendsType from "./type";
export * from "./exports";
import { utils } from "@fast-crud/fast-crud";
import { FsEditorConfig } from "./type/config";
// @ts-ignore
let asyncModules = import.meta.glob("./components/*/*.vue");
let FsExtendsComponents = {
  install(app: any) {
    utils.vite.installAsyncComponents(app, asyncModules, null, /^.*\/([^\/]+)\/.*.vue$/, null);
  }
};

export let FsExtendsEditor = {
  install(app: any, options: FsEditorConfig) {
    app.use(ExtendsType, options);
    app.use(FsExtendsComponents);
  }
};
