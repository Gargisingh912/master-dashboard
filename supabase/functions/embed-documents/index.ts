import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);


// ── Convert a row into plain English ──────────────────────────
function rowToText(table: string, row: any): string {
  switch (table) {
    case "orders":
      return `Order #${row.order_id} on ${row.created_at?.slice(0, 10)}: customer ${row.customer_name}, items: ${row.items_summary}, total ₹${row.total}, status ${row.status}, payment ${row.payment_status}.`;

    case "menu_items":
      return `Menu item: ${row.name}, category ${row.category}, price ₹${row.price}, available: ${row.is_available}.`;

    case "inventory_items":
      return `Inventory: ${row.item}, quantity ${row.qty} ${row.unit}, reorder level ${row.reorder_level}, status ${row.status}.`;

    case "customers":
      return `Customer ${row.name}, phone ${row.contact_number}, total orders ${row.total_orders ?? 0}.`;

    default:
      return JSON.stringify(row);
  }
}

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;

async function embed(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
      }),
    }
  );
  const json = await res.json();
  if (!res.ok || !json.embedding) {
    throw new Error(`Gemini embeddings failed: ${JSON.stringify(json)}`);
  }
  return json.embedding.values;
}
// ── Main handler ───────────────────────────────────────────────
Deno.serve(async (req) => {
  const { organization_id } = await req.json();

  if (!organization_id) {
    return new Response("organization_id required", { status: 400 });
  }

  const tables = ["orders", "menu_items", "inventory", "customers"];
  let indexed = 0;

  for (const table of tables) {
    const { data: rows } = await supabase
      .from(table)
      .select("*")
      .eq("organization_id", organization_id)
      .limit(500);

    if (!rows?.length) continue;

    for (const row of rows) {
      const content = rowToText(table, row);
      const embedding = await embed(content);

      await supabase.from("documents").upsert({
        organization_id,
        content,
        embedding,
        source_table: table,
        source_id: row.id,
        metadata: { table },
      }, { onConflict: "source_id" });

      indexed++;
    }
  }

  return new Response(JSON.stringify({ indexed }), {
    headers: { "Content-Type": "application/json" },
  });
});
