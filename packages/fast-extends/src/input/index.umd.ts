import FsExtendsType from "./type";
import { utils } from "@fast-crud/fast-crud";
// @ts-ignore
let modules = import.meta.glob("./components/*.vue", { eager: true });
let FsExtendsComponents = {
  install(app: any) {
    utils.vite.installSyncComponents(app, modules, null, null, null);
  }
};

export let FsExtendsInput = {
  install(app: any) {
    app.use(FsExtendsType);
    app.use(FsExtendsComponents);
  }
};
