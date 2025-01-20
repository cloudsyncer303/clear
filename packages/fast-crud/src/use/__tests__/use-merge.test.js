import { useMerge } from "../use-merge";

describe("useMerge", function () {
  it("#cloneDeep", async function () {
    let { cloneDeep, UnMergeable } = useMerge();
    class TestDict extends UnMergeable {
      constructor() {
        super();
        this.name = "test";
      }
    }
    let target = new TestDict();
    target.cloneable = false;
    let cloned = cloneDeep(target);
    expect(target).not.toBe(cloned);

    let target2 = { target };
    let cloned2 = cloneDeep(target2);
    expect(cloned2.target).not.toBe(target2.target);

    target.cloneable = false;
    let cloned3 = cloneDeep(target);
    expect(target).toBe(cloned3);

    let target4 = { target };
    let cloned4 = cloneDeep(target4);
    expect(cloned4.target).toBe(target4.target);
  });

  it("#merge", async function () {
    let { merge, UnMergeable } = useMerge();
    class TestDict extends UnMergeable {
      constructor() {
        super();
        this.name = "test";
      }
    }
    let target = new TestDict();
    let cloned = merge({}, target, undefined);
    expect(target).toBe(cloned);

    let target2 = { target };
    let cloned2 = merge({}, target2, undefined);
    expect(cloned2.target).toBe(target2.target);

    let cloned3 = merge({}, target2, { target: 1 });
    expect(cloned3.target).not.toBe(target2.target);
  });
});
