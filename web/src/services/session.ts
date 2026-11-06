import { ref } from "vue";

// Credentials never enter browser storage. The API owns HttpOnly cookies.
export const sessionUser = ref<any>(null);
export const sessionReady = ref(false);
export let sessionRevision = 0;
export function clearLegacyCredentials() {
  for (const key of ["auth_token", "user", "CICLOCAIRU@TIPEC23500/USER", "TIPEC23500-USER-DATA"]) {
    localStorage.removeItem(key);
  }
}
export function setSession(user: any) {
  sessionRevision++;
  clearLegacyCredentials();
  sessionUser.value = user;
  sessionReady.value = true;
}
export function clearSession() { setSession(null); }
