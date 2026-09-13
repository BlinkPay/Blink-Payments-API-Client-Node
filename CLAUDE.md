# BlinkPay SDK - Development Guide

This document provides implementation guidance and best practices for working on the BlinkPay Node.js SDK codebase.

## Project Overview

**BlinkPay SDK for Node.js** is a TypeScript SDK for integrating with the BlinkPay Debit payment API. It enables:
- **Blink PayNow**: One-off payments
- **Blink AutoPay**: Recurring payments

**Important**: This SDK is **server-side only**. It must never be used in browser/frontend JavaScript.

## Architecture

### Core Components

1. **BlinkDebitClient** (`src/client/v1/blink-debit-client.ts`)
   - Main client class users instantiate
   - Provides high-level methods for all API operations
   - Has 5 constructor overloads for flexibility
   - Wraps all errors in BlinkServiceException

2. **Configuration** (`configuration.ts`)
   - Handles environment variables and config files
   - Manages OAuth2 credentials
   - Stores TokenAPI instance per client (not singleton)
   - Configures Axios, retry policy, and error handling
   - **Critical**: Detects browser environment and throws error

3. **TokenAPI** (`src/client/v1/token-api.ts`)
   - Manages OAuth2 Client Credentials flow
   - Automatically refreshes expired tokens
   - Token expiration tracked via `expirationDate`
   - One instance per Configuration (not shared globally)

4. **API Clients** (`src/client/v1/*-api.ts`)
   - Individual API endpoint implementations
   - Auto-generated base with manual enhancements
   - Use Configuration.tokenApi for authentication
   - Support retry policies and custom headers

5. **DTOs** (`src/dto/v1/*.ts`)
   - Data Transfer Objects
   - **Mostly auto-generated** - be careful when modifying
   - Follow OpenAPI 3.0.3 spec exactly

### Key Design Decisions

#### No Singleton Pattern
- Each `BlinkDebitClient` instance creates its own `Configuration` and `TokenAPI`
- Enables multiple concurrent clients with different credentials
- Better testability, no global state issues

#### Environment Variables
- **Prefix**: `BLINKPAY_*` (not `REACT_APP_*`)
- **Required**: BLINKPAY_DEBIT_URL, BLINKPAY_CLIENT_ID, BLINKPAY_CLIENT_SECRET
- **Optional**: BLINKPAY_TIMEOUT, BLINKPAY_RETRY_ENABLED

#### Error Handling
- All errors wrapped in `BlinkServiceException` or specific subclasses
- Helper method `handleError()` reduces duplication
- Errors properly propagated (no silent failures)
- Token refresh errors rethrown to caller

#### Token Management
- `expirationDate` initialized to `new Date(0)` to force initial refresh
- Token refresh triggered when `Date.now() >= expirationDate`
- Errors during refresh are propagated, not suppressed

## Testing

### Unit Tests
Location: `test/unit/*.test.ts`

**Coverage:**
- Configuration class (constructor overloads, timeout, retry policy)
- TokenAPI class (token refresh, expiration logic, error handling)

**Running:**
```bash
npm test test/unit/
```

**Dependencies:** axios-mock-adapter for mocking (no credentials required)

### Integration Tests
Location: `integrationTest/client/v1/*.test.ts`

**Coverage:**
- Bank metadata retrieval
- Single consents (redirect & decoupled flows)
- Enduring consents
- Quick payments, payments, refunds
- Error handling (timeouts, 404s, etc.)

**Running:**
```bash
npm test integrationTest/
npm test                    # Run all tests
```

**Requirements:**
- Valid .env file with BLINKPAY_* credentials
- Access to BlinkPay sandbox environment
- Tests use live API (not mocked)

### Manual Testing Checklist
When making changes, verify:
1. TypeScript compilation: `npm run build`
2. Environment variable loading
3. Constructor overloads work correctly
4. Error handling propagates correctly
5. Integration tests pass (with valid creds)

## Implementation Guidelines

### ❌ DON'T
- Use this SDK in browser/frontend code
- Use REACT_APP_ environment variable prefix
- Modify DTOs without checking OpenAPI spec
- Add console.log statements (use loglevel)
- Create singleton patterns or global state
- Catch errors without rethrowing (unless intentional)
- Use `any` type without good reason
- Skip error propagation in token refresh

### ✅ DO
- Keep SDK server-side only
- Use BLINKPAY_ environment variable prefix
- Follow OpenAPI spec for DTOs
- Use loglevel for logging
- Create instances (not singletons)
- Propagate errors properly
- Use proper TypeScript types
- Initialize fields that will be compared
- Pass idempotency keys through to headers
- Validate boolean config correctly (check for undefined, not falsy)

## Code Review Checklist

When reviewing or making changes:

### Security
- [ ] No credentials exposed in code
- [ ] Browser environment check in place
- [ ] Proper error message sanitization
- [ ] No sensitive data in logs

### Architecture
- [ ] No circular dependencies
- [ ] Proper separation of concerns
- [ ] No global state/singletons
- [ ] Follows existing patterns

### Error Handling
- [ ] Errors properly typed
- [ ] Errors propagated correctly
- [ ] No silent failures
- [ ] Helpful error messages
- [ ] Token refresh errors rethrown

### Testing
- [ ] Integration tests still pass
- [ ] New features have tests
- [ ] Edge cases covered
- [ ] Error paths tested

### Documentation
- [ ] JSDoc for public methods
- [ ] README updated if needed
- [ ] Comments explain "why" not "what"
- [ ] CHANGELOG updated

## Environment Setup

### Required Tools
- Node.js 22.10 LTS
- TypeScript 5.9+
- npm (for dependencies)

### Development Workflow
```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests (requires valid credentials)
npm test

# Type check
npx tsc --noEmit
```

### Configuration Files
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration
- `.env` - Environment variables (git-ignored)
- `package.json` - Dependencies and scripts

## API Specification

**OpenAPI Spec Version**: 1.0.19
**Base URL**:
- Sandbox: `https://sandbox.debit.blinkpay.co.nz`
- Production: `https://debit.blinkpay.co.nz`

**Authentication**: OAuth2 Client Credentials flow

**Key Endpoints**:
- `/oauth2/token` - Token endpoint
- `/payments/v1/meta` - Bank metadata
- `/payments/v1/consents` - Consents (single/enduring)
- `/payments/v1/quick-payments` - Quick payments
- `/payments/v1/payments` - Payments
- `/payments/v1/refunds` - Refunds

## Useful Commands

```bash
# Search for specific error handling pattern
grep -r "BlinkServiceException" src/

# Find all error catches
grep -r "catch(error" src/

# Check for console.log (should be none)
grep -r "console.log" src/

# Find TODO/FIXME comments
grep -r "TODO\|FIXME" src/

# Check TypeScript strict mode
grep "strict" tsconfig.json

# List all API files
ls -la src/client/v1/*-api.ts
```

## Common Patterns

### Adding a New API Endpoint
1. Update the OpenAPI spec
2. Regenerate DTO types if needed
3. Add method to appropriate API class
4. Use `buildRequestHeaders()` for headers
5. Include idempotency key support if applicable
6. Wrap errors in BlinkServiceException
7. Add integration test
8. Update JSDoc

### Modifying Error Handling
1. Use `handleError()` helper where possible
2. Ensure errors are wrapped correctly
3. Don't suppress errors silently
4. Test error propagation paths
5. Check both unit and integration tests

### Adding Configuration Options
1. Add to Configuration constructor
2. Support both env vars and config object
3. Add proper validation
4. Update JSDoc
5. Add unit tests
6. Update README

## Contact & Resources

- **Repository**: https://github.com/BlinkPay/Blink-Payments-API-Client-Node
- **BlinkPay Docs**: (Contact BlinkPay for documentation)
- **OpenAPI Spec**: Provided separately by BlinkPay
- **Support**: sysadmin@blinkpay.co.nz

---

**Last Updated**: 2025-11-06
**Maintained By**: BlinkPay Team
