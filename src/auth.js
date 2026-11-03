import { supabase } from "../supabase";
import { callFunction } from "./api";

export async function loginWithUsername(username, password) {
  const data = await callFunction("login-username", {
    username: username.trim().toLowerCase(),
    password,
  });

  if (!data?.access_token || !data?.refresh_token) {
    throw new Error("Impossibile completare l'accesso.");
  }

  const { data: sessionData, error } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (error || !sessionData?.session) {
    throw new Error("Impossibile creare la sessione.");
  }

  return sessionData.session;
}

export async function completeInvite(token, username, name, password) {
  return callFunction("completa-invito", {
    token,
    username: username.trim().toLowerCase(),
    name: name.trim(),
    password,
  });
}

export async function requestPasswordRecovery(username) {
  return callFunction("recupera-password", {
    username: username.trim().toLowerCase(),
  });
}
