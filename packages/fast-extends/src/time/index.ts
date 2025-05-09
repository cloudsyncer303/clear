import FsExtendsType from "./type";
import { utils } from "@fast-crud/fast-crud";
// @ts-ignore
let asyncModules = import.meta.glob("./components/*.vue");
let FsExtendsComponents = {
  install(app: any) {
    //加载异步组件，异步组件将会被懒加载，所以不用担心打包之后的体积问题
    utils.vite.installAsyncComponents(app, asyncModules, [], null, null);
  }
};

export let FsExtendsTime = {
  install(app: any) {
    app.use(FsExtendsType);
    app.use(FsExtendsComponents);
  }
};
