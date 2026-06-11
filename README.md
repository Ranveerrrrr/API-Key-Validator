# KeyHacks

KeyHacks is a local web application for safely identifying and validating exposed API credentials during authorized security testing and bug bounty work.

The app accepts a pasted key or credential snippet, checks Google first, then attempts provider-specific detection and validation across supported providers. For AI providers, it lists available chat-capable models and lets you test approved prompts against a selected model. For all supported providers, it can generate a professional bug bounty report with neutral reporter fields, impact language, remediation guidance, and export options.

## Features

- Auto-detects provider from a single pasted key or credential snippet.
- Checks Google first before attempting OpenAI, Anthropic, DeepSeek, and the broader KeyHacks provider registry.
- Lists available models/checks with consistent green/red status indicators.
- Supports chat for validated AI model providers.
- Keeps chat history per provider, model, and hashed key across model switches, refreshes, and server restarts without storing the raw key.
- Generates bug bounty reports with copy, Markdown export, HTML export, and PDF export.
- Runs as a dependency-free Node.js app.

## Screenshots and GIFs

Add real captures before publishing a release:

![Dashboard placeholder](docs/screenshots/dashboard-placeholder.png)

![Provider detection placeholder](docs/screenshots/provider-detection-placeholder.png)

![Report generator placeholder](docs/screenshots/report-generator-placeholder.png)

![Workflow GIF placeholder](docs/screenshots/keyhacks-workflow-placeholder.gif)

## Installation

### Requirements

- Node.js 18 or newer
- Network access from the server to provider API endpoints
- A browser on the same host or LAN

### Local install

```bash
git clone https://github.com/Ranveerrrrr/API-Key-Validator.git
cd API-Key-Validator
npm install
npm test
HOST=0.0.0.0 PORT=8099 npm start
```

Open:

```text
http://localhost:8099/
```

### LAN deployment

```bash
HOST=0.0.0.0 PORT=8099 node server.js
```

Optional cron keepalive:

```cron
@reboot /path/to/API-Key-Validator/start.sh >> /path/to/API-Key-Validator/cron.log 2>&1
*/5 * * * * /path/to/API-Key-Validator/start.sh >> /path/to/API-Key-Validator/cron.log 2>&1
```

## Usage

### Validate a key in the UI

1. Open the app.
2. Paste a key or credential snippet into the input.
3. Click `AUTHENTICATE`.
4. Review the detected provider and the model/check list.
5. Use chat only when the bug bounty program scope permits active model testing.
6. Click `Generate Report` to prepare evidence and export the report.

### API example

```bash
curl -s http://localhost:8099/api/models \
  -H "content-type: application/json" \
  -d '{"apiKey":"sk-proj-example"}'
```

Response shape:

```json
{
  "provider": "openai",
  "providerLabel": "OpenAI",
  "checked": ["google", "openai"],
  "models": [
    {
      "id": "gpt-4.1",
      "label": "gpt-4.1",
      "available": true,
      "chatCapable": true,
      "type": "model"
    }
  ]
}
```

### Chat example

```bash
curl -s http://localhost:8099/api/chat \
  -H "content-type: application/json" \
  -d '{
    "provider": "google",
    "apiKey": "AIza...",
    "model": "gemini-2.5-flash",
    "message": "Say hi",
    "history": []
  }'
```

## Report Generation

The report generator includes:

- Title
- Severity
- Summary
- Steps to Reproduce
- Impact
- Evidence
- Screenshots
- Recommended Fix
- Timeline
- References

Exports:

- Copy to clipboard
- Markdown
- HTML
- PDF

Reports use neutral reporter fields and do not automatically include a personal name.

## Supported Providers

Providers are listed by company first, with supported key types underneath each company.

### AB Tasty

- AB Tasty API Key

### Algolia

- Algolia API Key
- Algolia Application ID

### Amazon Web Services

- AWS Access Key ID
- AWS Secret Access Key
- AWS Session Token

### Amplitude

- Amplitude API Key
- Amplitude Secret Key

### Anthropic

- Claude API Key
- Anthropic Admin API Key
- Anthropic Workspace Key

### Asana

- Asana Access Token

### Azure Application Insights

- Application Insights App ID
- Application Insights API Key

### Bazaarvoice

- Bazaarvoice Passkey

### Bing Maps

- Bing Maps API Key

### Bitly

- Bitly Access Token

### Branch.io

- Branch.io Key
- Branch.io Secret

### BrowserStack

- BrowserStack Username
- BrowserStack Access Key

### Buildkite

- Buildkite Access Token

### ButterCMS

- ButterCMS API Key

### Calendly

- Calendly API Key
- Calendly Personal Access Token

### CircleCI

- CircleCI Access Token

### Cloudflare

- Cloudflare API Token
- Cloudflare Global API Key

### Contentful

- Contentful Access Token

### Cypress

- Cypress Record Key

### Datadog

- Datadog API Key
- Datadog Application Key

### DeepSeek

- DeepSeek API Key

### Delighted

- Delighted API Key

### DeviantArt

- DeviantArt Access Token
- DeviantArt Client Secret

### Dropbox

- Dropbox API Token
- Dropbox OAuth Token

### Facebook / Meta

- Facebook Access Token
- Facebook App Secret

### Freshdesk

- Freshdesk API Key

### GitHub

- GitHub Token
- GitHub OAuth Client ID
- GitHub OAuth Client Secret
- GitHub Private SSH Key

### GitLab

- GitLab Personal Access Token
- GitLab Runner Registration Token

### Google

- Gemini API Key
- Vertex AI Key
- Google Maps API Key
- Google Cloud API Key
- Google Cloud Service Account Credentials
- Google reCAPTCHA Key
- Firebase API Key
- Firebase Cloud Messaging Key
- YouTube API Key

### Grafana

- Grafana Access Token

### Help Scout

- Help Scout OAuth Token

### Heroku

- Heroku API Key

### HubSpot

- HubSpot API Key
- HubSpot Private App Token

### Infura

- Infura API Key
- Infura Project ID

### Instagram

- Instagram Access Token
- Instagram Basic Display API Access Token
- Instagram Graph API Access Token

### Ipstack

- Ipstack API Key

### Iterable

- Iterable API Key

### JumpCloud

- JumpCloud API Key

### Keen.io

- Keen.io API Key
- Keen.io Project ID

### LinkedIn

- LinkedIn OAuth Token
- LinkedIn Client Credentials

### Lokalise

- Lokalise API Key

### Loqate

- Loqate API Key

### Mailchimp

- Mailchimp API Key

### Mailgun

- Mailgun Private Key

### Mapbox

- Mapbox Public Token
- Mapbox Secret Token
- Mapbox Temporary Token

### Microsoft Azure

- Azure Tenant ID
- Azure Client ID
- Azure Client Secret
- Azure Shared Access Signature

### Microsoft Teams

- Microsoft Teams Webhook

### New Relic

- New Relic Personal API Key
- New Relic NerdGraph API Key
- New Relic REST API Key

### npm

- npm Token

### OpenAI

- OpenAI API Key
- OpenAI Project Key
- OpenAI Service Account Key

### Opsgenie

- Opsgenie API Key

### PagerDuty

- PagerDuty API Token

### PayPal

- PayPal Client ID
- PayPal Secret Key

### Pendo

- Pendo Integration Key

### Pivotal Tracker

- Pivotal Tracker API Token

### Razorpay

- Razorpay API Key
- Razorpay Secret Key

### Salesforce

- Salesforce API Key
- Salesforce Access Token

### Sauce Labs

- Sauce Labs Username
- Sauce Labs Access Key

### SendGrid

- SendGrid API Token

### Shodan

- Shodan API Key

### Slack

- Slack API Token
- Slack Webhook

### SonarCloud

- SonarCloud Token

### Spotify

- Spotify Access Token

### Square

- Square App ID
- Square Client Secret
- Square Auth Token

### Stripe

- Stripe Live Secret Key
- Stripe Restricted Key
- Stripe Publishable Key

### Telegram

- Telegram Bot API Token

### Travis CI

- Travis CI API Token

### Twilio

- Twilio Account SID
- Twilio Auth Token

### Twitter / X

- Twitter API Secret
- Twitter Bearer Token

### Visual Studio App Center

- Visual Studio App Center API Token

### WakaTime

- WakaTime API Key

### Weglot

- Weglot API Key

### WP Engine

- WP Engine API Key

### YouTube

- YouTube API Key

### Zapier

- Zapier Webhook Token
- Zapier Webhook URL

### Zendesk

- Zendesk Access Token
- Zendesk API Key

## Validation Notes

Some credentials require extra context such as a tenant ID, application ID, account domain, username, project ID, or matching secret. KeyHacks detects those formats and reports the missing context instead of guessing or running unsafe requests.

Provider checks are intentionally low-impact. Avoid endpoints that send messages, mutate data, create resources, or consume significant paid quota unless the program explicitly authorizes that testing.

## Development

```bash
npm test
HOST=127.0.0.1 PORT=8099 npm start
```

Project layout:

```text
server.js                 HTTP server and provider routing
lib/providerRegistry.js   Supported provider metadata and validation helpers
public/                   Browser UI
tests/                    Automated tests
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Add or update provider metadata in `lib/providerRegistry.js`.
4. Add tests for every new provider pattern or validation path.
5. Run `npm test`.
6. Open a pull request with the provider, validation method, and safety notes.

Provider contributions should include:

- Company name
- Supported key types
- Detection pattern
- Safe validation endpoint, when possible
- Context requirements, when validation requires more than one value
- Test sample that does not contain a real secret

## Disclaimer and Responsible Usage

Use KeyHacks only on assets and credentials that you are authorized to test.

Do not use this tool to access accounts, data, systems, or services without explicit permission. Do not run high-volume prompts, send messages, create resources, mutate data, or intentionally incur costs unless the bug bounty program or assessment scope clearly allows it.

Treat exposed credentials as compromised. Reports should include masked evidence only. Never include full live secrets in screenshots, tickets, pull requests, commits, or public issues.

## References

- [Upstream KeyHacks provider list](https://github.com/streaak/keyhacks/blob/master/README.md)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub secret scanning remediation](https://docs.github.com/en/code-security/secret-scanning/managing-alerts-from-secret-scanning/resolving-alerts)
