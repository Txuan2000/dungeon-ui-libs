# Knowledge Graph

Compact, machine-readable index of every component, directive, service,
demo page, and cross-component relationship in this repo. Designed to be
the **first** thing an AI agent reads when navigating the codebase, so
the rest of the work can avoid scanning whole files or running many RAG
queries.

The graph itself lives in [`knowledge-graph.json`](./knowledge-graph.json).
This file is its quick-start guide.

## Why a static KG when we already have RAG?

- **RAG is breadth + relevance** — semantic search finds chunks similar
  to a query, but it doesn't know "DgDialog uses DgFocusTrap" unless a
  doc says so verbatim. RAG returns 5–10 chunks per query (~hundreds of
  tokens each).
- **The KG is structure + cheap** — one JSON load (~6 KB) gives the
  agent the entire shape of the codebase: 20+ exports, file paths,
  selectors, inputs/outputs, demo routes, relationships, deliberate
  scope-downs versus PrimeNG. Most "where / what / how does X relate to
  Y" questions resolve without a single RAG call.

The two are complementary: KG for the map, RAG for the terrain.

## Top-level shape

```jsonc
{
  "framework":  { /* angular version, peer deps, build/test cmds */ },
  "patterns":   { /* selector prefix, signals, CVA list, encap rules */ },
  "library":    {
    "exports": [ /* DgButton, DgInputText, ... 20+ entries */ ]
  },
  "demo_app":   {
    "shell":   { /* App layout */ },
    "routes":  [ /* one entry per page */ ],
    "search":  { /* AppSearch + curated index */ }
  },
  "relationships":      [ /* from → rel → to */ ],
  "primeng_alignment":  { /* what each Dg* mirrors */ },
  "deliberately_skipped": { /* per-component scope-downs */ },
  "rag": { /* db path, project ids, memory rule */ },
  "navigation_hints_for_ai": [ /* short prose tips */ ]
}
```

## Each `library.exports[i]` entry covers

- `name` (e.g. `"DgInputMask"`)
- `kind`: `component | directive | service`
- `selector` (or `exportAs` where it matters)
- `path` to the `.ts` file (relative to `projects/dungeon-ui/src`)
- `purpose`: 1-line "what is this for"
- `inputs` / `outputs` (names only — the body lives in the source)
- `demo` route in the demo app
- Cross-references where they exist:
  `field_class` (the visible inner element a layout wrapper targets),
  `cva: true`, `templates`, `methods`, `uses`, `encapsulation`, etc.

## Recommended use by an AI agent

1. **Start with the KG.** Load it once at the start of a session. It
   answers "what components exist", "where is each defined", "what
   composes what".
2. **Use RAG (`mcp__dungeon-rag__rag_query` with `project_id="dungeon-ui"`)
   for chunk-level details** — implementation specifics, exact code,
   docs prose. The KG points you to the right file; RAG fills in the
   text.
3. **Update the KG when you change shape.** Adding a new component, a
   new input, or a new relationship → bump
   `knowledge-graph.json` in the same change. The
   [`feedback_keep_overview_doc_in_sync` memory](../README.md) covers
   `dungeon-ui-overview.md` in the same spirit; the KG follows the same
   rule.
4. **Ingest both into RAG** so future agents can find them via search:
   `mcp__dungeon-rag__rag_ingest` on `docs/` (the KG is JSON which the
   chunker treats as plain text — that's fine).

## Why this format minimizes tokens

- **No prose duplication.** The KG references file paths instead of
  inlining code; details live in source.
- **Stable field names** so the agent can extract values without reading
  the whole document.
- **One file** rather than scattered `*.md` blurbs.
- **Single ~6 KB load** versus 50+ KB across docs / source / tests for
  the same map view.
