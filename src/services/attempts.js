import { supabase } from "../supabase";

export async function dbAttempts(weekId) {
  const { data, error } = await supabase
    .from("attempts")
    .select("*")
    .eq("week_id", weekId);

  if (error) throw error;

  return data || [];
}

export async function dbAllAttempts() {
  const { data, error } = await supabase.from("attempts").select("*");

  if (error) throw error;

  return data || [];
}

export async function updateAttempt(id, values) {
  const { error } = await supabase.from("attempts").update(values).eq("id", id);

  if (error) throw error;
}
