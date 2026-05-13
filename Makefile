# dungeon-ui-libs — common dev / deploy commands.
# Usage: `make <target>`. Run `make help` (or just `make`) for the list.
# Requires GNU make (Windows: Git Bash, WSL, or `choco install make`).

.DEFAULT_GOAL := help
.PHONY: help install build build-lib dev test validate clean \
        icons-build \
        rag-status rag-ingest \
        pages-dev pages-clean deploy deploy-preview \
        cdn-bump cdn-deploy \
        build-elements elements-deploy

# Wrangler publish dir (mirrors `pages_build_output_dir` in wrangler.jsonc).
PAGES_DIR := dist/dungeon-ui-libs/browser
# Library bundle dir (ng-packagr output) — published as a CDN via a SECOND Pages project.
CDN_DIR   := dist/dungeon-ui
CDN_PROJ  := dungeon-ui-cdn
# Web Components bundle dir (Angular Elements) — published as a THIRD Pages project.
ELEMENTS_DIR  := dist/dungeon-ui-elements/browser
ELEMENTS_PROJ := dungeon-ui-elements

# ---- Help ---------------------------------------------------------------

help: ## Show this help.
	@awk 'BEGIN { FS = ":.*?## " } \
	     /^[a-zA-Z0-9_-]+:.*?## / { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 }' \
	     $(MAKEFILE_LIST)

# ---- Setup --------------------------------------------------------------

install: ## Install npm dependencies (uses --legacy-peer-deps for ssr/wrangler).
	npm install --legacy-peer-deps

# ---- Build / dev --------------------------------------------------------

build: ## Build lib + showcase (prerendered, production).
	npx ng build dungeon-ui
	npx ng build --configuration production

build-lib: ## Build only the dungeon-ui library to dist/dungeon-ui.
	npx ng build dungeon-ui

icons-build: ## Build standalone icon artifacts (dg-icons.css + webfont) into dist/dungeon-ui/icons + public/icons.
	@# Two emits: dist/ for the npm/CDN consumer, public/ for the showcase to
	@# serve at /icons/dg-icons.css. The script regenerates from the
	@# DG_ICONS registry — no need to re-touch primeng-ref.
	node scripts/build-icon-artifacts.mjs
	node scripts/build-icon-artifacts.mjs --dest=public/icons

dev: ## Run the showcase dev server (ng serve, http://localhost:4200).
	npx ng serve

test: ## Run unit tests (vitest).
	npx ng test

validate: ## Validate knowledge-graph.json against the filesystem.
	node scripts/validate-graph.mjs

clean: ## Remove build outputs + Angular cache.
	rm -rf dist/ .angular/cache/

# ---- RAG ----------------------------------------------------------------

rag-status: ## Print RAG index stats (chunk count, models, db path).
	@echo "Run via the dungeon-rag MCP tool: mcp__dungeon-rag__rag_status"

rag-ingest: build-lib ## Re-ingest lib + docs + showcase into the RAG index.
	@echo "Run via MCP: rag_ingest projects/dungeon-ui/src + docs + src/app (project_id=dungeon-ui)"

# ---- Cloudflare Pages ---------------------------------------------------

pages-dev: build pages-clean ## Preview the prerendered output in the Cloudflare Workers runtime (http://localhost:8788).
	npx wrangler pages dev

pages-clean: ## Prune files in $(PAGES_DIR) that aren't needed for a static deploy.
	@# index.csr.html is the SSR fallback shell — replaced by `_redirects` (/* -> /index.html).
	@# All 16 routes are prerendered, so the CSR shell is never referenced.
	rm -f $(PAGES_DIR)/index.csr.html

deploy: build pages-clean ## Deploy to production (https://dungeon-ui.pages.dev). Requires `npx wrangler login` once.
	npx wrangler pages deploy

deploy-preview: build pages-clean ## Deploy to the `preview` branch (https://preview.dungeon-ui.pages.dev).
	npx wrangler pages deploy --branch=preview

# ---- Library CDN (separate Pages project) -------------------------------

cdn-bump: ## Bump library version (interactive; or pass VERSION=x.y.z to skip prompt).
	node scripts/bump-version.mjs

cdn-deploy: cdn-bump build-lib icons-build ## Bump version, build, deploy library + icons to https://$(CDN_PROJ).pages.dev.
	@# _headers entry: allow cross-origin ESM imports + cache for 30 days.
	@# 2592000s = 30d. The fesm/types paths don't include a content hash,
	@# so consumers will be pinned to whatever was deployed for up to a month —
	@# bumping package.json `version` (via cdn-bump above) is just a label;
	@# to force consumers off a stale build, purge the Pages cache from the
	@# Cloudflare dashboard or wait out the 30 days.
	@printf '/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=2592000\n' > $(CDN_DIR)/_headers
	@# Pack a versioned tarball alongside fesm2022 so CLI consumers can:
	@#   npm install https://$(CDN_PROJ).pages.dev/dungeon-ui-X.Y.Z.tgz
	@rm -f $(CDN_DIR)/*.tgz
	@cd $(CDN_DIR) && npm pack
	@VERSION=$$(node -p 'require("./projects/dungeon-ui/package.json").version'); \
	  echo "Deploying dungeon-ui v$$VERSION ..."; \
	  npx wrangler pages deploy $(CDN_DIR) --project-name=$(CDN_PROJ) --commit-message="dungeon-ui v$$VERSION"

# ---- Web Components bundle (Angular Elements) ---------------------------

build-elements: ## Build the dungeon-ui-elements bundle (Angular Elements; Angular runtime + lib + CE wrappers in one ESM).
	npx ng build dungeon-ui-elements

elements-deploy: build-elements ## Deploy the elements bundle to https://$(ELEMENTS_PROJ).pages.dev.
	@# CORS for cross-origin <script type="module"> + 30d cache (same as cdn-deploy).
	@printf '/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=2592000\n' > $(ELEMENTS_DIR)/_headers
	@VERSION=$$(node -p 'require("./projects/dungeon-ui/package.json").version'); \
	  echo "Deploying dungeon-ui-elements (lib v$$VERSION) ..."; \
	  npx wrangler pages deploy $(ELEMENTS_DIR) --project-name=$(ELEMENTS_PROJ) --commit-message="dungeon-ui-elements (lib v$$VERSION)"
