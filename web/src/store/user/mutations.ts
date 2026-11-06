import { MutationTree } from "vuex";
import { UserStateInterface } from "src/store/user/state";

const mutation: MutationTree<UserStateInterface> = {
  SET_DATA(state, data) {
    state.usuario = data;
  },
};

export default mutation;
