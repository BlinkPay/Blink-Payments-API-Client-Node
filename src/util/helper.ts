import {GenericParameters} from "./types.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Build request headers.
 * Auto-generates request-id and x-correlation-id if not provided for distributed tracing.
 * These IDs are reused across retry attempts for consistent tracking.
 *
 * @param requestId the optional request ID (auto-generated if not provided)
 * @param xCorrelationId the optional correlation ID (auto-generated if not provided)
 * @param xCustomerIp the optional customer IP address
 * @param xCustomerUserAgent the optional customer user agent
 * @param idempotencyKey the optional idempotency key (only for POST operations)
 */
export const buildRequestHeaders = ({
                                      requestId,
                                      xCorrelationId,
                                      xCustomerIp,
                                      xCustomerUserAgent,
                                      idempotencyKey,
                                    }: Partial<GenericParameters>): { [key: string]: string } => {
  const headers: { [key: string]: string } = {};

  // Auto-generate request-id if not provided (for request tracing)
  const finalRequestId = requestId || uuidv4();
  headers['request-id'] = finalRequestId;

  // Auto-generate x-correlation-id if not provided (for distributed tracing)
  const finalCorrelationId = xCorrelationId || uuidv4();
  headers['x-correlation-id'] = finalCorrelationId;

  // Optional customer headers
  if (xCustomerIp) {
    headers['x-customer-ip'] = xCustomerIp;
  }
  if (xCustomerUserAgent) {
    headers['x-customer-user-agent'] = xCustomerUserAgent;
  }

  // Add idempotency-key if provided (POST operations only)
  if (idempotencyKey) {
    headers['idempotency-key'] = idempotencyKey;
  }

  return headers;
};

const AMOUNT_KEYS = ['amount', 'maximum_amount_payment', 'maximum_amount_period'];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Remove the read-only surcharge fields Blink returns from a snake_case request body.
 * An amount read off a response may carry `surcharge` and `total_charge`, which a consent request
 * rejects with a 400, so they are dropped from every amount in the body, along with `surcharge_options`.
 * The input is not mutated.
 *
 * @param body the request body, already converted to snake_case
 * @returns a copy of the body without the read-only fields
 */
export const stripReadOnlyRequestFields = <T>(body: T): T => {
  if (!isPlainObject(body)) {
    return body;
  }

  const { surcharge_options, ...result }: Record<string, unknown> = body;
  for (const key of AMOUNT_KEYS) {
    const amount = result[key];
    if (isPlainObject(amount)) {
      const { surcharge, total_charge, ...rest } = amount;
      result[key] = rest;
    }
  }
  return result as T;
};
