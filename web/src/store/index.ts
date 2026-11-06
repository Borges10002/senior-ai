import { store } from "quasar/wrappers";
import { InjectionKey } from "vue";
import {
  createStore,
  Store as VuexStore,
  useStore as vuexUseStore,
} from "vuex";

import userModule from "./user";
import ticketModule from "./user";
export interface StateInterface {
  example: unknown;
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $store: VuexStore<StateInterface>;
  }
}

const storeKey: InjectionKey<VuexStore<StateInterface>> = Symbol("vuex-key");

export function useStore() {
  return vuexUseStore(storeKey);
}

export default store(function () {
  const Store = createStore<StateInterface>({
    modules: { userModule, ticketModule },

    strict: !!process.env.DEBUGGING,
  });

  return Store;
});
