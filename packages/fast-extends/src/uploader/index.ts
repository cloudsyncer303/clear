import FsUploaderType from "./type";
export * from "./type";
export * from "./d";
export * from "./components/libs/";
export * from "./components/utils";
import { ColumnCompositionProps, CrudOptions, utils } from "@fast-crud/fast-crud";
// @ts-ignore
let asyncModules = import.meta.glob("./components/*.vue");
// @ts-ignore
let syncModules = import.meta.glob("./components/fs-images-format.vue", { eager: true });

import { useColumns } from "@fast-crud/fast-crud";

let { registerMergeColumnPlugin } = useColumns();

import { merge } from "lodash-es";
import { FsUploaderOptions } from "./d/type";
registerMergeColumnPlugin({
  name: "uploader-merge-plugin",
  order: 5,
  handle: (columnProps: ColumnCompositionProps = {}, crudOptions: CrudOptions = {}) => {
    if (typeof columnProps.type === "string" && columnProps.type.endsWith("uploader")) {
      let buildUrl = columnProps.buildUrl;
      let buildUrls = columnProps.buildUrls;
      merge(columnProps, {
        form: {
          component: {
            buildUrl,
            buildUrls
          }
        },
        column: {
          component: {
            buildUrl,
            buildUrls
          }
        }
      });
    }
    return columnProps;
  }
});

let FsUploaderComponents = {
  install(app: any) {
    //加载异步组件，异步组件将会被懒加载，所以不用担心打包之后的体积问题
    utils.vite.installAsyncComponents(app, asyncModules, ["FsImagesFormat"], null, null);
    utils.vite.installSyncComponents(app, syncModules, null, null, null);
  }
};

export let FsExtendsUploader = {
  install(app: any, options: FsUploaderOptions) {
    app.use(FsUploaderType, options);
    app.use(FsUploaderComponents);
  }
};
