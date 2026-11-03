import { callFunction } from "./api";

export async function manageInvites(action, extra = {}) {
  return callFunction("gestisci-inviti", {
    action,
    ...extra,
  });
}

export async function createInvite(email) {
  return callFunction("crea-invito", {
    email: email.trim().toLowerCase(),
  });
}
