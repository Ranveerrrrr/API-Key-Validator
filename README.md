# API Key Validator

API Key Validator is a local web application for safely identifying and validating exposed API credentials during authorized security testing and bug bounty work.

The app accepts a pasted key or credential snippet, identifies the provider, and attempts provider-specific detection and validation across supported companies. For AI providers, it lists available chat-capable models and lets you test approved prompts against a selected model. For all supported providers, it can generate a professional bug bounty report with neutral reporter fields, impact language, remediation guidance, and export options.

## Features

- Auto-detects provider from a single pasted key or credential snippet.
- Supports every company listed in the Supported Providers section below.
- Lists available models/checks with consistent green/red status indicators.
- Supports chat for validated AI model providers.
- Keeps chat history per provider, model, and hashed key across model switches, refreshes, and server restarts without storing the raw key.
- Generates bug bounty reports with copy, Markdown export, HTML export, and PDF export.
- Runs as a dependency-free Node.js app.

## Preview

<img width="1919" height="956" alt="image" src="https://github.com/user-attachments/assets/99c22c01-b893-47a5-86de-5d4541333815" />


<img width="1919" height="958" alt="image" src="https://github.com/user-attachments/assets/328444e7-3113-43ae-b945-ef77ae81e3af" />


<img width="1134" height="774" alt="image" src="https://github.com/user-attachments/assets/6568da4d-92f8-4bd7-8587-e07c070900c9" />




https://github.com/user-attachments/assets/7457353e-275e-42b9-ae9d-1c47d1c5dbb7



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

## Repository File Map

```text
README.md                      Project documentation, usage, provider list, and credits.
package.json                   Node scripts and project metadata.
server.js                      HTTP server, API routes, AI provider model checks, and chat proxy.
lib/providerRegistry.js        Provider/key-pattern dataset, detection helpers, and validation request builders.
public/index.html              Main dashboard markup.
public/styles.css              Dashboard styling and responsive layout.
public/app.js                  Browser UI logic, report generator, exports, and provider/model state.
public/chat-store.js           Per-provider/model chat history persistence using hashed key IDs.
tests/providerRegistry.test.js Provider detection and validation helper tests.
tests/chatStore.test.js        Chat persistence tests.
start.sh                       Portable Linux start script for background deployment.
stop.sh                        Portable Linux stop script for background deployment.
docs/screenshots/.gitkeep      Empty folder marker for screenshots you add later.
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

### Supported Company Index (80 Companies)

- AB Tasty
- Algolia
- Amazon Web Services
- Amplitude
- Anthropic
- Asana
- Azure Application Insights
- Bazaarvoice
- Bing Maps
- Bitly
- Branch.io
- BrowserStack
- Buildkite
- ButterCMS
- Calendly
- CircleCI
- Cloudflare
- Contentful
- Cypress
- Datadog
- DeepSeek
- Delighted
- DeviantArt
- Discord
- Dropbox
- Facebook / Meta
- Freshdesk
- GitHub
- GitLab
- Google
- Groq
- Grafana
- Help Scout
- Heroku
- HubSpot
- Infura
- Instagram
- Ipstack
- Iterable
- JumpCloud
- Keen.io
- LinkedIn
- Lokalise
- Loqate
- Mailchimp
- Mailgun
- Mapbox
- Microsoft Azure
- Microsoft Teams
- New Relic
- npm
- OpenAI
- OpenRouter
- Opsgenie
- PagerDuty
- PayPal
- Pendo
- Pivotal Tracker
- Razorpay
- Salesforce
- Sauce Labs
- SendGrid
- Shodan
- Slack
- SonarCloud
- Spotify
- Square
- Stripe
- Supabase
- Telegram
- Travis CI
- Twilio
- Twitter / X
- Visual Studio App Center
- WakaTime
- Weglot
- WP Engine
- YouTube
- Zapier
- Zendesk

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

### Discord

- Discord Bot Token
- Discord Webhook URL

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

### Groq

- Groq API Key

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

### OpenRouter

- OpenRouter API Key

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

### Supabase

- Supabase Anon Key
- Supabase Service Role Key
- Supabase Secret Key
- Supabase Publishable Key

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
- Grok API Key
- xAI API Key

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

Some credentials require extra context such as a tenant ID, application ID, account domain, username, project ID, or matching secret. API Key Validator detects those formats and reports the missing context instead of guessing or running unsafe requests.

Provider checks are intentionally low-impact. Avoid endpoints that send messages, mutate data, create resources, or consume significant paid quota unless the program explicitly authorizes that testing.

## Development

```bash
npm test
HOST=127.0.0.1 PORT=8099 npm start
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

Use API Key Validator only on assets and credentials that you are authorized to test.

Do not use this tool to access accounts, data, systems, or services without explicit permission. Do not run high-volume prompts, send messages, create resources, mutate data, or intentionally incur costs unless the bug bounty program or assessment scope clearly allows it.

Treat exposed credentials as compromised. Reports should include masked evidence only. Never include full live secrets in screenshots, tickets, pull requests, commits, or public issues.

## Credits

- KeyHacks by streaak is credited as the provider/key-format data and research baseline used to map how many API keys look and how they can be checked.
- Additional provider patterns, validation behavior, and report workflow were added through API Key Validator research.
- UI inspiration credit: [coffinxp](https://github.com/coffinxp). The dashboard style was inspired by a video/UI workflow from coffinxp.

## References

- [KeyHacks provider list](https://github.com/streaak/keyhacks/blob/master/README.md)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub secret scanning remediation](https://docs.github.com/en/code-security/secret-scanning/managing-alerts-from-secret-scanning/resolving-alerts)
