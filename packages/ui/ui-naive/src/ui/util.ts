// @ts-ignore
import { uiContext } from "@fast-crud/ui-interface";
import { useDialog, useMessage, useNotification } from "naive-ui";

export default {
  init() {
    if (uiContext?.ref?.value == null) {
      throw new Error("请先安装ui：app.use(UiNaive);");
    }
    let message = useMessage();
    let notification = useNotification();
    let messageBox = useDialog();
    // @ts-ignore
    uiContext.ref.value.init({ message, notification, messageBox });
  }
};
