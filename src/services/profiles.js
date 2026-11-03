import { supabase } from "../supabase";

export async function dbProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

export async function dbAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("username");

  if (error) throw error;

  return data || [];
}

export async function dbPublicProfiles() {
  const { data, error } = await supabase
    .from("profiles_public")
    .select("id, username, name, pronostici_indovinati")
    .order("pronostici_indovinati", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;

  return data || [];
}
