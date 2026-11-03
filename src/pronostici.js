import { callFunction } from "./api";

export async function updatePronostici(userId, delta) {
  return callFunction("pronostici", {
    user_id: userId,
    delta,
  });
}
