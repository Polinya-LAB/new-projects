// Edge Function "draft-report": drafts a Qualification Test Results report (QTR) in English with Claude.
// The page (polinya-lab.github.io/new-projects/informes/) sends the test from Control de ensayos, the chosen template
// (simple or complex), the instruments of the calibration plan and the content of the test folder (text already
// extracted in the browser, photos reduced, scanned PDFs as files). The function answers with the report content and
// the problems found; the page lays it out with the lab template and makes the PDF.
// The Anthropic key lives only here, as the secret ANTHROPIC_API_KEY. Only signed-in @fluidra.com users can call it.
// Reference reports used as style examples are in the table report_examples (internal, read with the service role).
import Anthropic from "npm:@anthropic-ai/sdk@0.135.0";
import { betaZodOutputFormat } from "npm:@anthropic-ai/sdk@0.135.0/helpers/beta/zod";
import { z } from "npm:zod@4.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["https://polinya-lab.github.io", "http://localhost:8000"];
const ALLOWED_DOMAIN = "@fluidra.com";
const MODEL = "claude-opus-5-5";
const TIME_LIMIT_MS = 140_000; // the free plan stops functions at 150 s

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
  text: z.string().optional(),                 // Excel: one block per sheet with row numbers and column letters; Word/PDF/text: plain text
  image: z.string().optional(),                // base64 JPEG, already reduced in the browser
  pdf: z.string().optional(),                  // base64 PDF, only for scanned PDFs without text
  info: z.string().optional(),
});
const RequestIn = z.object({
  template: z.enum(["simple", "complex"]),
  plr: z.string(),
  meta: z.record(z.string(), z.string()).optional(),          // report number, author, date, project as set in the page
  tests: z.array(z.record(z.string(), z.unknown())).min(1),
  instruments: z.array(z.record(z.string(), z.unknown())).optional(), // calibration plan, equipment in use
  files: z.array(FileIn),
  answers: z.string().optional(),              // corrections from the lab after a previous draft
  previous: z.unknown().optional(),            // previous draft as edited in the page
});

// What Claude returns. Every field is required; empty strings and arrays when a part does not apply.
const Issue = z.object({
  severity: z.enum(["crit", "warn", "info"]).describe("crit: the report cannot be issued as is; warn: must be checked; info: note"),
  title: z.string().describe("The problem, one sentence"),
  fix: z.string().describe("How to solve it, concrete; empty if there is nothing to suggest"),
  source: z.string().describe("File path or data field the problem comes from; empty if general"),
});
const Block = z.object({
  kind: z.enum(["text", "table", "chart", "figure"]),
  text: z.string().describe("kind=text: the paragraphs. Otherwise empty"),
  caption: z.string().describe("Table/chart/figure caption without the number, e.g. 'Curve results of the motor 860W at 2850rpm'"),
  file: z.string().describe("Source file path for table (Excel/CSV), chart or figure (photo); empty for a table typed in cells"),
  sheet: z.string().describe("Excel sheet name for table or chart"),
  range: z.string().describe("Excel range in A1 notation including the header row, e.g. 'A3:K60', for table or chart"),
  x_col: z.string().describe("Chart: column letter of the X values"),
  y_cols: z.array(z.string()).describe("Chart: column letters of the Y series"),
  x_label: z.string(),
  y_label: z.string(),
  cells: z.array(z.array(z.string())).describe("Table typed by you when the values do not come from one Excel range; first row is the header. Empty otherwise"),
});
const Draft = z.object({
  template_advice: z.object({ recommended: z.enum(["simple", "complex"]), reason: z.string() }),
  issues: z.array(Issue),
  title: z.string().describe("Report title for the header, normally the test title of the test record"),
  summary: z.object({
    test_description: z.string(),
    sample_information: z.string().describe("Lines 'Unit Type: …', 'Sample Size: …' per sample group, then 'Build Phase: …'"),
    qtp_deviations: z.string(),
    acceptance: z.array(z.object({ criterion: z.string(), result: z.enum(["PASS", "FAIL", "N/A"]) })),
    results_summary: z.string(),
  }),
  samples: z.array(z.object({
    sn: z.string(), pn: z.string(), phase: z.string(), drawing_rev: z.string(), description: z.string(), reception_date: z.string(),
  })).describe("Complex template: table 1.1 Samples description. Empty for simple"),
  standards: z.string().describe("Complex: standards applied, if the files name them; empty otherwise"),
  execution_description: z.string().describe("Complex: 1.2 Execution description. Empty for simple"),
  execution_blocks: z.array(Block).describe("Complex: tables or figures inside 1.2 (test conditions, drop sequences…). Empty otherwise"),
  instruments: z.array(z.object({
    code: z.string().describe("Inventory code from the calibration plan (FLE-xxx); empty if not in the plan"),
    instrument: z.string(), characteristic: z.string(), model_code: z.string(), manufacturer: z.string(),
    range: z.string(), last_revision: z.string(), next_revision: z.string(),
  })).describe("Complex: 1.3 measurement instruments used. Empty for simple"),
  environment: z.object({ temperature: z.string(), humidity: z.string() }).describe("Complex: environmental conditions; empty strings if unknown"),
  results: z.array(Block).describe("Simple: Test Results Details. Complex: 2. RESULTS"),
  conclusion: z.string(),
  annexes: z.array(z.object({
    title: z.string().describe("e.g. 'PICTURES BEFORE THE TEST', 'PICTURES AFTER 240 HOURS OF TEST'"),
    pictures: z.array(z.object({ file: z.string(), caption: z.string() })),
  })).describe("Complex: 4. ANNEXES picture groups. Empty for simple (use figure blocks in results instead)"),
  overall_result: z.enum(["PASS", "FAIL", "N/A", "CONDITIONAL", "INCONCLUSIVE"]),
});

const STYLE = `You write Qualification Test Results reports (QTR) for the R&D test laboratory of Fluidra in Polinyà (Polinyà Design Center), which tests pool equipment: pumps, motors, filters, valves, skimmers, chlorinators, cleaners, heat pumps, lighting, packaging.
Reports are in English: formal, technical, third person, past tense for what was done, present tense for what the results show. Clear and concise, as in the examples.

TEMPLATES
Both start with page 1 "Test Summary": Test Description (one or two sentences: what was tested, method or standard, aim), Test Sample Information ("Unit Type: …", "Sample Size: …" per group, then "Build Phase: …" such as ESL, ESL2, MSL), QTP Deviations (deviations from the QTP instructions and why; "No deviations from QTPxxxx were identified during the test execution." if none), Acceptance Criteria with PASS / FAIL / N/A, and Test Results Summary (the key results with numbers, which sample failed and why, result per criterion).
- SIMPLE template: then "Test Results Details" (tables, charts and figures with short text, each table/chart/figure with a caption) and "Conclusions" (key takeaways, the overall result, follow-up actions). For single tests with a clear measurement: performance curves, starting torque, vibration, finger test.
- COMPLEX template: then 1. TEST DESCRIPTION with 1.1 SAMPLES DESCRIPTION (table S/N, P/N, project phase, drawing/rev, description, reception date), optional standards, 1.2 EXECUTION DESCRIPTION (how the test was set up and run, step by step, test conditions; tables for sequences or conditions), 1.3 MEASUREMENTS INSTRUMENTS AND ENVIRONMENTAL CONDITIONS (instrument table and temperature/humidity), 2. RESULTS (per sample and criterion; tables like SAMPLE / CRITERIA / INSPECTION / OBTAINED / RESULT), 3. CONCLUSION (ending with "Final assessment: …" when the result is conditional or needs follow-up), 4. ANNEXES (pictures grouped by stage: before the test and set-up, after each inspection or sample). For several samples or stages, packaging (ISTA), climatic, UV, salt fog, sound power, endurance.

RULES
- Use only the data provided: the test record from Control de ensayos (the lab tracking app), the calibration plan and the files of the test folder. Never invent values, dates, part numbers, sample IDs, instruments or results.
- When something the report needs is missing, unclear or contradictory (between files, or between the files and the test record), write a placeholder like [MISSING: what] where it goes and add an issue with a concrete fix. Typical: unknown P/N, missing acceptance criterion, photos without a stage, result in the record that the data does not support.
- Judge each acceptance criterion against the data. If no criterion is available, use N/A and add an issue instead of guessing. The overall result follows the criteria.
- Numbers keep their units and the precision of the source. Do not retype long data: for a table that is an Excel range, give file, sheet and range (with the header row) and the page shows the real cells; type cells only for short tables you compose from several sources. For a curve, give a chart with the X column and Y columns of the range.
- Instruments: choose them from the calibration plan when they match the test and the files (give the FLE code; the page fills the rest from the plan). Add instruments that are not in the plan with the data you have and an issue.
- Pictures: use the file paths given; group them as the lab does (before the test / set-up, after each stage or sample) with short captions like "Sample #1 after 240 h". In the simple template put the relevant photos as figure blocks in the results.
- Text fields: paragraphs separated by a blank line; bullet lists with lines starting "- ".
- template_advice: recommend the template that fits the test as described above, even if it differs from the one chosen.
- Issues are read by the lab technician who will fix them: short, actionable, and say where (file or field).
- When a previous draft and corrections from the lab are given, keep the previous draft and apply the corrections; do not rewrite parts the lab did not ask to change.`;

let examplesCache: string | null = null;
async function examples(): Promise<string> {
  if (examplesCache !== null) return examplesCache;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await admin.from("report_examples").select("template, qtr, body").eq("active", true).order("id");
  examplesCache = (data ?? []).map((e) => `<example template="${e.template}" report="${e.qtr}">\n${e.body}\n</example>`).join("\n\n");
  return examplesCache;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const fail = (status: number, error: string) => new Response(JSON.stringify({ error }), { status, headers });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return fail(405, "Use POST");

  // Signed-in Fluidra user only. Checked here rather than with verify_jwt, which does not accept the newer signing keys.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
  if (!user?.email?.toLowerCase().endsWith(ALLOWED_DOMAIN)) return fail(401, "Sign in with your Fluidra email.");
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return fail(500, "The Anthropic API key is not set in Supabase (secret ANTHROPIC_API_KEY).");

  let body: z.infer<typeof RequestIn>;
  try {
    body = RequestIn.parse(await req.json());
  } catch (e) {
    return fail(400, "Bad request: " + (e as Error).message);
  }

  const content: Anthropic.Beta.BetaContentBlockParam[] = [{
    type: "text",
    text: `Request ${body.plr}. Template chosen by the lab: ${body.template.toUpperCase()}.\n` +
      `Report header as set in the page: ${JSON.stringify(body.meta ?? {})}\n\n` +
      `Test record from Control de ensayos:\n${JSON.stringify(body.tests, null, 1)}\n\n` +
      `Calibration plan (instruments in use):\n${JSON.stringify(body.instruments ?? [])}`,
  }];
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
  if (body.previous) content.push({ type: "text", text: `Previous draft, as edited by the lab:\n${JSON.stringify(body.previous)}` });
  if (body.answers) content.push({ type: "text", text: `Corrections and answers from the lab:\n${body.answers}` });
  content.push({ type: "text", text: `Write the report for the ${body.template.toUpperCase()} template and list every problem you found.` });

  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIME_LIMIT_MS);
  const started = Date.now();
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(Draft) },
      system: [
        { type: "text", text: STYLE },
        { type: "text", text: `Reference reports from the lab, for structure and style only (their data belongs to other tests):\n\n${await examples()}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content }],
    }, { signal: abort.signal });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") return fail(502, "The AI declined to draft this report.");
    if (msg.stop_reason === "max_tokens" || !msg.parsed_output) return fail(502, "The draft was cut short. Try with fewer files.");
    return new Response(JSON.stringify({ draft: msg.parsed_output, model: msg.model, usage: msg.usage, seconds: Math.round((Date.now() - started) / 1000) }), { headers });
  } catch (e) {
    if (abort.signal.aborted) return fail(504, "The draft took too long. Try with fewer photos or files.");
    const status = e instanceof Anthropic.RateLimitError ? 429 : e instanceof Anthropic.APIError ? 502 : 500;
    return fail(status, (e as Error).message);
  } finally {
    clearTimeout(timer);
  }
});
