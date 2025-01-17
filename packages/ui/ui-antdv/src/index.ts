import { message, notification, Modal } from "ant-design-vue";
import { uiContext } from "@fast-crud/ui-interface";
import setupIcons from "./icons";
import { Antdv } from "./antdv";
export * from "./antdv";

export type UiSetupOptions = {
  setupIcons?: boolean;
};

function set() {
  let antdvUi = new Antdv({
    Message: message,
    Notification: notification,
    MessageBox: Modal
  });
  uiContext.set(antdvUi);
  return antdvUi;
}
export default {
  install(app: any, options: UiSetupOptions = {}) {
    let antdvUi = set();

    if (options.setupIcons !== false) {
      setupIcons(app);
    }
    return antdvUi;
  },
  set
};
