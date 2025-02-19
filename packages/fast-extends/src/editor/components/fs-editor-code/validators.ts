import { importJsYaml } from "./async-import";

let jsonRule = {
  validator: async (rule: any, value: any) => {
    //校验value json的有效性
    if (value) {
      try {
        JSON.parse(value);
      } catch (e: any) {
        console.error(e);
        throw new Error("json格式错误:" + e.message);
      }
    }
  },
  message: "json格式错误"
};

let yamlRule = {
  validator: async (rule: any, value: any) => {
    //校验value yaml的有效性
    if (value) {
      try {
        let yaml = await importJsYaml();
        yaml.load(value, { schema: yaml.JSON_SCHEMA });
      } catch (e: any) {
        console.error(e);
        throw new Error("yaml格式错误:" + e.message);
      }
    }
  },
  message: "yaml格式错误"
};

export let FsEditorCodeValidators = {
  jsonRule,
  yamlRule
};
