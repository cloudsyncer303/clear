export type LoggerConfig = {
  off?: {
    tableColumns?: boolean;
  };
};
export type GlobalConfig = {
  logger?: LoggerConfig;
};
export let GlobalConfig: GlobalConfig = {
  logger: {
    off: {
      tableColumns: false
    }
  }
};
