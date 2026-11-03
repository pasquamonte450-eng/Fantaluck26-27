import { supabase } from "../supabase";

/** Chiama una Edge Function di Supabase e restituisce `data` o lancia un Error. */
export async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    let message = error.message || "Errore di rete.";

    try {
      const parsed = await error.context?.json?.();

      if (parsed?.error) {
        message = parsed.error;
      }
    } catch {
      // usa messaggio predefinito
    }

    throw new Error(message);
  }

  return data;
}
