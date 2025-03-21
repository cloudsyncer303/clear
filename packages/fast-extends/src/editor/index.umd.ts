import FsExtendsModelType from "./type";
export * from "./exports";
import { utils } from "@fast-crud/fast-crud";
import { FsEditorConfig } from "@/editor/type/config";
// @ts-ignore
let modules = import.meta.glob("./components/*/*.vue", { eager: true });
let FsExtendsComponents = {
  install(app: any) {
    utils.vite.installSyncComponents(app, modules, null, /^.*\/([^\/]+)\/.*.vue$/, null);
  }
};

export let FsExtendsEditor = {
  install(app: any, options: FsEditorConfig) {
    app.use(FsExtendsModelType, options);
    app.use(FsExtendsComponents);
  }
};
