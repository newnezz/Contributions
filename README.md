# Meaningless Commit Satire App

A tiny, transparent satire app that auto-generates meaningless Git commits to parody contribution-graph gaming.

## What it does

- Runs on GitHub Actions schedule (free tier)
- Creates random, pointless commit messages at configurable intervals
- Updates a simple feed in `public/commits.json`
- Shows recent generated commits in `public/index.html`

## Project files

- `scripts/generate-commit.mjs` - generator script
- `config/commit-config.json` - runtime settings
- `.github/workflows/meaningless-commits.yml` - scheduler + automation
- `data/meaningless-log.txt` - harmless marker file that changes each run
- `public/` - static frontend and generated feed

## Quick setup

1. Push this repo to GitHub.
2. In GitHub repo settings, open **Actions > General**:
   - Allow GitHub Actions
   - Set workflow permissions to **Read and write permissions**
3. In **Actions**, run `Meaningless Commits` once via **Run workflow**.
4. Confirm commits appear in history and `public/commits.json` updates.

## Configure frequency

Two knobs control output:

1. Workflow cron in `.github/workflows/meaningless-commits.yml`
2. `commitsPerRun` in `config/commit-config.json`

Effective commits per hour:

`commitsPerHour = runsPerHourFromCron * commitsPerRun`

Example:

- Cron `*/15 * * * *` = 4 runs/hour
- `commitsPerRun: 3`
- Total `12 commits/hour`

You can also spread commits within each run using:

- `minDelayMs`
- `maxDelayMs`

## Free hosting options

### 1) Automation (commit bot): GitHub Actions

Already configured in `.github/workflows/meaningless-commits.yml`.

### 2) Frontend: GitHub Pages

Simplest option:

1. Go to **Settings > Pages**
2. Set source to **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Open `https://<your-user>.github.io/<your-repo>/public/`

The page reads:

- `config/commit-config.json`
- `public/commits.json`

## Testing checklist

- Run workflow manually with `workflow_dispatch`
- Confirm at least one new commit is pushed
- Open `public/index.html` locally (or Pages URL) and confirm recent items render
- Change `commitsPerRun`, rerun workflow, verify output volume changes

## Troubleshooting

### Workflow runs but no push

- Ensure workflow has `permissions: contents: write`
- Ensure repo settings allow read/write workflow permissions
- Ensure default branch is writable

### Scheduled runs are delayed

- GitHub cron on free tier is best-effort, not exact real-time
- Use wider cadence like every 15 minutes for stability

### UI cannot load config

- If using Pages, verify site is served from branch root and open `/public/` path
- Confirm `config/commit-config.json` exists in the published branch

### Detached HEAD or branch mismatch in Actions

- Keep `actions/checkout` with `fetch-depth: 0`
- Run workflow on your main working branch

## Disclaimer

This repository intentionally generates meaningless commits as satire. It is explicitly not meant to represent real development productivity or technical skill.
# Contributions
# Contributions
