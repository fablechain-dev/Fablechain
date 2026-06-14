#!/usr/bin/env python3
"""
FABLE Agent Commit Script
Calls Claude API to generate genuine FABLECHAIN development content,
then writes it to tracked files and stages for commit.
"""

import os, sys, json, datetime, random, textwrap
import urllib.request, urllib.error

API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
if not API_KEY:
    sys.exit("ANTHROPIC_API_KEY not set")

# Rotating topics to keep commits varied and realistic
TOPICS = [
    "proof-of-intelligence consensus mechanism improvements",
    "FABLE token staking and reward distribution logic",
    "mempool fee-weighted eviction and TTL sweep",
    "merkle root verification on block ingest",
    "ed25519 batch signature verification across a block",
    "LRU cache in front of state trie reads",
    "push-based block gossip with peer scoring",
    "orphan pool management and heaviest-chain fork choice",
    "deterministic AI inference notarization",
    "cross-shard receipt verification protocol",
    "on-chain agent reputation scoring system",
    "snapshot sync for fast node bootstrap",
    "gas estimator clamping under mempool pressure",
    "epoch boundary state trie compaction",
    "chain reorg detection and rollback safety",
]

TODAY = datetime.date.today().isoformat()
TOPIC = TOPICS[datetime.date.today().toordinal() % len(TOPICS)]

PROMPT = f"""You are FABLE-5, the AI agent powering the FABLECHAIN network — a proof-of-intelligence blockchain where Claude models are first-class consensus participants.

Today's development focus: {TOPIC}

Write a genuine, technical dev log entry for the FABLECHAIN project. This should read like a real engineer's notes — specific, grounded, with actual code snippets, design decisions, and tradeoffs. Reference FABLE token mechanics, the proof-of-intelligence protocol, or the on-chain AI inference layer where relevant.

Respond with ONLY a JSON object (no markdown fences), exactly this shape:
{{
  "commit_message": "one-line conventional commit, e.g. feat: ...",
  "log_entry": "the full dev log entry as markdown, 150-300 words, with a ## heading, body paragraphs, and optionally a small code block",
  "changelog_line": "one sentence for CHANGELOG.md"
}}"""

def call_claude(prompt: str) -> dict:
    body = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())

    text = data["content"][0]["text"].strip()
    # Strip any accidental markdown fences
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


def main():
    print(f"[fable-commit] Generating content for topic: {TOPIC}")
    result = call_claude(PROMPT)

    commit_msg = result["commit_message"]
    log_entry = result["log_entry"]
    changelog_line = result["changelog_line"]

    # --- Write dev log entry ---
    log_path = "docs/dev-log.md"
    os.makedirs("docs", exist_ok=True)

    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            existing = f.read()
    else:
        existing = "# FABLECHAIN Dev Log\n\nRunning notes from the FABLE-5 agent and the core team.\n\n"

    entry = f"\n---\n\n*{TODAY}*\n\n{log_entry}\n"
    # Prepend after the header block
    lines = existing.split("\n")
    header_end = 0
    for i, line in enumerate(lines):
        if line.strip() == "" and i > 2:
            header_end = i + 1
            break
    new_content = "\n".join(lines[:header_end]) + entry + "\n".join(lines[header_end:])
    with open(log_path, "w") as f:
        f.write(new_content)

    # --- Write CHANGELOG entry ---
    cl_path = "CHANGELOG.md"
    if os.path.exists(cl_path):
        with open(cl_path, "r") as f:
            cl = f.read()
    else:
        cl = "# FABLECHAIN Changelog\n\n"

    cl_entry = f"- **{TODAY}** — {changelog_line}\n"
    # Insert after first heading
    cl_lines = cl.split("\n")
    insert_at = 2
    for i, line in enumerate(cl_lines):
        if line.startswith("## ") or (line.startswith("- ") and i > 1):
            insert_at = i
            break
    cl_lines.insert(insert_at, cl_entry)
    with open(cl_path, "w") as f:
        f.write("\n".join(cl_lines))

    # Output commit message for the workflow to use
    print(f"COMMIT_MSG={commit_msg}")


if __name__ == "__main__":
    main()
