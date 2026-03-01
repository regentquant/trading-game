# AUTO Plan & Code

1. Before writing or editing any code, first output a detailed step-by-step plan (files to modify, specific changes, rationale)
2. Immediately execute the full plan without pausing for confirmation

# AUTO Commit Workflow

- **Commit and push once per task**, not after every individual file change
- A "task" is one logical unit of work (e.g., a feature, a bug fix, a refactor) — bundle all related file changes into a single commit
- Use `git commit -m "subject line"` with a concise, descriptive subject line only (no body, no multi-line)
- Stage only the files you modified: `git add <specific-files>` then commit
- **ALWAYS `git push` as the very last step of every conversation** — no exceptions, no skipping. If you made any commits during the conversation, you must push before finishing.
- Do NOT use `--no-verify` or skip hooks unless explicitly asked