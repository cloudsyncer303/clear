import { uiContext } from "../../ui";
export default function () {
  let ui = uiContext.get();
  return {
    number: {
      form: {
        component: {
          // el-input-number,a-input-number
          name: ui.number.name,
          vModel: ui.modelValue
        }
      }
    }
  };
}
