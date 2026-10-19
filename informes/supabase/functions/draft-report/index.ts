// Edge Function "draft-report": drafts a test report in English with Claude.
// The page (polinya-lab.github.io/new-projects/informes/) sends the test from Control de ensayos, the chosen template and the
// content of the test folder (text already extracted in the browser, photos reduced, scanned PDFs as files). The function
// answers with the draft and the problems found. The Anthropic key lives only here, as the secret ANTHROPIC_API_KEY.
// Only signed-in users with an @fluidra.com address can call it.
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { betaZodOutputFormat } from "npm:@anthropic-ai/sdk@0.135.0/helpers/beta/zod";
import { z } from "npm:zod@4.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["https://polinya-lab.github.io", "http://localhost:8000"];
const ALLOWED_DOMAIN = "@fluidra.com";
const MODEL = "claude-opus-5-5";

const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

// What the page sends.
const FileIn = z.object({
  path: z.string(),
  kind: z.string(),
  text: z.string().optional(),                 // Excel as CSV per sheet, Word/PDF/text as plain text
  image: z.string().optional(),                // base64 JPEG, already reduced in the browser
  pdf: z.string().optional(),                  // base64 PDF, only for scanned PDFs without text
  info: z.string().optional(),
});
const RequestIn = z.object({
  template: z.enum(["simple", "complex"]),
  plr: z.string(),
  tests: z.array(z.record(z.string(), z.unknown())).min(1),
  files: z.array(FileIn),
  templateGuide: z.string().optional(),        // structure of the chosen template, once the templates are in
  answers: z.string().optional(),              // corrections from the lab after a previous draft
});

// What Claude returns.
const Issue = z.object({
  severity: z.enum(["crit", "warn", "info"]).describe("crit: the report cannot be issued; warn: must be checked; info: note"),
  title: z.string().describe("The problem, one sentence"),
  fix: z.string().describe("How to solve it, concrete; empty if there is nothing to suggest"),
  source: z.string().describe("File path or data field the problem comes from; empty if general"),
});
const Table = z.object({
  caption: z.string(),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  source: z.string().describe("File the values come from"),
});
const Draft = z.object({
  template_advice: z.object({
    recommended: z.enum(["simple", "complex"]),
    reason: z.string(),
  }),
  issues: z.array(Issue),
  report: z.object({
    title: z.string(),
    summary: z.string(),
    objective: z.string(),
    reference_documents: z.array(z.string()).describe("QTP, standards and specifications applied"),
    samples: z.array(z.object({ id: z.string(), description: z.string() })),
    equipment: z.array(z.object({ name: z.string(), identification: z.string(), calibration: z.string() })),
    procedure: z.string(),
    results: z.string(),
    tables: z.array(Table),
    figures: z.array(z.object({ file: z.string(), caption: z.string() })).describe("Photos to include, by file path"),
    conclusion: z.string(),
    result: z.enum(["Pass", "Fail", "N/A", "Inconclusive"]),
    observations: z.string(),
  }),
});

const SYSTEM = `You write test reports for the R&D test laboratory of Fluidra in Polinyà (pool equipment: pumps, filters, valves, chlorinators, cleaners, heat pumps, lighting).
Write in clear, formal technical English, in the third person and past tense, as the lab writes its reports.
Rules:
- Use only the data provided: the test record from the lab's tracking app and the files of the test folder. Never invent values, dates, sample IDs, equipment or results.
- When something the report needs is missing, unclear or contradictory (between files, or between the files and the test record), leave a placeholder like [MISSING: what] in the text and add an issue with a concrete fix.
- Check the results against the acceptance criteria found in the QTP or the files. If no criteria are available, say so in an issue instead of judging Pass/Fail.
- Quote numbers with their units and the precision of the source. Tables keep the values exactly as in the source files.
- Choose the figures that best show the samples before and after the test and any failure; use the file paths given.
- template_advice: "simple" fits a single test with a clear result and little data; "complex" fits several tests, long data series or analysis. Recommend honestly even if it differs from the template chosen.
- Issues are read by the lab technician who will fix them: keep them short and actionable.`;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Use POST" }), { status: 405, headers });

  // Signed-in Fluidra user only.
  // Checked here rather than with verify_jwt, which does not accept the project's newer signing keys.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  if (!user?.email?.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return new Response(JSON.stringify({ error: "Sign in with your Fluidra email." }), { status: 401, headers });
  }

  let body: z.infer<typeof RequestIn>;
  try {
    body = RequestIn.parse(await req.json());
  } catch (e) {
    return new Response(JSON.stringify({ error: "Bad request: " + (e as Error).message }), { status: 400, headers });
  }

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  content.push({
    type: "text",
    text: `Request ${body.plr}. Template chosen by the lab: ${body.template}.\n\nTest record from the lab tracking app (Control de ensayos):\n${JSON.stringify(body.tests, null, 1)}` +
      (body.templateGuide ? `\n\nStructure of the ${body.template} template:\n${body.templateGuide}` : ""),
  });
  for (const f of body.files) {
    if (f.image) {
      content.push({ type: "text", text: `Photo: ${f.path}${f.info ? ` (${f.info})` : ""}` });
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: f.image } });
    } else if (f.pdf) {
      content.push({ type: "document", title: f.path, source: { type: "base64", media_type: "application/pdf", data: f.pdf } });
    } else if (f.text) {
      content.push({ type: "text", text: `<file path="${f.path}" kind="${f.kind}">\n${f.text}\n</file>` });
    }
  }
  if (body.answers) content.push({ type: "text", text: `Corrections and answers from the lab to the previous draft:\n${body.answers}` });
  content.push({ type: "text", text: "Draft the report and list every problem you found." });

  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Draft) },
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") {
      return new Response(JSON.stringify({ error: "The AI declined to draft this report." }), { status: 502, headers });
    }
    if (msg.stop_reason === "max_tokens" || !msg.parsed_output) {
      return new Response(JSON.stringify({ error: "The draft was cut short. Try with fewer files." }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ draft: msg.parsed_output, model: msg.model, usage: msg.usage }), { headers });
  } catch (e) {
    const status = e instanceof Anthropic.RateLimitError ? 429 : e instanceof Anthropic.APIError ? 502 : 500;
    return new Response(JSON.stringify({ error: (e as Error).message }), { status, headers });
  }
});
