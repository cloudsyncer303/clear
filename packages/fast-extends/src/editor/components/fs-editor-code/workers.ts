export type WorkerItem = {
  worker: any;
  match: (label: string) => boolean;
};
let WorkerBucket: WorkerItem[] = [];
/**
 * 注册自定义worker
 */
export function registerWorker(labels: string | string[], worker: any) {
  WorkerBucket.push({
    worker: worker,
    match: (label: string) => {
      if (typeof labels === "string") {
        return labels === label;
      }
      for (let labelItem of labels) {
        if (labelItem === "*") {
          return true;
        }
        if (labelItem === label) {
          return true;
        }
      }
      return false;
    }
  });
}

export function initWorkers() {
  if (window.MonacoEnvironment) {
    return;
  }

  //@ts-ignore
  window.MonacoEnvironment = {
    //@ts-ignore
    getWorker(_, label) {
      for (let workerLoader of WorkerBucket) {
        if (workerLoader.match(label)) {
          return new workerLoader.worker();
        }
      }
    }
  };
}
