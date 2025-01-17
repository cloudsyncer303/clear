import { useTypes } from "@fast-crud/fast-crud";
import types from "./types";
import { merge } from "lodash-es";
import { uploaderConfig } from "./config";
import { AllUploadSuccessValidator } from "./validators";
import { FsUploaderOptions } from "../d/type";

export * from "./validators";

function setConfig(app: any, config: FsUploaderOptions) {
  merge(uploaderConfig, config);
  // app.config.globalProperties.$fs_uploader_config = merge(defaultConfig, config);
}
//兼容旧版本
let AllSuccessValidator = AllUploadSuccessValidator;
export { AllSuccessValidator };

export default {
  install(app: any, options: FsUploaderOptions) {
    let newTypes = types();
    let { addTypes } = useTypes();
    addTypes(newTypes);
    setConfig(app, options);
  }
};
