# Claude Coach — Setup

## Architecture (why it's built this way)

- **No backend server.** This is a static site (`index.html` + `js/*` + `css/*`) served by GitHub Pages.
- **WHOOP data** can't be fetched from the browser — WHOOP requires the client secret for token refresh, and that secret must never be in client-side code. So a **GitHub Actions workflow** (`.github/workflows/sync-whoop.yml`) runs on a schedule (and on-demand via "Run workflow" in the Actions tab), refreshes the WHOOP token server-side, pulls recovery/sleep/strain/workouts, encrypts it, and commits `data/whoop-latest.enc.json`.
- **The data file is encrypted** (AES-256-GCM, PBKDF2 210k iterations) because GitHub Pages on the free plan requires a public repo — anyone could otherwise read your health data straight off GitHub. You decrypt it in the app with a passphrase that only lives on your phone.
- **Claude API** is called directly from your phone's browser using Anthropic's official `anthropic-dangerous-direct-browser-access` header (the supported "bring your own key" pattern). Your API key is stored only in this browser's local storage.
- **Workout history** lives in this browser's local storage only (your choice — simplest, no extra secrets, but tied to this one device/browser).

## One-time setup

### 1. Repo secrets
In `github.com/youssefsamouka23-maker/claude-coach` → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|---|---|
| `WHOOP_CLIENT_ID` | `072988ae-be42-4db0-a1a6-b8e20e95c82e` |
| `WHOOP_CLIENT_SECRET` | (the one you provided) |
| `WHOOP_REFRESH_TOKEN` | your refresh token from the WHOOP OAuth flow (needs the `offline` scope) |
| `DATA_PASSPHRASE` | a passphrase you choose — you'll enter the same one in the app's Settings tab |
| `REPO_ADMIN_TOKEN` | a fine-grained PAT scoped to this repo only, with **Contents: Read & write**, **Secrets: Read & write**, **Workflows: Read & write** — used by the workflow to rotate `WHOOP_REFRESH_TOKEN` each run (WHOOP issues a new one on every refresh) |

(If Claude set these up for you directly via the API, you can skip this — just confirm they exist.)

### 2. Enable GitHub Pages
Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save. The site will be live at `https://youssefsamouka23-maker.github.io/claude-coach/` within a minute or two.

### 3. First WHOOP sync
Actions tab → "Sync WHOOP data" → Run workflow. This creates `data/whoop-latest.enc.json`. After that it also runs automatically 3x/day.

### 4. Open the app on your iPhone
Go to the Pages URL → Settings tab → enter your **Data Passphrase** (same value as `DATA_PASSPHRASE`) and your **Anthropic API key** (create one at console.anthropic.com if you don't have one — separate billing from a Claude.ai subscription). Tap Save. Then optionally tap the Share icon → "Add to Home Screen" for an app-like icon.

## Using it

- **Dashboard**: recovery ring, strain gauge, sleep breakdown, recent WHOOP workouts.
- **Today**: pre-filled PPL session (rotates Push A → Pull A → Legs → Push B → Pull B based on your last logged session), shows your last weights/reps per exercise as placeholders, log sets, tap Save Workout.
- **Progress**: pick an exercise, see top-set weight over time.
- **Coach**: builds a prompt from your WHOOP data + today's plan + recent sessions, sends it to Claude, shows the response.

## Notes / limitations

- Workout history is per-browser local storage. Clearing Safari site data or switching phones loses it (no sync was set up, per your choice).
- WHOOP data refreshes on the Action's schedule (~3x/day) or when you manually trigger it from the GitHub Actions tab/app — there's no in-app refresh button, since that would require a second token living in the browser.
- The `REPO_ADMIN_TOKEN` is a powerful credential (it can rewrite this repo's secrets). It's only ever used server-side inside the Action, never sent to or used by the browser app.
