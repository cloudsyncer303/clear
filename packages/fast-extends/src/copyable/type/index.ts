import { useTypes } from "@fast-crud/fast-crud";
import types from "./types";

//兼容旧版本
export default {
  install(app: any) {
    let newTypes = types();
    let { addTypes } = useTypes();
    addTypes(newTypes);
  }
};
