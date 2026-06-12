const DEFAULT_TIMEOUT_MS = 9000;

const PROVIDER_SPECS = [
  {
    id: "anthropic",
    company: "Anthropic",
    keyTypes: ["Claude API Key", "Anthropic Admin API Key", "Anthropic Workspace Key"],
    patterns: [/sk-ant-[A-Za-z0-9_-]{20,}/],
    sample: "sk-ant-api03-testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "header", url: "https://api.anthropic.com/v1/models", header: "x-api-key", extraHeaders: { "anthropic-version": "2023-06-01" } }
  },
  {
    id: "openai",
    company: "OpenAI",
    keyTypes: ["OpenAI API Key", "OpenAI Project Key", "OpenAI Service Account Key"],
    patterns: [/\bsk-(?!or-v1-)(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}/],
    sample: "sk-proj-testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.openai.com/v1/models" }
  },
  {
    id: "openrouter",
    company: "OpenRouter",
    keyTypes: ["OpenRouter API Key"],
    patterns: [/\bsk-or-v1-[A-Za-z0-9_-]{20,}\b/, /openrouter[_-]?(?:api[_-]?)?key[:=\s]+sk-or-v1-[A-Za-z0-9_-]{20,}/i],
    sample: "sk-or-v1-testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "bearer", url: "https://openrouter.ai/api/v1/models" }
  },
  {
    id: "deepseek",
    company: "DeepSeek",
    keyTypes: ["DeepSeek API Key"],
    patterns: [/\b(?:ds-[A-Za-z0-9_-]{20,}|deepseek[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{20,})/i],
    sample: "deepseek_api_key=ds-testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.deepseek.com/models" }
  },
  {
    id: "groq",
    company: "Groq",
    keyTypes: ["Groq API Key"],
    patterns: [/\bgsk_[A-Za-z0-9_-]{20,}\b/, /groq[_-]?(?:api[_-]?)?key[:=\s]+gsk_[A-Za-z0-9_-]{20,}/i],
    sample: "gsk_testtoken1234567890abcdefghi",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.groq.com/openai/v1/models" }
  },
  {
    id: "xai",
    company: "Twitter / X",
    keyTypes: ["Grok API Key", "xAI API Key"],
    patterns: [/\bxai-[A-Za-z0-9_-]{20,}\b/, /(?:grok|xai)[_-]?(?:api[_-]?)?key[:=\s]+xai-[A-Za-z0-9_-]{20,}/i],
    sample: "xai-testtoken1234567890abcdefghi",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.x.ai/v1/models" }
  },
  {
    id: "google",
    company: "Google",
    keyTypes: ["Gemini API Key", "Vertex AI Key", "Google Maps API Key", "Google Cloud API Key", "Google Cloud Service Account Credentials", "Google reCAPTCHA Key", "Firebase API Key", "Firebase Cloud Messaging Key", "YouTube API Key"],
    patterns: [/\bAIza[0-9A-Za-z_-]{25,}\b/, /"type"\s*:\s*"service_account"/, /-----BEGIN PRIVATE KEY-----[\s\S]+?client_email/i, /\b6[0-9A-Za-z_-]{39}\b/, /\bAAAA[A-Za-z0-9_-]{7,}:[A-Za-z0-9_-]{20,}/],
    sample: "AIzaSyA-testtoken1234567890abcdefghi",
    highConfidence: true,
    validation: { type: "query", url: "https://generativelanguage.googleapis.com/v1beta/models?key={token}" }
  },
  {
    id: "aws",
    company: "Amazon Web Services",
    keyTypes: ["AWS Access Key ID", "AWS Secret Access Key", "AWS Session Token"],
    patterns: [/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/, /aws_secret_access_key/i],
    sample: "AKIAIOSFODNN7EXAMPLE",
    highConfidence: true,
    requiresContext: "AWS validation requires a matching secret access key and SigV4 request signing."
  },
  {
    id: "abtasty",
    company: "AB Tasty",
    keyTypes: ["AB Tasty API Key"],
    patterns: [/abtasty[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "abtasty_api_key=abtasty_testtoken1234567890",
    validation: { type: "header", url: "https://api.abtasty.com/api/v1/accounts", header: "x-api-key" }
  },
  {
    id: "algolia",
    company: "Algolia",
    keyTypes: ["Algolia API Key", "Algolia Application ID"],
    patterns: [/algolia[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9]{20,}/i, /x-algolia-api-key/i],
    sample: "algolia_api_key=algoliatesttoken1234567890",
    requiresContext: "Algolia validation requires the application ID and sometimes an index name."
  },
  {
    id: "amplitude",
    company: "Amplitude",
    keyTypes: ["Amplitude API Key", "Amplitude Secret Key"],
    patterns: [/amplitude[_-]?(?:api[_-]?)?key[:=\s]+[A-Fa-f0-9]{20,}/i],
    sample: "amplitude_api_key=0123456789abcdef0123456789abcdef",
    requiresContext: "Amplitude export validation requires the matching secret key."
  },
  {
    id: "asana",
    company: "Asana",
    keyTypes: ["Asana Access Token"],
    patterns: [/asana[_-]?(?:access[_-]?)?token[:=\s]+[A-Za-z0-9/_-]{20,}/i],
    sample: "asana_access_token=asana-testtoken1234567890",
    validation: { type: "bearer", url: "https://app.asana.com/api/1.0/users/me" }
  },
  {
    id: "azure-application-insights",
    company: "Azure Application Insights",
    keyTypes: ["Application Insights App ID", "Application Insights API Key"],
    patterns: [/application[_-\s]?insights[\s\S]{0,80}(?:app[_-\s]?id|api[_-\s]?key)/i],
    sample: "application_insights_app_id=00000000-0000-0000-0000-000000000000 application_insights_api_key=testtoken",
    requiresContext: "Application Insights validation requires both app ID and API key."
  },
  {
    id: "bazaarvoice",
    company: "Bazaarvoice",
    keyTypes: ["Bazaarvoice Passkey"],
    patterns: [/bazaarvoice[_-]?passkey[:=\s]+[A-Za-z0-9_-]{8,}/i],
    sample: "bazaarvoice_passkey=bazaarvoice123",
    requiresContext: "Bazaarvoice validation depends on the target environment and client."
  },
  {
    id: "bing-maps",
    company: "Bing Maps",
    keyTypes: ["Bing Maps API Key"],
    patterns: [/bing[_-\s]?maps[\s\S]{0,40}key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "bing_maps_key=bingmapstesttoken1234567890",
    validation: { type: "query", url: "https://dev.virtualearth.net/REST/v1/Locations?CountryRegion=US&locality=Seattle&key={token}" }
  },
  {
    id: "bitly",
    company: "Bitly",
    keyTypes: ["Bitly Access Token"],
    patterns: [/bitly[_-]?(?:access[_-]?)?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "bitly_access_token=bitlytesttoken1234567890",
    validation: { type: "bearer", url: "https://api-ssl.bitly.com/v4/user" }
  },
  {
    id: "branch",
    company: "Branch.io",
    keyTypes: ["Branch.io Key", "Branch.io Secret"],
    patterns: [/branch[_-]?(?:key|secret)[:=\s]+(?:key|secret)_[A-Za-z0-9]{10,}/i],
    sample: "branch_key=key_testtoken123 branch_secret=secret_testtoken123",
    requiresContext: "Branch validation requires both the Branch key and matching secret."
  },
  {
    id: "browserstack",
    company: "BrowserStack",
    keyTypes: ["BrowserStack Username", "BrowserStack Access Key"],
    patterns: [/browserstack[\s\S]{0,80}access[_-\s]?key[:=\s]+[A-Za-z0-9_-]{10,}/i],
    sample: "browserstack_access_key=browserstacktesttoken",
    requiresContext: "BrowserStack validation requires the username and access key pair."
  },
  {
    id: "buildkite",
    company: "Buildkite",
    keyTypes: ["Buildkite Access Token"],
    patterns: [/buildkite[_-]?(?:access[_-]?)?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "buildkite_access_token=bk_testtoken1234567890",
    validation: { type: "bearer", url: "https://api.buildkite.com/v2/access-token" }
  },
  {
    id: "buttercms",
    company: "ButterCMS",
    keyTypes: ["ButterCMS API Key"],
    patterns: [/buttercms[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "buttercms_api_key=buttercmstesttoken1234567890",
    validation: { type: "query", url: "https://api.buttercms.com/v2/posts/?auth_token={token}" }
  },
  {
    id: "calendly",
    company: "Calendly",
    keyTypes: ["Calendly API Key", "Calendly Personal Access Token"],
    patterns: [/calendly[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9._-]{20,}/i],
    sample: "calendly_api_key=calendlytesttoken1234567890",
    validation: { type: "bearer", url: "https://api.calendly.com/users/me" }
  },
  {
    id: "circleci",
    company: "CircleCI",
    keyTypes: ["CircleCI Access Token"],
    patterns: [/circleci[_-]?(?:access[_-]?)?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "circleci_access_token=circlecitesttoken1234567890",
    validation: { type: "header", url: "https://circleci.com/api/v2/me", header: "Circle-Token" }
  },
  {
    id: "cloudflare",
    company: "Cloudflare",
    keyTypes: ["Cloudflare API Token", "Cloudflare Global API Key"],
    patterns: [/cloudflare[\s\S]{0,40}(?:api[_-\s]?token|api[_-\s]?key)[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "cloudflare_api_token=cloudflaretesttoken1234567890",
    validation: { type: "bearer", url: "https://api.cloudflare.com/client/v4/user/tokens/verify" }
  },
  {
    id: "contentful",
    company: "Contentful",
    keyTypes: ["Contentful Access Token"],
    patterns: [/contentful[_-]?(?:access[_-]?)?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "contentful_access_token=contentfultesttoken1234567890",
    requiresContext: "Contentful validation requires the space ID."
  },
  {
    id: "cypress",
    company: "Cypress",
    keyTypes: ["Cypress Record Key"],
    patterns: [/cypress[_-]?record[_-]?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "cypress_record_key=cypresstesttoken1234567890",
    requiresContext: "Cypress record key validation requires a project context."
  },
  {
    id: "datadog",
    company: "Datadog",
    keyTypes: ["Datadog API Key", "Datadog Application Key"],
    patterns: [/datadog[\s\S]{0,60}(?:api[_-\s]?key|application[_-\s]?key)[:=\s]+[A-Fa-f0-9]{32}/i],
    sample: "datadog_api_key=0123456789abcdef0123456789abcdef",
    requiresContext: "Datadog validation requires both API and application keys for most useful endpoints."
  },
  {
    id: "delighted",
    company: "Delighted",
    keyTypes: ["Delighted API Key"],
    patterns: [/delighted[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "delighted_api_key=delightedtesttoken1234567890",
    validation: { type: "basic-password", url: "https://api.delighted.com/v1/metrics.json" }
  },
  {
    id: "deviantart",
    company: "DeviantArt",
    keyTypes: ["DeviantArt Access Token", "DeviantArt Client Secret"],
    patterns: [/deviantart[\s\S]{0,60}(?:access[_-\s]?token|secret)[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "deviantart_access_token=deviantarttesttoken1234567890",
    validation: { type: "query", url: "https://www.deviantart.com/api/v1/oauth2/placebo?access_token={token}" }
  },
  {
    id: "discord",
    company: "Discord",
    keyTypes: ["Discord Bot Token", "Discord Webhook URL"],
    patterns: [/\b(?:mfa\.[A-Za-z0-9_-]{20,}|[MN][A-Za-z\d_-]{23,}\.[A-Za-z\d_-]{6,}\.[A-Za-z\d_-]{20,})\b/, /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/i, /discord[_-]?(?:bot[_-]?)?token[:=\s]+[A-Za-z0-9._-]{40,}/i],
    sample: "discord_bot_token=MTIzNDU2Nzg5MDEyMzQ1Njc4.test12.testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "discord", url: "https://discord.com/api/v10/users/@me" }
  },
  {
    id: "dropbox",
    company: "Dropbox",
    keyTypes: ["Dropbox API Token", "Dropbox OAuth Token"],
    patterns: [/sl\.[A-Za-z0-9_-]{20,}/, /dropbox[_-]?(?:api[_-]?)?token[:=\s]+[A-Za-z0-9._-]{20,}/i],
    sample: "sl.testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.dropboxapi.com/2/users/get_current_account", method: "POST" }
  },
  {
    id: "facebook",
    company: "Facebook / Meta",
    keyTypes: ["Facebook Access Token", "Facebook App Secret"],
    patterns: [/\bEAA[A-Za-z0-9]{20,}/, /facebook[\s\S]{0,40}app[_-\s]?secret[:=\s]+[A-Fa-f0-9]{32}/i],
    sample: "EAAFbTestToken1234567890abcdef",
    validation: { type: "query", url: "https://graph.facebook.com/debug_token?input_token={token}&access_token={token}" }
  },
  {
    id: "freshdesk",
    company: "Freshdesk",
    keyTypes: ["Freshdesk API Key"],
    patterns: [/freshdesk[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "freshdesk_api_key=freshdesktesttoken1234567890",
    requiresContext: "Freshdesk validation requires the target subdomain and usually an account email."
  },
  {
    id: "github",
    company: "GitHub",
    keyTypes: ["GitHub Token", "GitHub OAuth Client ID", "GitHub OAuth Client Secret", "GitHub Private SSH Key"],
    patterns: [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}/, /\bgithub_pat_[A-Za-z0-9_]{20,}/, /-----BEGIN OPENSSH PRIVATE KEY-----/],
    sample: "ghp_testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.github.com/user" }
  },
  {
    id: "gitlab",
    company: "GitLab",
    keyTypes: ["GitLab Personal Access Token", "GitLab Runner Registration Token"],
    patterns: [/\bglpat-[A-Za-z0-9_-]{20,}/, /\bGR1348941[A-Za-z0-9_-]{20,}/, /gitlab[_-]?runner[_-]?registration[_-]?token[:=\s]+[A-Za-z0-9_-]{10,}/i],
    sample: "glpat-testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "bearer", url: "https://gitlab.com/api/v4/user" }
  },
  {
    id: "grafana",
    company: "Grafana",
    keyTypes: ["Grafana Access Token"],
    patterns: [/glsa_[A-Za-z0-9_]{20,}/, /grafana[_-]?(?:access[_-]?)?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "glsa_testtoken1234567890abcdef",
    highConfidence: true,
    requiresContext: "Grafana validation requires the Grafana instance URL."
  },
  {
    id: "helpscout",
    company: "Help Scout",
    keyTypes: ["Help Scout OAuth Token"],
    patterns: [/helpscout[\s\S]{0,40}(?:oauth|token)[:=\s]+[A-Za-z0-9._-]{20,}/i],
    sample: "helpscout_oauth=helpscouttesttoken1234567890",
    validation: { type: "bearer", url: "https://api.helpscout.net/v2/users/me" }
  },
  {
    id: "heroku",
    company: "Heroku",
    keyTypes: ["Heroku API Key"],
    patterns: [/heroku[_-]?(?:api[_-]?)?key[:=\s]+[A-Fa-f0-9-]{32,}/i],
    sample: "heroku_api_key=01234567-89ab-cdef-0123-456789abcdef",
    validation: { type: "bearer", url: "https://api.heroku.com/account", extraHeaders: { Accept: "application/vnd.heroku+json; version=3" } }
  },
  {
    id: "hubspot",
    company: "HubSpot",
    keyTypes: ["HubSpot API Key", "HubSpot Private App Token"],
    patterns: [/pat-[A-Za-z0-9_-]{20,}/, /hubspot[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "pat-hubspottesttoken1234567890",
    validation: { type: "bearer", url: "https://api.hubapi.com/oauth/v1/access-tokens/{token}" }
  },
  {
    id: "infura",
    company: "Infura",
    keyTypes: ["Infura API Key", "Infura Project ID"],
    patterns: [/infura[_-]?(?:api[_-]?)?key[:=\s]+[A-Fa-f0-9]{32}/i],
    sample: "infura_api_key=0123456789abcdef0123456789abcdef",
    validation: { type: "json-rpc", url: "https://mainnet.infura.io/v3/{token}", body: { jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 } }
  },
  {
    id: "instagram",
    company: "Instagram",
    keyTypes: ["Instagram Access Token", "Instagram Basic Display API Access Token", "Instagram Graph API Access Token"],
    patterns: [/\bIGQVJ[A-Za-z0-9_-]{20,}/, /\bEAAJ[A-Za-z0-9]{20,}/],
    sample: "IGQVJtesttoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "query", url: "https://graph.instagram.com/me?fields=id,username&access_token={token}" }
  },
  {
    id: "ipstack",
    company: "Ipstack",
    keyTypes: ["Ipstack API Key"],
    patterns: [/ipstack[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "ipstack_api_key=ipstacktesttoken1234567890",
    validation: { type: "query", url: "http://api.ipstack.com/check?access_key={token}" }
  },
  {
    id: "iterable",
    company: "Iterable",
    keyTypes: ["Iterable API Key"],
    patterns: [/iterable[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "iterable_api_key=iterabletesttoken1234567890",
    validation: { type: "header", url: "https://api.iterable.com/api/channels", header: "Api-Key" }
  },
  {
    id: "jumpcloud",
    company: "JumpCloud",
    keyTypes: ["JumpCloud API Key"],
    patterns: [/jumpcloud[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "jumpcloud_api_key=jumpcloudtesttoken1234567890",
    validation: { type: "header", url: "https://console.jumpcloud.com/api/systemusers", header: "x-api-key" }
  },
  {
    id: "keen",
    company: "Keen.io",
    keyTypes: ["Keen.io API Key", "Keen.io Project ID"],
    patterns: [/keen(?:\.io)?[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "keen_api_key=keentesttoken1234567890",
    requiresContext: "Keen.io validation requires the project ID and key type."
  },
  {
    id: "linkedin",
    company: "LinkedIn",
    keyTypes: ["LinkedIn OAuth Token", "LinkedIn Client Credentials"],
    patterns: [/linkedin[\s\S]{0,40}(?:oauth|token|client_secret)[:=\s]+[A-Za-z0-9._-]{16,}/i],
    sample: "linkedin_oauth=linkedintesttoken1234567890",
    validation: { type: "bearer", url: "https://api.linkedin.com/v2/me" }
  },
  {
    id: "lokalise",
    company: "Lokalise",
    keyTypes: ["Lokalise API Key"],
    patterns: [/lokalise[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "lokalise_api_key=lokalisetesttoken1234567890",
    validation: { type: "header", url: "https://api.lokalise.com/api2/projects/", header: "x-api-token" }
  },
  {
    id: "loqate",
    company: "Loqate",
    keyTypes: ["Loqate API Key"],
    patterns: [/loqate[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "loqate_api_key=loqatetesttoken1234567890",
    validation: { type: "query", url: "https://api.addressy.com/Capture/Interactive/Find/v1.1/json3.ws?Key={token}&Text=test" }
  },
  {
    id: "mailchimp",
    company: "Mailchimp",
    keyTypes: ["Mailchimp API Key"],
    patterns: [/[A-Fa-f0-9]{32}-us\d{1,2}/, /mailchimp[_-]?(?:api[_-]?)?key[:=\s]+[A-Fa-f0-9]{32}-us\d{1,2}/i],
    sample: "0123456789abcdef" + "0123456789abcdef-us1",
    highConfidence: true,
    validation: { type: "mailchimp" }
  },
  {
    id: "mailgun",
    company: "Mailgun",
    keyTypes: ["Mailgun Private Key"],
    patterns: [/key-[A-Za-z0-9]{20,}/, /mailgun[\s\S]{0,40}(?:private[_-\s]?key|api[_-\s]?key)[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "key-0123456789abcdef0123456789abcdef",
    validation: { type: "basic-api", url: "https://api.mailgun.net/v3/domains" }
  },
  {
    id: "mapbox",
    company: "Mapbox",
    keyTypes: ["Mapbox Public Token", "Mapbox Secret Token", "Mapbox Temporary Token"],
    patterns: [/\b(?:pk|sk|tk)\.[A-Za-z0-9._-]{20,}/],
    sample: "pk.testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "query", url: "https://api.mapbox.com/tokens/v2?access_token={token}" }
  },
  {
    id: "microsoft-azure",
    company: "Microsoft Azure",
    keyTypes: ["Azure Tenant ID", "Azure Client ID", "Azure Client Secret", "Azure Shared Access Signature"],
    patterns: [/tenant[_-\s]?id[:=\s]+[0-9a-f-]{36}[\s\S]{0,120}client[_-\s]?secret/i, /\bsv=\d{4}-\d{2}-\d{2}[\s\S]+&sig=/i],
    sample: "tenant_id=00000000-0000-0000-0000-000000000000 client_secret=azuretestsecret",
    requiresContext: "Azure validation requires the tenant ID, client ID, and client secret or a target SAS URL."
  },
  {
    id: "microsoft-teams",
    company: "Microsoft Teams",
    keyTypes: ["Microsoft Teams Webhook"],
    patterns: [/https:\/\/[A-Za-z0-9.-]+\.webhook\.office\.com\/webhookb2\/[A-Za-z0-9@._-]+\/IncomingWebhook\/[A-Za-z0-9._-]+\/[A-Za-z0-9-]+/i],
    sample: "https://example.webhook.office.com/webhookb2/id/IncomingWebhook/token/group",
    highConfidence: true,
    validation: { type: "webhook-json", urlFromToken: true, body: { text: "" }, validText: "Summary or Text is required" }
  },
  {
    id: "newrelic",
    company: "New Relic",
    keyTypes: ["New Relic Personal API Key", "New Relic NerdGraph API Key", "New Relic REST API Key"],
    patterns: [/\b(?:NRAK|NRII|NRRA)-[A-Za-z0-9]{20,}/, /newrelic[\s\S]{0,40}(?:api[_-\s]?key|personal[_-\s]?api[_-\s]?key)[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "NRAK-testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "header", url: "https://api.newrelic.com/graphql", method: "POST", header: "API-Key", body: { query: "{ requestContext { userId apiKey } }" } }
  },
  {
    id: "npm",
    company: "npm",
    keyTypes: ["npm Token"],
    patterns: [/\bnpm_[A-Za-z0-9]{20,}/, /npm[_-]?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "npm_testtoken1234567890abcdef",
    highConfidence: true,
    validation: { type: "bearer", url: "https://registry.npmjs.org/-/whoami" }
  },
  {
    id: "opsgenie",
    company: "Opsgenie",
    keyTypes: ["Opsgenie API Key"],
    patterns: [/opsgenie[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9-]{20,}/i],
    sample: "opsgenie_api_key=opsgenie-testtoken1234567890",
    validation: { type: "geniekey", url: "https://api.opsgenie.com/v2/account" }
  },
  {
    id: "pagerduty",
    company: "PagerDuty",
    keyTypes: ["PagerDuty API Token"],
    patterns: [/pagerduty[_-]?(?:api[_-]?)?token[:=\s]+[A-Za-z0-9_+.-]{20,}/i],
    sample: "pagerduty_api_token=pagerdutytesttoken1234567890",
    validation: { type: "token-token", url: "https://api.pagerduty.com/users/me", extraHeaders: { Accept: "application/vnd.pagerduty+json;version=2" } }
  },
  {
    id: "paypal",
    company: "PayPal",
    keyTypes: ["PayPal Client ID", "PayPal Secret Key"],
    patterns: [/paypal[\s\S]{0,80}(?:client[_-\s]?id|secret)[:=\s]+[A-Za-z0-9._-]{20,}/i],
    sample: "paypal_client_id=paypalclient1234567890 paypal_secret=paypalsecret1234567890",
    requiresContext: "PayPal validation requires the client ID and secret pair."
  },
  {
    id: "pendo",
    company: "Pendo",
    keyTypes: ["Pendo Integration Key"],
    patterns: [/pendo[_-]?integration[_-]?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "pendo_integration_key=pendotesttoken1234567890",
    validation: { type: "header", url: "https://app.pendo.io/api/v1/metadata/schema/account", header: "x-pendo-integration-key" }
  },
  {
    id: "pivotal-tracker",
    company: "Pivotal Tracker",
    keyTypes: ["Pivotal Tracker API Token"],
    patterns: [/pivotal(?:tracker)?[_-]?(?:api[_-]?)?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "pivotaltracker_api_token=pivotaltesttoken1234567890",
    validation: { type: "header", url: "https://www.pivotaltracker.com/services/v5/me", header: "X-TrackerToken" }
  },
  {
    id: "razorpay",
    company: "Razorpay",
    keyTypes: ["Razorpay API Key", "Razorpay Secret Key"],
    patterns: [/\brzp_(?:live|test)_[A-Za-z0-9]{14,}/],
    sample: "rzp_live_testtoken1234567890",
    highConfidence: true,
    requiresContext: "Razorpay validation requires the key ID and secret key pair."
  },
  {
    id: "salesforce",
    company: "Salesforce",
    keyTypes: ["Salesforce API Key", "Salesforce Access Token"],
    patterns: [/salesforce[\s\S]{0,40}(?:api[_-\s]?key|access[_-\s]?token)[:=\s]+[A-Za-z0-9.!_-]{20,}/i],
    sample: "salesforce_access_token=salesforcetesttoken1234567890",
    requiresContext: "Salesforce validation requires the target instance URL."
  },
  {
    id: "saucelabs",
    company: "Sauce Labs",
    keyTypes: ["Sauce Labs Username", "Sauce Labs Access Key"],
    patterns: [/saucelabs[\s\S]{0,80}access[_-\s]?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "saucelabs_access_key=saucelabstesttoken1234567890",
    requiresContext: "Sauce Labs validation requires username and access key."
  },
  {
    id: "sendgrid",
    company: "SendGrid",
    keyTypes: ["SendGrid API Token"],
    patterns: [/\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/],
    sample: "SG.testtoken1234567890.testtoken1234567890",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.sendgrid.com/v3/scopes" }
  },
  {
    id: "shodan",
    company: "Shodan",
    keyTypes: ["Shodan API Key"],
    patterns: [/shodan[_-]?(?:api[_-]?)?key[:=\s]+[A-Fa-f0-9]{32}/i],
    sample: "shodan_api_key=0123456789abcdef0123456789abcdef",
    validation: { type: "query", url: "https://api.shodan.io/api-info?key={token}" }
  },
  {
    id: "slack",
    company: "Slack",
    keyTypes: ["Slack API Token", "Slack Webhook"],
    patterns: [/\bxox[baprs]-[A-Za-z0-9-]{10,}/, /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/],
    sample: "xoxb-testtoken-testtoken-testtoken",
    highConfidence: true,
    validation: { type: "slack" }
  },
  {
    id: "sonarcloud",
    company: "SonarCloud",
    keyTypes: ["SonarCloud Token"],
    patterns: [/sonarcloud[_-]?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "sonarcloud_token=sonarcloudtesttoken1234567890",
    validation: { type: "basic-user", url: "https://sonarcloud.io/api/authentication/validate" }
  },
  {
    id: "spotify",
    company: "Spotify",
    keyTypes: ["Spotify Access Token"],
    patterns: [/spotify[_-]?(?:access[_-]?)?token[:=\s]+[A-Za-z0-9._-]{20,}/i],
    sample: "spotify_access_token=spotifytesttoken1234567890",
    validation: { type: "bearer", url: "https://api.spotify.com/v1/me" }
  },
  {
    id: "square",
    company: "Square",
    keyTypes: ["Square App ID", "Square Client Secret", "Square Auth Token"],
    patterns: [/\bsq0[a-z]{3}-[0-9A-Za-z_-]{22,43}\b/, /\bEAAA[A-Za-z0-9]{40,}/],
    sample: "sq0idp-0123456789abcdefghijklmnop",
    highConfidence: true,
    validation: { type: "bearer", url: "https://connect.squareup.com/v2/locations" }
  },
  {
    id: "stripe",
    company: "Stripe",
    keyTypes: ["Stripe Live Secret Key", "Stripe Restricted Key", "Stripe Publishable Key"],
    patterns: [/\b(?:sk|rk|pk)_live_[A-Za-z0-9]{20,}/],
    sample: "sk_" + "live_" + "syntheticTokenValue000000",
    highConfidence: true,
    validation: { type: "bearer", url: "https://api.stripe.com/v1/account" }
  },
  {
    id: "supabase",
    company: "Supabase",
    keyTypes: ["Supabase Anon Key", "Supabase Service Role Key", "Supabase Secret Key", "Supabase Publishable Key"],
    patterns: [/\bsb_secret_[A-Za-z0-9_-]{20,}\b/, /\bsb_publishable_[A-Za-z0-9_-]{20,}\b/, /supabase[\s\S]{0,80}(?:anon|service[_-\s]?role|secret|publishable)[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9._-]{20,}/i],
    sample: "supabase_secret_key=sb_secret_testtoken1234567890abcdef",
    highConfidence: true,
    requiresContext: "Supabase JWT anon/service-role validation requires the project URL. New sb_secret/sb_publishable key formats can be detected safely by format."
  },
  {
    id: "telegram",
    company: "Telegram",
    keyTypes: ["Telegram Bot API Token"],
    patterns: [/\b\d{6,12}:[A-Za-z0-9_-]{30,}\b/],
    sample: "123456789:AAEtesttoken1234567890abcdefghi",
    highConfidence: true,
    validation: { type: "telegram" }
  },
  {
    id: "travis-ci",
    company: "Travis CI",
    keyTypes: ["Travis CI API Token"],
    patterns: [/travis[_-]?ci[_-]?(?:api[_-]?)?token[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "travis_ci_api_token=travistesttoken1234567890",
    validation: { type: "token", url: "https://api.travis-ci.org/repos", extraHeaders: { "Travis-API-Version": "3" } }
  },
  {
    id: "twilio",
    company: "Twilio",
    keyTypes: ["Twilio Account SID", "Twilio Auth Token"],
    patterns: [/\bAC[a-fA-F0-9]{32}\b/, /twilio[\s\S]{0,80}auth[_-\s]?token[:=\s]+[A-Fa-f0-9]{32}/i],
    sample: "AC" + "0123456789abcdef" + "0123456789abcdef",
    highConfidence: true,
    requiresContext: "Twilio validation requires the Account SID and matching auth token."
  },
  {
    id: "twitter",
    company: "Twitter / X",
    keyTypes: ["Twitter API Secret", "Twitter Bearer Token"],
    patterns: [/\bAAAA[A-Za-z0-9%_-]{20,}/, /twitter[\s\S]{0,40}(?:bearer|api[_-\s]?secret)[:=\s]+[A-Za-z0-9%._-]{20,}/i],
    sample: "twitter_bearer=AAAAAAAAAAAAAAAAAAAAAtesttoken1234567890",
    validation: { type: "bearer", url: "https://api.twitter.com/2/users/me" }
  },
  {
    id: "visual-studio-app-center",
    company: "Visual Studio App Center",
    keyTypes: ["Visual Studio App Center API Token"],
    patterns: [/appcenter[\s\S]{0,40}(?:api[_-\s]?token|token)[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "appcenter_api_token=appcentertesttoken1234567890",
    validation: { type: "header", url: "https://api.appcenter.ms/v0.1/user", header: "X-API-Token" }
  },
  {
    id: "wakatime",
    company: "WakaTime",
    keyTypes: ["WakaTime API Key"],
    patterns: [/waka_[A-Za-z0-9_-]{20,}/, /wakatime[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{20,}/i],
    sample: "waka_testtoken1234567890abcdef",
    validation: { type: "query", url: "https://wakatime.com/api/v1/users/current?api_key={token}" }
  },
  {
    id: "weglot",
    company: "Weglot",
    keyTypes: ["Weglot API Key"],
    patterns: [/weglot[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "weglot_api_key=weglottesttoken1234567890",
    requiresContext: "Weglot validation depends on project configuration."
  },
  {
    id: "wpengine",
    company: "WP Engine",
    keyTypes: ["WP Engine API Key"],
    patterns: [/wpengine[_-]?(?:api[_-]?)?key[:=\s]+[A-Za-z0-9_-]{16,}/i],
    sample: "wpengine_api_key=wpenginetesttoken1234567890",
    requiresContext: "WP Engine validation requires the target account name."
  },
  {
    id: "youtube",
    company: "YouTube",
    keyTypes: ["YouTube API Key"],
    patterns: [/youtube[_-]?(?:api[_-]?)?key[:=\s]+AIza[0-9A-Za-z_-]{25,}/i],
    sample: "youtube_api_key=AIzaSyA-testtoken1234567890abcdefghi",
    validation: { type: "query", url: "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&key={token}" }
  },
  {
    id: "zapier",
    company: "Zapier",
    keyTypes: ["Zapier Webhook Token", "Zapier Webhook URL"],
    patterns: [/https:\/\/hooks\.zapier\.com\/hooks\/catch\/[A-Za-z0-9/_-]+/i],
    sample: "https://hooks.zapier.com/hooks/catch/123456/testtoken",
    highConfidence: true,
    validation: { type: "webhook-json", urlFromToken: true, body: { name: "api-key-validator-validation" } }
  },
  {
    id: "zendesk",
    company: "Zendesk",
    keyTypes: ["Zendesk Access Token", "Zendesk API Key"],
    patterns: [/zendesk[\s\S]{0,40}(?:access[_-\s]?token|api[_-\s]?key)[:=\s]+[A-Za-z0-9._-]{20,}/i],
    sample: "zendesk_access_token=zendesktesttoken1234567890",
    requiresContext: "Zendesk validation requires the subdomain and either OAuth token or email/token pair."
  }
];

function uniqueCompanies() {
  return [...PROVIDER_SPECS].sort((a, b) => a.company.localeCompare(b.company));
}

function extractToken(input, spec) {
  const text = String(input || "");
  for (const pattern of spec.patterns || []) {
    const match = text.match(pattern);
    if (!match) continue;
    const raw = match.groups?.token || match[1] || match[0];
    const keyValue = raw.match(/[:=]\s*([^\s'"`]+)/);
    return (keyValue ? keyValue[1] : raw).replace(/^Bearer\s+/i, "").trim();
  }
  return text.trim();
}

function detectProviderSpecs(input) {
  const text = String(input || "");
  return PROVIDER_SPECS.filter((spec) => (spec.patterns || []).some((pattern) => pattern.test(text)));
}

function redactSecret(secret) {
  const value = String(secret || "");
  if (value.length <= 10) return "****";
  return `${value.slice(0, 6)}****${value.slice(-4)}`;
}

function requestFromValidation(validation, token) {
  const method = validation.method || "GET";
  const headers = { ...(validation.extraHeaders || {}) };
  let url = validation.urlFromToken ? token : validation.url;
  let body = validation.body;

  if (url) url = url.replaceAll("{token}", encodeURIComponent(token));

  switch (validation.type) {
    case "bearer":
      headers.authorization = `Bearer ${token}`;
      break;
    case "header":
      headers[validation.header] = token;
      break;
    case "query":
      break;
    case "basic-password":
      headers.authorization = `Basic ${Buffer.from(`${token}:`).toString("base64")}`;
      break;
    case "basic-api":
      headers.authorization = `Basic ${Buffer.from(`api:${token}`).toString("base64")}`;
      break;
    case "basic-user":
      headers.authorization = `Basic ${Buffer.from(`${token}:`).toString("base64")}`;
      break;
    case "geniekey":
      headers.authorization = `GenieKey ${token}`;
      break;
    case "token":
      headers.authorization = `token ${token}`;
      break;
    case "token-token":
      headers.authorization = `Token token=${token}`;
      break;
    case "json-rpc":
      headers["content-type"] = "application/json";
      body = validation.body;
      break;
    case "mailchimp": {
      const dc = token.split("-").pop();
      url = `https://${dc}.api.mailchimp.com/3.0/`;
      headers.authorization = `Basic ${Buffer.from(`api-key-validator:${token}`).toString("base64")}`;
      break;
    }
    case "slack":
      if (token.startsWith("https://hooks.slack.com/")) {
        return {
          url: token,
          options: {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ text: "" })
          },
          validText: "missing_text"
        };
      }
      url = "https://slack.com/api/auth.test";
      headers.authorization = `Bearer ${token}`;
      break;
    case "discord":
      if (/^https:\/\/discord(?:app)?\.com\/api\/webhooks\//i.test(token)) {
        return {
          url: token,
          options: {
            method: "GET",
            headers: {}
          },
          validText: undefined
        };
      }
      headers.authorization = `Bot ${token}`;
      break;
    case "telegram":
      url = `https://api.telegram.org/bot${token}/getMe`;
      break;
    case "webhook-json":
      headers["content-type"] = "application/json";
      body = validation.body || {};
      break;
    default:
      break;
  }

  return {
    url,
    options: {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    },
    validText: validation.validText
  };
}

function validationSucceeded(response, request) {
  if (!response) return false;
  if (request?.validText && String(response.text || "").includes(request.validText)) return true;
  if (response.status >= 200 && response.status < 300) {
    if (response.data?.ok === false) return false;
    if (response.data?.success === false) return false;
    return true;
  }
  return false;
}

async function validateProviderSpec(spec, input, request) {
  const token = extractToken(input, spec);
  const base = {
    id: `${spec.id}:credential`,
    label: spec.keyTypes[0],
    providerId: spec.id,
    providerLabel: spec.company,
    available: false,
    chatCapable: false,
    methods: [],
    owner: spec.company,
    source: "provider-registry",
    type: "credential",
    detail: ""
  };

  if (!spec.validation) {
    return {
      ...base,
      methods: ["detected"],
      detail: spec.requiresContext || "Detected by key format. No key-only validation endpoint is configured."
    };
  }

  const validationRequest = requestFromValidation(spec.validation, token);
  const response = await request(validationRequest.url, validationRequest.options, {
    timeoutMs: DEFAULT_TIMEOUT_MS,
    providerLabel: spec.company
  });
  const valid = validationSucceeded(response, validationRequest);

  return {
    ...base,
    available: valid,
    methods: ["validated"],
    detail: valid
      ? "Credential validated by provider endpoint."
      : `Provider endpoint did not validate the credential (${response.status || "network error"}).`
  };
}

async function validateDetectedProvider(input, request) {
  const specs = detectProviderSpecs(input);
  if (!specs.length) return null;

  const checks = [];
  for (const spec of specs.slice(0, 8)) {
    try {
      checks.push(await validateProviderSpec(spec, input, request));
    } catch (error) {
      checks.push({
        id: `${spec.id}:credential`,
        label: spec.keyTypes[0],
        providerId: spec.id,
        providerLabel: spec.company,
        available: false,
        chatCapable: false,
        methods: ["validation-error"],
        owner: spec.company,
        source: "provider-registry",
        type: "credential",
        detail: error.message || "Validation failed."
      });
    }
  }

  const winner = checks.find((check) => check.available) || checks[0];
  const spec = PROVIDER_SPECS.find((item) => item.id === winner.providerId) || specs[0];
  return {
    provider: spec.id,
    providerLabel: spec.company,
    checked: [spec.id],
    models: checks.map((check) => ({
      id: check.id,
      label: check.label,
      available: check.available,
      chatCapable: false,
      methods: check.methods,
      owner: check.owner,
      source: check.source,
      type: check.type,
      detail: check.detail
    })),
    keyTypes: spec.keyTypes
  };
}

module.exports = {
  PROVIDER_SPECS,
  detectProviderSpecs,
  extractToken,
  redactSecret,
  requestFromValidation,
  uniqueCompanies,
  validateDetectedProvider,
  validateProviderSpec
};
