// @ts-ignore
import * as icons from "@element-plus/icons-vue";
let iconsList = icons as any;
export default function (app: any) {
  for (let key in iconsList) {
    app.component(key, iconsList[key]);
  }
}
