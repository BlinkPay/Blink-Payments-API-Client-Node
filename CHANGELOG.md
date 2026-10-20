# Changelog

## 1.7.5

### Changed
- `statusUpdatedTimestamp` is now optional on `Consent`, `Payment` and `Refund`. The API omits it until
  the status first changes — for example a quick payment whose customer left the gateway page before
  choosing a bank (`GatewayAwaitingSubmission`). The SDK already returned `undefined` in that case; the
  type now says so.

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
