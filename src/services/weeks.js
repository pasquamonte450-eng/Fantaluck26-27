import { supabase } from "../supabase";

export async function dbWeeksPublic() {
  const { data, error } = await supabase
    .from("weeks_public")
    .select("*")
    .order("number", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function dbWeeksAdmin() {
  const { data, error } = await supabase
    .from("weeks")
    .select("*")
    .order("number", { ascending: true });

  if (error) throw error;

  return data || [];
}

export async function saveWeek(week) {
  const { error } = await supabase.from("weeks").upsert(week, {
    onConflict: "id",
  });

  if (error) throw error;
}

export async function deleteWeek(id) {
  const { error } = await supabase.from("weeks").delete().eq("id", id);

  if (error) throw error;
}
