import { Module } from "vuex";
import { StateInterface } from "src/store/index";
import state, { UserStateInterface } from "src/store/user/state";
import getters from "src/store/user/getters";
import mutations from "src/store/user/mutations";

const userModule: Module<UserStateInterface, StateInterface> = {
  namespaced: true,
  getters,
  mutations,
  state,
};

export default userModule;
