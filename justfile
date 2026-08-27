set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

validate: python-check js-check
    python3 scripts/validate-fish-wiki.py
    python3 scripts/validate-fish-render-manifest.py

python-check:
    python3 -m py_compile scripts/build-fish-wiki.py scripts/validate-fish-wiki.py scripts/validate-fish-render-manifest.py tools/fish-render-source/download_sources.py tools/fish-render-source/extract_fish_render_sources.py

js-check:
    node --check assets/app.js
    node --check assets/fish-wiki.js
    node --check assets/fish-site-search.js
    node --check assets/fish-detail-nav.js
    node --check assets/fish-catalog-redesign.js
    node --check assets/fish-specimen-lab-stable.js
    node --check scripts/qa-fish-wiki.mjs

browser-qa:
    node scripts/qa-fish-wiki.mjs

exporter-check:
    cd tools/fish-render-export/TideFishRenderExporter && gradle --no-daemon check

repo-state:
    @cat .ai/state.json
