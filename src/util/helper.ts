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