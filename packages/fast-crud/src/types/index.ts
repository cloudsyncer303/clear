import _ from "lodash-es";
import logger from "../utils/util.log";
// @ts-ignore
let typeList = import.meta.glob("./list/*.ts", { eager: true });
let defaultTypeCreators: Array<any> = [];
_.forEach(typeList, (value: any) => {
  defaultTypeCreators.push(value.default);
});

let defaultTypes: any = {};

function getTypes() {
  return defaultTypes;
}

function getType(key: string) {
  return defaultTypes[key];
}

function addTypes(newTypes: any) {
  for (let key in newTypes) {
    defaultTypes[key] = newTypes[key];
  }
}
export default {
  getType,
  addTypes,
  getTypes,
  install() {
    for (let creator of defaultTypeCreators) {
      _.forEach(creator(), (item, key) => {
        defaultTypes[key] = item;
      });
    }
    logger.debug("types installed:", defaultTypes);
  }
};
