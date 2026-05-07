# n8n-nodes-notte - Browser automation in your n8n workflows

<div align="center">
  <p>
    <strong><a href="https://n8n.io/integrations/notte-trigger/" target="_blank" rel="noopener noreferrer">Install the official Notte node on n8n.io →</a></strong>
  </p>
  <p>
    <a href="https://n8n.io/" target="_blank" rel="noopener noreferrer">n8n</a> community node for <strong>Notte</strong> — AI browser automation, web scraping, and workflow execution <br/>
    → Read more at: <a href="https://notte.cc?ref=github" target="_blank" rel="noopener noreferrer">Landing</a> • <a href="https://console.notte.cc/?ref=github" target="_blank" rel="noopener noreferrer">Console</a> • <a href="https://docs.notte.cc?ref=github" target="_blank" rel="noopener noreferrer">Docs</a> • <a href="https://x.com/nottecore?ref=github" target="_blank" rel="noopener noreferrer">X</a> • <a href="https://www.linkedin.com/company/nottelabsinc/?ref=github" target="_blank" rel="noopener noreferrer">LinkedIn</a>
  </p>
</div>

[![GitHub stars](https://img.shields.io/github/stars/nottelabs/n8n-nodes-notte?style=social)](https://github.com/nottelabs/n8n-nodes-notte/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/n8n-nodes-notte?color=blue)](https://www.npmjs.com/package/n8n-nodes-notte)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-blue.svg)](https://docs.n8n.io/integrations/community-nodes/)

---

# What is n8n-nodes-notte?

This package brings the full power of [notte.cc](https://notte.cc?ref=github) into your [n8n](https://n8n.io/) workflows — letting you run AI browser agents, scrape structured data, execute deployed Notte functions, and trigger workflows on persona emails or SMS, all from inside the n8n editor.

## Features

This node provides three modes of operation:

### Agent Mode
Run an AI agent that autonomously performs browser tasks. Provide a URL and a natural language instruction — the node handles session lifecycle, agent execution, and polling automatically.

- Structured output via JSON schema
- Auto-login with Vault credentials
- Persona identity support
- Vision and captcha solving options

### Scrape Mode
Extract structured data from any URL. Define a JSON schema for the output format and provide extraction instructions.

- CSS selector scoping
- Proxy and captcha support
- Returns both markdown and structured JSON

### Function Mode
Execute deployed Notte functions (authored via the [Notte CLI](https://docs.notte.cc)). Pass variables from your n8n workflow and get results back.

- Key-value variable injection from n8n expressions
- Configurable polling interval and timeout
- Fire-and-forget or wait-for-completion

### Trigger Node
Poll for new persona emails or SMS messages to kick off workflows automatically.

## Installation

### In n8n (recommended)
1. Go to **Settings > Community Nodes**
2. Search for `n8n-nodes-notte`
3. Click **Install**

### Manual
```bash
npm install n8n-nodes-notte
```

## Credentials

You need a Notte API key. Get one at [notte.cc](https://notte.cc).

| Field | Description |
|-------|-------------|
| API Key | Your Notte API key |
| Base URL | API endpoint (default: `https://api.notte.cc`) |

## Example Workflows

### Scheduled competitor scraping
```
Schedule Trigger → Notte (Scrape: competitor.com/pricing) → Google Sheets
```

### AI agent task with notifications
```
Webhook Trigger → Notte (Agent: "sign up for trial on {{url}}") → Slack
```

### Run deployed automation
```
Schedule Trigger → Notte (Function: fn_abc123, variables from sheet) → Email
```

### React to verification emails
```
Notte Trigger (New Email on persona) → Notte (Agent: "click verification link") → Done
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Lint
npm run lint

# Dev mode (auto-reload in local n8n)
npm run dev
```

## License

This project is licensed under the [MIT License](LICENSE).

## Links

- [Landing](https://notte.cc?ref=github)
- [Console](https://console.notte.cc/?ref=github)
- [Documentation](https://docs.notte.cc?ref=github)
- [Main repository (nottelabs/notte)](https://github.com/nottelabs/notte)

Copyright © 2026 Notte Labs, Inc.
