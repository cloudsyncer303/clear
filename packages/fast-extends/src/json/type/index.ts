import { useTypes } from "@fast-crud/fast-crud";
import types from "./types";

export default {
  install(app: any) {
    let newTypes = types();
    let { addTypes } = useTypes();
    addTypes(newTypes);
  }
};
