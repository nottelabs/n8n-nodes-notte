# n8n-nodes-notte

[n8n](https://n8n.io/) community node for [Notte](https://notte.cc) — AI browser automation, web scraping, and workflow execution.

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

[MIT](LICENSE)
