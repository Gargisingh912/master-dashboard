import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

async function generateAnswer(context: string, question: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Answer the question using only this context. If the context doesn't contain the answer, say so.\n\nContext:\n${context}\n\nQuestion: ${question}`,
              },
            ],
          },
        ],
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini generateContent failed: ${JSON.stringify(json)}`);
  }
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "No answer generated.";
}

Deno.serve(async (req) => {
  const { organization_id, question } = await req.json();
  if (!organization_id || !question) {
    return new Response("organization_id and question required", { status: 400 });
  }

  // 1. Embed the question
  const queryEmbedding = await embed(question);

  // 2. Vector search
  const { data: matches, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_org_id: organization_id,
    match_count: 8,
  });
  if (error) return new Response(error.message, { status: 500 });

  // 3. Build context
  const context = (matches ?? []).map((m: any) => m.content).join("\n---\n");

  // 4. Call Gemini for the answer
  const answer = await generateAnswer(context, question);

  return new Response(JSON.stringify({ answer, sources: matches }), {
    headers: { "Content-Type": "application/json" },
  });
});