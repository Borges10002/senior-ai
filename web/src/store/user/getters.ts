import { GetterTree } from "vuex";
import { StateInterface } from "src/store/index";
import { UserStateInterface } from "src/store/user/state";

const getters: GetterTree<UserStateInterface, StateInterface> = {
  PEGADATA(state) {
    return state;
  },
};

export default getters;
