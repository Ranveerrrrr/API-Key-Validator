const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PROVIDER_SPECS,
  detectProviderSpecs,
  requestFromValidation,
  validateProviderSpec
} = require("../lib/providerRegistry");

test("every provider has a sample that detects itself", () => {
  const missing = [];
  for (const spec of PROVIDER_SPECS) {
    const detected = detectProviderSpecs(spec.sample).map((item) => item.id);
    if (!detected.includes(spec.id)) missing.push(`${spec.id}: ${spec.sample}`);
  }
  assert.deepEqual(missing, []);
});

test("similar AI key prefixes stay provider-specific", () => {
  assert.deepEqual(
    detectProviderSpecs("sk-or-v1-testtoken1234567890abcdef").map((spec) => spec.id),
    ["openrouter"]
  );
  assert.deepEqual(
    detectProviderSpecs("sk-proj-testtoken1234567890abcdef").map((spec) => spec.id),
    ["openai"]
  );
});

test("registry contains upstream research providers plus AI providers", () => {
  const ids = new Set(PROVIDER_SPECS.map((spec) => spec.id));
  for (const id of [
    "abtasty",
    "algolia",
    "amplitude",
    "asana",
    "aws",
    "azure-application-insights",
    "bazaarvoice",
    "bing-maps",
    "bitly",
    "branch",
    "browserstack",
    "buildkite",
    "buttercms",
    "calendly",
    "circleci",
    "cloudflare",
    "contentful",
    "cypress",
    "datadog",
    "delighted",
    "deviantart",
    "discord",
    "dropbox",
    "facebook",
    "freshdesk",
    "github",
    "gitlab",
    "google",
    "groq",
    "grafana",
    "helpscout",
    "heroku",
    "hubspot",
    "infura",
    "instagram",
    "ipstack",
    "iterable",
    "jumpcloud",
    "keen",
    "linkedin",
    "lokalise",
    "loqate",
    "mailchimp",
    "mailgun",
    "mapbox",
    "microsoft-azure",
    "microsoft-teams",
    "newrelic",
    "npm",
    "openrouter",
    "opsgenie",
    "pagerduty",
    "paypal",
    "pendo",
    "pivotal-tracker",
    "razorpay",
    "salesforce",
    "saucelabs",
    "sendgrid",
    "shodan",
    "slack",
    "sonarcloud",
    "spotify",
    "square",
    "stripe",
    "supabase",
    "telegram",
    "travis-ci",
    "twilio",
    "twitter",
    "xai",
    "visual-studio-app-center",
    "wakatime",
    "weglot",
    "wpengine",
    "youtube",
    "zapier",
    "zendesk",
    "anthropic",
    "openai",
    "deepseek"
  ]) {
    assert.equal(ids.has(id), true, `missing ${id}`);
  }
});

test("validation request formatting is consistent for bearer providers", () => {
  const stripe = PROVIDER_SPECS.find((spec) => spec.id === "stripe");
  const request = requestFromValidation(stripe.validation, stripe.sample);
  assert.equal(request.url, "https://api.stripe.com/v1/account");
  assert.equal(request.options.headers.authorization, `Bearer ${stripe.sample}`);
});

test("validation helper maps successful provider response to green check", async () => {
  const github = PROVIDER_SPECS.find((spec) => spec.id === "github");
  const check = await validateProviderSpec(github, github.sample, async () => ({
    ok: true,
    status: 200,
    data: { login: "octocat" },
    text: "{\"login\":\"octocat\"}"
  }));

  assert.equal(check.available, true);
  assert.equal(check.providerLabel, "GitHub");
  assert.deepEqual(check.methods, ["validated"]);
});
