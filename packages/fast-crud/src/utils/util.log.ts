let DEBUG_WITH_CALLER = true;
function getCallerInfo() {
  let e = new Error();
  return e.stack?.split("\n")[3];
}

let blank = (...args: any) => {};

function logInfo(...args: any) {
  // @ts-ignore
  // eslint-disable-next-line prefer-rest-params
  console["log"].apply(this, arguments);
}
function logWarn(...args: any) {
  // @ts-ignore
  // eslint-disable-next-line prefer-rest-params
  console.warn.apply(this, arguments);
}
function logError(...args: any) {
  // @ts-ignore
  // eslint-disable-next-line prefer-rest-params
  console.error.apply(this, arguments);
}
let error = (...args: any) => {
  logError("%c [error]", "font-weight: 600;", ...args);
};
let warn = (...args: any) => {
  logWarn("%c [warn]", "font-weight: 600;", ...args);
};
let info = (...args: any) => {
  logInfo("%c [info]", "font-weight: 600;", ...args);
};
let debug = (...args: any) => {
  if (!console.log) {
    return;
  }
  let callerInfo = getCallerInfo();
  if (DEBUG_WITH_CALLER) {
    let log = ["%c [debug]", "font-weight: 600;", ...args];
    logInfo(...log);
    let caller = ["%c " + callerInfo, "color:#999"];
    logInfo(...caller);
  } else {
    let log = ["%c [debug]", "font-weight: 600;", ...args];
    logInfo(...log);
  }
};
let logger = {
  debug: blank,
  info: blank,
  warn: blank,
  error: blank,
  log: blank
};

export default logger;
export function setLogger(opts: any = {}) {
  let level = opts?.level || "info";
  logger.debug = blank;
  logger.info = blank;
  logger.warn = blank;
  logger.error = blank;
  logger.log = blank;
  switch (level) {
    case "debug":
      logger.debug = debug;
    case "info":
      logger.info = info;
      logger.log = info;
    case "warn":
      logger.warn = warn;
    case "error":
      logger.error = error;
      break;
  }
}
setLogger();
