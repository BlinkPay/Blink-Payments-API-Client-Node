# Blink Payments API client for Node.js
[![CI](https://github.com/BlinkPay/Blink-Debit-API-Client-Node/actions/workflows/build.yml/badge.svg)](https://github.com/BlinkPay/Blink-Debit-API-Client-Node/actions/workflows/build.yml)
[![NPM](https://img.shields.io/npm/v/blink-debit-api-client-node.svg)](https://npmjs.org/package/blink-debit-api-client-node)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=blink-debit-api-client-node&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=blink-debit-api-client-node)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=blink-debit-api-client-node&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=blink-debit-api-client-node)
[![Snyk security](https://img.shields.io/badge/Snyk_security-monitored-9043C6)](https://app.snyk.io/org/blinkpay-zw9/project/bac031c3-97b5-430a-b642-0ccf1302441c)

# Table of Contents
1. [Introduction](#introduction)
2. [Contributing](#contributing)
3. [Minimum Requirements](#minimum-requirements)
4. [Dependency](#adding-the-dependency)
5. [Quick Start](#quick-start)
6. [Configuration](#configuration)
7. [Client Creation](#client-creation)
8. [Request ID, Correlation ID and Idempotency Key](#request-id-correlation-id-and-idempotency-key)
9. [Full Examples](#full-examples)
10. [Individual API Call Examples](#individual-api-call-examples)

## Introduction
This SDK allows merchants with TypeScript- or JavaScript-based backends to integrate with Blink PayNow and Blink AutoPay.

This SDK was written in TypeScript 5.

## ⚠️ Security Warning

**This SDK is for SERVER-SIDE use only.**

**NEVER use this SDK in browser/frontend JavaScript** (React components, Vue components, Angular components, etc.).

Your OAuth2 client credentials (`client_id` and `client_secret`) would be exposed in the browser bundle, allowing attackers to steal them and make unauthorized payments from your merchant account.

**Valid use cases:**
- ✅ Node.js backend servers
- ✅ Next.js API routes (in `/pages/api/` or `/app/api/`)
- ✅ Express.js / Fastify / NestJS servers
- ✅ Serverless functions (AWS Lambda, Vercel Functions, etc.)
- ❌ React/Vue/Angular components
- ❌ Browser JavaScript
- ❌ Mobile app WebViews

**Proper architecture:**
Your frontend should call YOUR backend API, which then uses this SDK to communicate with BlinkPay.

## Contributing
We welcome contributions from the community. Your pull request will be reviewed by our team.

This project is licensed under the MIT License.

## Minimum Requirements
- Axios 1.12
- Node.js 22.10 LTS

## Adding the dependency
- Install via NPM
```shell
npm install blink-debit-api-client-node --save
```

## Quick Start
Append the BlinkPay environment variables to your `.env` file.
```dotenv
BLINKPAY_DEBIT_URL=https://sandbox.debit.blinkpay.co.nz
BLINKPAY_CLIENT_ID=...
BLINKPAY_CLIENT_SECRET=...
BLINKPAY_RETRY_ENABLED=true
BLINKPAY_TIMEOUT=10000
```

Create and use the client:

**Note**: The SDK is distributed as CommonJS. Choose the import style based on your project configuration:

- **CommonJS** (`sample.js` without `"type": "module"` in package.json)
```javascript
const axios = require('axios');
const log = require('loglevel');
const { BlinkDebitClient, AuthFlowDetailTypeEnum, AmountCurrencyEnum } = require('blink-debit-api-client-node');

const client = new BlinkDebitClient(axios);

const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: "https://www.blinkpay.co.nz/sample-merchant-return-page"
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: '0.01'
    },
    pcr: {
        particulars: 'particulars',
        code: 'code',
        reference: 'reference'
    }
};

async function createQuickPayment() {
    const qpCreateResponse = await client.createQuickPayment(request);
    log.info("Redirect URL: {}", qpCreateResponse.redirectUri); // Redirect the consumer to this URL
    const qpId = qpCreateResponse.quickPaymentId;
    const qpResponse = await client.awaitSuccessfulQuickPaymentOrThrowException(qpId, 300); // Will throw an exception if the payment was not successful after 5min
}

await createQuickPayment();
```

- **ESM** (`sample.js` with `"type": "module"` in package.json)
```javascript
import axios from 'axios';
import log from 'loglevel';
import pkg from 'blink-debit-api-client-node';
const { BlinkDebitClient, AuthFlowDetailTypeEnum, AmountCurrencyEnum } = pkg;

const client = new BlinkDebitClient(axios);

const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: "https://www.blinkpay.co.nz/sample-merchant-return-page"
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: '0.01'
    },
    pcr: {
        particulars: 'particulars',
        code: 'code',
        reference: 'reference'
    }
};

async function createQuickPayment() {
    const qpCreateResponse = await client.createQuickPayment(request);
    log.info("Redirect URL: {}", qpCreateResponse.redirectUri); // Redirect the consumer to this URL
    const qpId = qpCreateResponse.quickPaymentId;
    const qpResponse = await client.awaitSuccessfulQuickPaymentOrThrowException(qpId, 300); // Will throw an exception if the payment was not successful after 5min
}

await createQuickPayment();
```

- **TypeScript** (`sample.ts`)
```typescript
import axios from 'axios';
import log from 'loglevel';
import { BlinkDebitClient, QuickPaymentRequest, AuthFlowDetailTypeEnum, GatewayFlow, AuthFlow, AmountCurrencyEnum, Amount, Pcr } from 'blink-debit-api-client-node';

const client = new BlinkDebitClient(axios);

const request: QuickPaymentRequest = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: "https://www.blinkpay.co.nz/sample-merchant-return-page"
        } as GatewayFlow
    } as AuthFlow,
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: '0.01'
    } as Amount,
    pcr: {
        particulars: 'particulars',
        code: 'code',
        reference: 'reference'
    } as Pcr
};

async function createQuickPayment() {
    const qpCreateResponse = await client.createQuickPayment(request);
    log.info("Redirect URL: {}", qpCreateResponse.redirectUri); // Redirect the consumer to this URL
    const qpId = qpCreateResponse.quickPaymentId;
    const qpResponse = await client.awaitSuccessfulQuickPaymentOrThrowException(qpId, 300); // Will throw an exception if the payment was not successful after 5min
}

await createQuickPayment();
```

## Configuration
- Customise/supply the required properties in your `config.json` and `.env`. This file should be available in your project folder.
- The BlinkPay **Sandbox** debit URL is `https://sandbox.debit.blinkpay.co.nz` and the **production** debit URL is `https://debit.blinkpay.co.nz`.
- The client credentials will be provided to you by BlinkPay as part of your on-boarding process.
> **Warning** Take care not to check in your client ID and secret to your source control.

### Configuration precedence
Configuration will be detected and loaded according to the hierarchy -
1. `.env`
2. `config.json` (`Node.js environment`)
3. Default values

### Configuration examples

#### .env file for Node.js environment
This file is NOT pushed to the repository.
```dotenv
BLINKPAY_DEBIT_URL=<BLINKPAY_DEBIT_URL>
BLINKPAY_CLIENT_ID=<BLINKPAY_CLIENT_ID>
BLINKPAY_CLIENT_SECRET=<BLINKPAY_CLIENT_SECRET>
BLINKPAY_TIMEOUT=10000
BLINKPAY_RETRY_ENABLED=true
```

### config.json file for Node.js environment
Substitute the correct values in your `config.json` file. Since this file can be pushed to your repository, make sure that the client secret is not included.
```json
{
  "blinkpay": {
    "debitUrl": "${BLINKPAY_DEBIT_URL}",
    "timeout": 10000,
    "retryEnabled": true
  }
}
```

## Client creation

The SDK provides 4 constructor signatures for different use cases:

### 1. No Arguments (Auto-creates Axios + Environment Variables)
The simplest way to create a client - uses `.env` configuration:
```javascript
const client = new BlinkDebitClient();
```
The SDK will automatically create an Axios instance and read configuration from environment variables.

### 2. Axios Instance Only (Environment Variables)
Provide your own configured Axios instance:
```javascript
import axios from 'axios';
const client = new BlinkDebitClient(axios);
```

### 3. Axios + Config Object (Explicit Configuration)
Pass configuration explicitly via object:
- `JavaScript`
```javascript
const blinkPayConfig = {
    blinkpay: {
        debitUrl: process.env.BLINKPAY_DEBIT_URL || '',
        clientId: process.env.BLINKPAY_CLIENT_ID || '',
        clientSecret: process.env.BLINKPAY_CLIENT_SECRET || '',
        timeout: 10000,
        retryEnabled: true
    }
};
const client = new BlinkDebitClient(axios, blinkPayConfig);
```
- `TypeScript`
```typescript
const blinkPayConfig: BlinkPayConfig = {
    blinkpay: {
        debitUrl: process.env.BLINKPAY_DEBIT_URL || '',
        clientId: process.env.BLINKPAY_CLIENT_ID || '',
        clientSecret: process.env.BLINKPAY_CLIENT_SECRET || '',
        timeout: 10000,
        retryEnabled: true
    }
};
const client = new BlinkDebitClient(axios, blinkPayConfig);
```

### 4. Axios + Individual Parameters (Explicit Credentials)
Pass credentials directly as separate arguments:
```javascript
import axios from 'axios';
const client = new BlinkDebitClient(
    axios,
    process.env.BLINKPAY_DEBIT_URL,
    process.env.BLINKPAY_CLIENT_ID,
    process.env.BLINKPAY_CLIENT_SECRET
);
```

**Recommended**: Use constructor #1 or #2 with environment variables for production.

## Request ID, Correlation ID and Idempotency Key
An optional request ID, correlation ID and idempotency key can be added as arguments to API calls. They will be generated for you automatically if they are not provided.

**Important**: All IDs are generated once per operation and reused across retry attempts. This ensures:
- Consistent distributed tracing (same `request-id` and `x-correlation-id` across all retries)
- Idempotency safety (same `idempotency-key` prevents duplicate operations on retry)

## Full Examples
> **Note:** For error handling, a BlinkServiceException can be caught.
### Quick payment (one-off payment), using Gateway flow
A quick payment is a one-off payment that combines the API calls needed for both the consent and the payment.
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: 'https://www.blinkpay.co.nz/sample-merchant-return-page'
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: '0.01'
    },
    pcr: {
        particulars: 'particulars',
        code: 'code',
        reference: reference
    }
};

const qpCreateResponse = await client.createQuickPayment(request);
log.info("Redirect URL:", qpCreateResponse.redirectUri); // Redirect the consumer to this URL
const qpId = qpCreateResponse.quickPaymentId;
const qpResponse = await client.awaitSuccessfulQuickPaymentOrThrowException(qpId, 300); // Will throw an exception if the payment was not successful after 5min
```

### Single consent followed by one-off payment, using Gateway flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Redirect,
            bank: Bank.BNZ,
            redirectUri: 'https://www.blinkpay.co.nz/sample-merchant-return-page'
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: '0.01'
    },
    pcr: {
        particulars: 'particulars'
    }
};

const createConsentResponse = await client.createSingleConsent(request);
const redirectUri = createConsentResponse.redirectUri; // Redirect the consumer to this URL
const paymentRequest = {
    consentId: createConsentResponse.consentId
};

const paymentResponse = await client.createPayment(paymentRequest);
const payment = await client.getPayment(paymentResponse.paymentId);
log.info("Payment Status:", payment.status);
// TODO inspect the payment result status
```

## Retry Behavior and Automatic Retries

The SDK automatically retries failed API requests in the following scenarios:

**Automatically Retried:**
- Network errors (no response from server)
- 401 Unauthorized (triggers token refresh + one retry)
- 429 Rate Limit Exceeded (with exponential backoff)
- 5xx Server Errors (with exponential backoff)

**NOT Retried:**
- 4xx Client Errors (except 401 and 429)
- 408 Request Timeout (client-side timeout)

**Retry Configuration:**
- Maximum 3 total attempts (1 initial + 2 retries)
- Exponential backoff: 1 second, then 5 seconds
- Same `request-id`, `x-correlation-id`, and `idempotency-key` reused across retries

All request IDs and idempotency keys are auto-generated if not provided, ensuring safe retries without duplicate operations.

## Polling and Timeout Behavior

The SDK provides helper methods to wait for consent authorization and payment completion:

### Auto-Revoke on Timeout

| Method | Auto-Revokes on Timeout? | Reason |
|--------|-------------------------|--------|
| `awaitSuccessfulQuickPayment` | ✅ **YES** | Quick payments combine consent + payment - should complete immediately or be cancelled |
| `awaitAuthorisedSingleConsent` | ❌ **NO** | Single consents require separate payment step - no funds processed if abandoned |
| `awaitAuthorisedEnduringConsent` | ✅ **YES** | Enduring consents grant ongoing access - clean up if abandoned for security |
| `awaitSuccessfulPayment` | ❌ N/A | Payments cannot be revoked once initiated |

**Best Practices:**
- Manually revoke single or enduring consents if you determine the customer has permanently abandoned the authorization flow (before timeout expires)
- Enduring consents will auto-revoke on timeout, but earlier manual revocation improves security

### Payment Settlement and Wash-up Process

**Important**: Payment settlement is asynchronous. Payments transition through these states:

**Settlement Statuses**:
- `Pending` - Payment initiated, not yet settled
- `AcceptedSettlementInProcess` - Settlement in progress
- `AcceptedSettlementCompleted` - ✅ **ONLY THIS STATUS means money has been sent from the payer's bank**
- `Rejected` - Payment failed

**Wash-up Implementation**:
```typescript
// Poll payment status until settlement completes
async function waitForSettlement(paymentId: string, maxAttempts: number = 60): Promise<Payment> {
    for (let i = 0; i < maxAttempts; i++) {
        const payment = await client.getPayment(paymentId);

        if (payment.status === 'AcceptedSettlementCompleted') {
            return payment; // SUCCESS - funds sent from payer's bank
        }

        if (payment.status === 'Rejected') {
            throw new Error('Payment rejected');
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
    throw new Error('Payment settlement timeout');
}
```

**Only `AcceptedSettlementCompleted` confirms funds have been sent from the payer's bank.** In rare cases, payments may remain in `AcceptedSettlementInProcess` for extended periods.

## Individual API Call Examples
### Bank Metadata
Supplies the supported banks and supported flows on your account.
```typescript
const bankMetadataList = await client.getMeta();
```

### Quick Payments
#### Gateway Flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createQuickPaymentResponse = await client.createQuickPayment(request);
```
#### Gateway Flow - Redirect Flow Hint
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri,
            flowHint: {
                type: FlowHintTypeEnum.Redirect,
                bank: bank
            }
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createQuickPaymentResponse = await client.createQuickPayment(request);
```
#### Gateway Flow - Decoupled Flow Hint
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri,
            flowHint: {
                type: FlowHintTypeEnum.Decoupled,
                bank: bank,
                identifierType: identifierType,
                identifierValue: identifierValue
            }
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createQuickPaymentResponse = await client.createQuickPayment(request);
```
#### Redirect Flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Redirect,
            bank: bank,
            redirectUri: redirectUri
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createQuickPaymentResponse = await client.createQuickPayment(request);
```
#### Decoupled Flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Decoupled,
            bank: bank,
            identifierType: identifierType,
            identifierValue: identifierValue,
            callbackUrl: callbackUrl
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createQuickPaymentResponse = await client.createQuickPayment(request);
```
#### Retrieval
```typescript
const quickPaymentResponse = await client.getQuickPayment(quickPaymentId);
```
#### Revocation
```javascript
await client.revokeQuickPayment(quickPaymentId);
```

### Single/One-Off Consents
#### Gateway Flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createConsentResponse = await client.createSingleConsent(request);
```
#### Gateway Flow - Redirect Flow Hint
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri,
            flowHint: {
                type: FlowHintTypeEnum.Redirect,
                bank: Bank.PNZ
            }
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createConsentResponse = await client.createSingleConsent(request);
```
#### Gateway Flow - Decoupled Flow Hint
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri,
            flowHint: {
                type: FlowHintTypeEnum.Decoupled,
                bank: bank,
                identifierType: identifierType,
                identifierValue: identifierValue
            }
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createConsentResponse = await client.createSingleConsent(request);
```
#### Redirect Flow
Suitable for most consents.
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Redirect,
            bank: bank,
            redirectUri: redirectUri
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createConsentResponse = await client.createSingleConsent(request);
```
#### Decoupled Flow
This flow type allows better support for mobile by allowing the supply of a mobile number or previous consent ID to identify the customer with their bank.

The customer will receive the consent request directly to their online banking app. This flow does not send the user through a web redirect flow.

```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Decoupled,
            bank: bank,
            identifierType: identifierType,
            identifierValue: identifierValue,
            callbackUrl: callbackUrl
        }
    },
    amount: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const createConsentResponse = await client.createSingleConsent(request);
```
#### Retrieval
Get the consent including its status
```typescript
const consent = await client.getSingleConsent(consentId);
```
#### Revocation
```typescript
await client.revokeSingleConsent(consentId);
```

### Blink AutoPay - Enduring/Recurring Consents
Request an ongoing authorisation from the customer to debit their account on a recurring basis.

Note that such an authorisation can be revoked by the customer in their mobile banking app.
#### Gateway Flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri
        }
    },
    maximumAmountPeriod: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPeriod
    },
    maximumAmountPayment: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPayment
    },
    fromTimestamp: startDate,
    expiryTimestamp: endDate,
    period: period
};

const createConsentResponse = await client.createEnduringConsent(request);
```
#### Gateway Flow - Redirect Flow Hint
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri,
            flowHint: {
                type: FlowHintTypeEnum.Redirect,
                bank: Bank.PNZ
            }
        }
    },
    maximumAmountPeriod: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPeriod
    },
    maximumAmountPayment: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPayment
    },
    fromTimestamp: startDate,
    expiryTimestamp: endDate,
    period: period
};

const createConsentResponse = await client.createEnduringConsent(request);
```
#### Gateway Flow - Decoupled Flow Hint
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Gateway,
            redirectUri: redirectUri,
            flowHint: {
                type: FlowHintTypeEnum.Decoupled,
                bank: bank,
                identifierType: identifierType,
                identifierValue: identifierValue
            }
        }
    },
    maximumAmountPeriod: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPeriod
    },
    maximumAmountPayment: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPayment
    },
    fromTimestamp: startDate,
    expiryTimestamp: endDate,
    period: period
};

const createConsentResponse = await client.createEnduringConsent(request);
```
#### Redirect Flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Redirect,
            bank: bank,
            redirectUri: redirectUri
        }
    },
    maximumAmountPeriod: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    maximumAmountPayment: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPayment
    },
    fromTimestamp: startDate,
    expiryTimestamp: endDate,
    period: period
};

const createConsentResponse = await client.createEnduringConsent(request);
```
#### Decoupled Flow
```javascript
const request = {
    flow: {
        detail: {
            type: AuthFlowDetailTypeEnum.Decoupled,
            bank: bank,
            identifierType: identifierType,
            identifierValue: identifierValue,
            callbackUrl: callbackUrl
        }
    },
    maximumAmountPeriod: {
        currency: AmountCurrencyEnum.NZD,
        total: total
    },
    maximumAmountPayment: {
        currency: AmountCurrencyEnum.NZD,
        total: totalPerPayment
    },
    fromTimestamp: startDate,
    expiryTimestamp: endDate,
    period: period
};
    
const createConsentResponse = await client.createEnduringConsent(request);
```
#### Retrieval
```javascript
const consent = await client.getEnduringConsent(consentId);
```
#### Revocation
```javascript
await client.revokeEnduringConsent(consentId);
```

### Payments
The completion of a payment requires a consent to be in the Authorised status.
#### Single/One-Off
```javascript
const paymentRequest = {
    consentId: consentId
};

const paymentResponse = await client.createPayment(request);
```
#### Enduring/Recurring
If you already have an approved consent, you can run a Payment against that consent at the frequency as authorised in the consent.
```javascript
const paymentRequest = {
    consentId: consentId,
    amount: {
        total: total,
        currency: AmountCurrencyEnum.NZD
    },
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    }
};

const paymentResponse = await client.createPayment(request);
```
#### Retrieval
```javascript
const payment = await client.getPayment(paymentId);
```

### Refunds
#### Account Number Refund
```javascript
const refundRequest = {
    type: RefundDetailTypeEnum.AccountNumber,
    paymentId: paymentId
}

const refundResponse = await client.createRefund(request);
```
#### Full Refund (Not yet implemented)
```javascript
const refundRequest = {
    type: RefundDetailTypeEnum.FullRefund,
    paymentId: paymentId,
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    },
    consentRedirect: redirectUri
}

const refundResponse = await client.createRefund(request);
```
#### Partial Refund (Not yet implemented)
```javascript
const refundRequest = {
    type: RefundDetailTypeEnum.PartialRefund,
    paymentId: paymentId,
    pcr: {
        particulars: particulars,
        code: code,
        reference: reference
    },
    consentRedirect: redirectUri,
    amount: {
        total: total,
        currency: AmountCurrencyEnum.NZD
    }
}

const refundResponse = await client.createRefund(request);
```
#### Retrieval
```javascript
const refund = await client.getRefund(refundId);
```