# Changelog

## 1.8.0

### Added
- Surcharge fields, all optional, nullable and read-only. `Amount` gains `surcharge` and `totalCharge`
  (`total` + `surcharge`), returned on single consents, quick payments, payments and, as the raised maxima,
  on a surcharged enduring consent's `maximumAmountPayment` and `maximumAmountPeriod`. `Consent` gains
  `surchargeOptions`, a best-effort preview per payment method (`bank`, and `card` when the consent can be paid
  by card) while a gateway consent is in `GatewayAwaitingSubmission`. New interfaces `SurchargeOptions`,
  `SurchargeOption` and `SurchargeDetail`. See the README's Surcharging section.

### Changed
- Create requests for consents, quick payments, payments and refunds no longer send `surcharge` or
  `total_charge` on any amount, or `surcharge_options`. The API rejects a consent request carrying them, and
  `Amount` is shared by request and response types, so an amount read off a response can now be sent back
  as-is. Nothing else in the request body changes.

### Migrating from 1.7.6 and earlier
Nothing to do. The API already returned these fields and the SDK already passed them through at runtime;
TypeScript callers can now read them without a cast.

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
that read `identifierValue` off a consent response must handle `null`. On a request, `identifierValue`
must now be a `string`: a value typed as `IdentifierValue`, or any other non-string, no longer compiles.
`IdentifierValue` is still exported but nothing uses it.

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
