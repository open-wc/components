// import { ReactiveObject } from "../../dist-types/src/reactive-events/ReactiveObject.js";
import { ReactiveObject } from './ReactiveObject.js';

class TestReactiveObject extends ReactiveObject {
  static properties = {
    hihi: { type: String },
    hoho: { type: Object },
  };

  constructor() {
    super();
    // @ts-ignore
    this.constructor.finalize();
    this.hihi = 'hallo';
    this.hoho = { a: 'a' };
  }

  /**
   * @param {import("lit").PropertyValueMap<any> | Map<PropertyKey, unknown>} changedProperties
   */
  update(changedProperties) {
    console.log(changedProperties);
    super.update(changedProperties);
  }
}
const obj = new TestReactiveObject();
await obj.updateComplete;
console.log(obj.hoho);
obj.hoho = { ...obj.hoho };
console.log(obj.hoho);
