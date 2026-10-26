# Changelog

## 1.7.6

### Changed
- `identifier_value` is null in consent responses once the consent is no longer awaiting authorisation.
  `identifierValue` on `DecoupledFlow` and `DecoupledFlowHint` is now typed `string | null` (it was the
  empty `IdentifierValue` interface). The API keeps the key and sends `null`, and may do so as soon as the
  bank has accepted the request; only a `consent_id` identifier is always echoed back. The SDK already
  returned `null` at runtime; the type now says so. Requests are unchanged: send the customer's
  identifier as before.

### Migrating from 1.7.5 and earlier
JavaScript callers need do nothing. TypeScript callers compiling with `strict` or `strictNullChecks`
that read `identifierValue` off a consent response must handle `null`, and a value that is not a string
no longer compiles on a request.

## 1.7.5

### Changed
- `statusUpdatedTimestamp` is now optional on `Consent`, `Payment` and `Refund`. The API omits it until
  the status first changes — for example a quick payment whose customer left the gateway page before
  choosing a bank (`GatewayAwaitingSubmission`). The SDK already returned `undefined` in that case; the
  type now says so.
- `dotenv` updated from 17 to 18. The SDK only calls `config()`, which is unchanged. dotenv 18 drops
  the `dotenv/config` preload hook and `.env.vault` support, neither of which the SDK uses, and writes
  its "injected env" line to stderr instead of stdout without the follow-up tips.
- Development dependencies refreshed (Jest 30.5, ts-jest 29.4.15, Babel 7.29, type packages) and an
  npm override pins `js-yaml` 4 under `@istanbuljs/load-nyc-config`, which removes the last
  `npm audit` finding (sprintf-js, GHSA-hp3w-g68c-fv3c, no upstream fix). Neither reaches a
  consumer's install.

### Migrating from 1.7.4 and earlier
Runtime behaviour is unchanged, and JavaScript callers need do nothing. TypeScript callers compiling
with `strict` or `strictNullChecks` will now get a compile error wherever they use the field as if it
were always present — the places that would otherwise throw a `TypeError` at runtime when it is
absent. Handle the missing case explicitly, for example:

```typescript
const { consent } = await client.getQuickPayment(quickPaymentId);

// Fall back to the creation time when the status has never changed
const lastChanged = consent.statusUpdatedTimestamp ?? consent.creationTimestamp;

if (consent.statusUpdatedTimestamp !== undefined) {
    // ...
}
```

If you capture the SDK's stdout, note that dotenv's one-line "injected env" message now goes to stderr.
