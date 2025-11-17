/**
 * Copyright (c) 2025 BlinkPay
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { AxiosError, AxiosResponse } from 'axios';
import { BlinkServiceException } from '../exceptions/index.js';
import { Configuration } from '../../configuration.js';
import log from 'loglevel';

const MAX_RETRIES = 2; // 3 total attempts (initial + 2 retries)
const FIRST_RETRY_DELAY_MS = 1000;  // 1 second
const SECOND_RETRY_DELAY_MS = 5000; // 5 seconds

/**
 * Context for retry operations, containing tracking IDs that are reused across retry attempts
 */
interface RetryContext {
    attemptNumber: number;
    requestId: string;
    correlationId: string;
    idempotencyKey?: string; // Only for POST operations
}

/**
 * Sleep for the specified number of milliseconds
 */
async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the delay in milliseconds for a given retry attempt
 */
function getRetryDelay(attemptNumber: number): number {
    if (attemptNumber === 1) return FIRST_RETRY_DELAY_MS;
    if (attemptNumber === 2) return SECOND_RETRY_DELAY_MS;
    return 0;
}

/**
 * Check if an HTTP status code is retryable
 * Retryable: 429 (rate limit), 5xx (server errors)
 * NOT retryable: 4xx (client errors except 401/429), 408 (client timeout)
 */
function isRetryableStatus(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
}

/**
 * Execute an operation with automatic retry logic.
 *
 * Retry behavior:
 * - Network errors (no response): Retry up to MAX_RETRIES times
 * - 401 Unauthorized: Refresh token + ONE retry (not counted against MAX_RETRIES)
 * - 429 Rate Limit: Retry with exponential backoff
 * - 5xx Server Errors: Retry with exponential backoff
 * - Other errors (4xx): Fail immediately, no retry
 *
 * The same request-id, correlation-id, and idempotency-key are reused across all retry attempts
 * for consistent distributed tracing and idempotency guarantees.
 *
 * @param operation The async operation to execute
 * @param config The configuration instance (for token refresh)
 * @param context The retry context with tracking IDs
 * @returns The successful response
 * @throws {BlinkServiceException} If all retry attempts fail
 */
export async function executeWithRetry<T>(
    operation: () => Promise<AxiosResponse<T>>,
    config: Configuration,
    context: RetryContext
): Promise<AxiosResponse<T>> {
    try {
        return await operation();
    } catch (error) {
        const axiosError = error as AxiosError;

        // Handle 401 - token refresh + ONE retry (not counted against MAX_RETRIES)
        // This prevents infinite loops while allowing token refresh recovery
        if (axiosError.response?.status === 401 && context.attemptNumber === 0) {
            log.info('401 Unauthorized - refreshing token and retrying once');
            try {
                await config.tokenApi.getAccessToken(true); // Force refresh
            } catch (refreshError) {
                log.error('Token refresh failed:', refreshError);
                throw new BlinkServiceException(
                    `Authentication failed - token refresh error: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`
                );
            }
            // Increment attempt number to prevent infinite 401 loops
            context.attemptNumber++;
            return executeWithRetry(operation, config, context);
        }

        // Check if we should retry (network error or retryable status)
        const shouldRetry = context.attemptNumber < MAX_RETRIES && (
            !axiosError.response || // Network error (no response from server)
            isRetryableStatus(axiosError.response.status)
        );

        if (shouldRetry) {
            const delay = getRetryDelay(context.attemptNumber + 1);
            const errorDescription = axiosError.response
                ? `HTTP ${axiosError.response.status}`
                : 'network error';
            // Retries working as designed - debug level (verbose troubleshooting only)
            log.debug(
                `Retrying request after ${errorDescription} (attempt ${context.attemptNumber + 1}/${MAX_RETRIES + 1}) ` +
                `after ${delay}ms - request-id: ${context.requestId}`
            );
            await sleep(delay);
            context.attemptNumber++;
            return executeWithRetry(operation, config, context);
        }

        // No more retries - re-throw original error if it's a BlinkServiceException
        // Otherwise wrap it
        if (error instanceof BlinkServiceException) {
            // Already a typed Blink exception (404, 403, etc.) - preserve it
            throw error;
        }

        // Network error or other axios error - wrap it
        if (axiosError.response) {
            throw new BlinkServiceException(
                `HTTP ${axiosError.response.status} after ${context.attemptNumber + 1} attempt(s): ${axiosError.message}`
            );
        } else {
            throw new BlinkServiceException(
                `Network error after ${context.attemptNumber + 1} attempt(s): ${axiosError.message}`
            );
        }
    }
}
