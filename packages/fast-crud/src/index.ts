import defaultCrudOptions from "./use/default-crud-options";
import { utils } from "./utils/index";
import types from "./types/index";
import * as components from "./components";
import { FsFormWrapper } from "./components";
import { i18n, useI18n } from "./locale/";
import { uiContext } from "./ui";
import { GlobalConfig, LoggerConfig, useDictDefine, useMerge } from "./use";
import { App } from "vue";
import { FsSetupOptions } from "./d";

export * from "./utils/index";
export * from "./use";
export * from "./components";
export * from "./ui";
let { setDictRequest } = useDictDefine();
export { utils, useI18n, uiContext };
export * from "./d/index";
export * from "./lib";
export let FastCrud = {
  install(app: App, options: FsSetupOptions = {}) {
    if (options.ui) {
      uiContext.set(options.ui);
    }
    let { merge } = useMerge();
    if (options.commonOptions) {
      defaultCrudOptions.commonOptions = options.commonOptions;
    }
    if (options.dictRequest) {
      setDictRequest(options.dictRequest);
    }

    if (options.i18n) {
      i18n.setVueI18n(options.i18n);
    }

    let customComponents = options.customComponents || {};
    for (let key in components) {
      // @ts-ignore
      let com = customComponents[key] || components[key];
      app.component(key, com);
    }

    FsFormWrapper._context = app._context;

    types.install();

    app.config.globalProperties.$fsui = uiContext.get();

    merge(GlobalConfig.logger, options.logger);
    printWarningLogger(options.logger);
  }
};

function printWarningLogger(logger?: LoggerConfig) {
  if (logger?.off?.tableColumns !== false) {
    console.warn(
      `[fast-crud] crudBinding.value.table.columns / toolbar.columnsFilter.originalColumns 由array改成map. 请改成通过key读取，你可以全局代码搜索【value.table.columns / columnsFilter.originalColumns】来检查是否有使用它们。
      [通过 app.use(FastCrud,{logger:{off:{tableColumns:false}}}) 可关闭此警告] `
    );
  }
}
export default FastCrud;
