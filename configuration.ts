/**
 * Copyright (c) 2023 BlinkPay
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

import {AxiosInstance, AxiosRequestConfig} from 'axios';
import qs from 'qs';
import {camelizeKeys, decamelizeKeys} from 'humps';
import {
    BlinkClientException,
    BlinkForbiddenException,
    BlinkInvalidValueException,
    BlinkNotImplementedException,
    BlinkRateLimitExceededException,
    BlinkRequestTimeoutException,
    BlinkResourceNotFoundException,
    BlinkRetryableException,
    BlinkServiceException,
    BlinkUnauthorisedException,
    TokenAPI
} from './src/index.js';
import {ExponentialBackoff, handleType, retry, RetryPolicy} from 'cockatiel';
import {BlinkPayConfig} from './blinkpay-config.js';
import log from 'loglevel';

if (typeof process !== 'undefined') {
    require('dotenv').config();
}

/**
 * The configuration.
 */
export class Configuration {
    /**
     * parameter for OAuth2 security
     *
     * @param name security name
     * @param scopes oauth2 scope
     * @memberof Configuration
     */
    accessToken?: string | Promise<string> | ((name?: string, scopes?: string[]) => string) | ((name?: string, scopes?: string[]) => Promise<string>);
    /**
     * override base path
     *
     * @type {string}
     * @memberof Configuration
     */
    basePath?: string;
    /**
     * base options for axios calls
     *
     * @type {AxiosRequestConfig}
     * @memberof Configuration
     */
    baseOptions?: AxiosRequestConfig;
    /**
     * parameter for expiry date of the access token
     *
     * @type {Date}
     * @memberof Configuration
     */
    expirationDate: Date;
    /**
     * The retry policy
     */
    retryPolicy: RetryPolicy;
    /**
     * The Blink Debit URL
     *
     * @type {string}
     * @memberof Configuration
     */
    readonly debitUrl: string;
    /**
     * The Axios request timeout
     *
     * @private
     */
    private readonly _timeout: number = 10000;
    /**
     * The retry flag
     *
     * @private
     */
    private readonly _retryEnabled: boolean = true;
    /**
     * The OAuth2 client ID
     *
     * @type {string}
     * @memberof Configuration
     */
    readonly clientId: string;
    /**
     * The OAuth2 client secret
     *
     * @type {string}
     * @memberof Configuration
     */
    readonly clientSecret: string;
    /**
     * The Axios instance
     *
     * @private
     */
    private readonly _axios: AxiosInstance;
    /**
     * The TokenAPI instance for token management
     *
     * @private
     */
    private readonly _tokenApi: TokenAPI;

    constructor(axios: AxiosInstance, config?: BlinkPayConfig);

    constructor(axios: AxiosInstance, config?: BlinkPayConfig) {
        let timeout;
        let retryEnabled;
        // check if it's not a browser environment
        if (typeof window === 'undefined') {
            // Node.js server-side environment
            // Config object provided or undefined (use env vars)

            this.debitUrl = process.env.BLINKPAY_DEBIT_URL
                ? process.env.BLINKPAY_DEBIT_URL
                : (config && config.blinkpay && config.blinkpay.debitUrl);
            timeout = process.env.BLINKPAY_TIMEOUT
                ? process.env.BLINKPAY_TIMEOUT
                : (config && config.blinkpay && config.blinkpay.timeout) || 10000;
            // Handle retryEnabled with proper boolean logic
            if (process.env.BLINKPAY_RETRY_ENABLED !== undefined) {
                retryEnabled = process.env.BLINKPAY_RETRY_ENABLED;
            } else if (config && config.blinkpay && config.blinkpay.retryEnabled !== undefined) {
                retryEnabled = config.blinkpay.retryEnabled;
            } else {
                retryEnabled = true;
            }
            this.clientId = process.env.BLINKPAY_CLIENT_ID
                ? process.env.BLINKPAY_CLIENT_ID
                : (config && config.blinkpay && config.blinkpay.clientId);
            this.clientSecret = process.env.BLINKPAY_CLIENT_SECRET
                ? process.env.BLINKPAY_CLIENT_SECRET
                : (config && config.blinkpay && config.blinkpay.clientSecret);
        } else {
            // Browser environment detected - only allow if config is explicitly provided
            // This supports SSR scenarios like Next.js API routes where window exists but code runs server-side
            if (!config || typeof config !== 'object') {
                throw new BlinkInvalidValueException(
                    "Blink Debit SDK detected browser environment. " +
                    "This SDK must only be used server-side (Node.js backend, Next.js API routes, etc.). " +
                    "NEVER expose client credentials in frontend JavaScript. " +
                    "If you are in a server-side rendering context, ensure you pass the config object explicitly."
                );
            }

            this.debitUrl = config.blinkpay.debitUrl;
            timeout = config.blinkpay.timeout;
            retryEnabled = config.blinkpay.retryEnabled;
            this.clientId = config.blinkpay.clientId;
            this.clientSecret = config.blinkpay.clientSecret;
        }

        // validate required fields
        if (!this.debitUrl) {
            throw new BlinkInvalidValueException("Blink Debit URL is not configured");
        }

        if (!this.clientId) {
            throw new BlinkInvalidValueException("Blink Debit client ID is not configured");
        }

        if (!this.clientSecret) {
            throw new BlinkInvalidValueException("Blink Debit client secret is not configured");
        }

        // configure base path
        this.basePath = this.debitUrl + '/payments/v1';

        // configure timeout, defaults to 10,000 milliseconds
        this._timeout = Number(timeout);
        if (isNaN(this._timeout)) {
            this._timeout = 10000;
        }

        // configure retry flag
        if (typeof retryEnabled === 'boolean') {
            this._retryEnabled = retryEnabled;
        } else if (typeof retryEnabled === 'string') {
            this._retryEnabled = retryEnabled.toLowerCase() === 'true';
        } else {
            this._retryEnabled = true;
        }

        // Initialize expiration date to epoch 0 to force initial token refresh
        this.expirationDate = new Date(0);

        // Store axios instance and initialize TokenAPI
        this._axios = axios;
        this._tokenApi = new TokenAPI(axios, this);

        this.configureAxios(axios);
        this.configureRetry();
    }

    /**
     * Get the TokenAPI instance for token management
     *
     * @returns {TokenAPI} The TokenAPI instance
     */
    get tokenApi(): TokenAPI {
        return this._tokenApi;
    }

    private configureAxios(axios: AxiosInstance) {
        // configure timeout
        axios.defaults.timeout = this._timeout;

        // intercept request
        axios.interceptors.request.use(request => {
            log.debug(`Outbound request: ${request.method.toUpperCase()} ${request.url}`);

            const headers = Configuration.sanitiseHeaders({...request.headers});
            log.debug(`Headers: ${JSON.stringify(headers)}`);

            if (request.params) {
                log.debug(`Parameters: ${qs.stringify(request.params, {arrayFormat: 'brackets'})}`);
            }

            if (request.data) {
                request.data = decamelizeKeys(request.data);

                const data = {...request.data};
                if (data.client_secret) {
                    data.client_secret = '***REDACTED CLIENT SECRET***';
                }
                // Request data may contain sensitive payment info - debug level only
                log.debug(`Data: ${qs.stringify(data, {arrayFormat: 'brackets'})}`);
            }

            return request;
        });

        // intercept response
        axios.interceptors.response.use(response => {
            log.debug('Inbound response: ' + response.status + ' ' + response.statusText);

            log.debug(`Headers: ${JSON.stringify(response.headers)}`);

            if (response.data) {
                response.data = camelizeKeys(response.data);
                log.debug(`Data: ${qs.stringify(response.data, {arrayFormat: 'brackets'})}`);
            }

            return response;
        }, error => {
            if (error.response === undefined) {
                return Promise.reject(error);
            }
            const status = error.response.status;
            const headers = error.response.headers;
            const body = error.response.data ? error.response.data : { message: error.message };
            switch (status) {
                case 401:
                    // Auto-retry with token refresh - debug level (expected, will be retried)
                    log.debug(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkUnauthorisedException(body.message);
                case 403:
                    // Business logic/permissions issue - warn level (may need developer action)
                    log.warn(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkForbiddenException(body.message);
                case 404:
                    // Expected condition (resource check) - debug level
                    log.debug(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkResourceNotFoundException(body.message);
                case 408:
                    // Client timeout - error level (critical, NOT retried)
                    log.error(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkRequestTimeoutException(body.message);
                case 422:
                    // Client input validation error - warn level (developer needs to fix input)
                    log.warn(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkInvalidValueException(body.message);
                case 429:
                    // Rate limit - warn level (will be retried with backoff)
                    log.warn(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkRateLimitExceededException(body.message);
                case 501:
                    // Not implemented - error level (SDK/API version mismatch)
                    log.error(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkNotImplementedException(body.message);
                case 502:
                    // Bad gateway - error level (server error, will be retried)
                    log.error(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                    throw new BlinkServiceException(`Service call to Blink Debit failed with error: ${body.message}, please contact BlinkPay with the correlation ID: ${headers['x-correlation-id']}`);
                default:
                    if (status >= 400 && status < 500) {
                        // Other 4xx client errors - warn level
                        log.warn(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                        throw new BlinkClientException(body.message);
                    } else if (status >= 500) {
                        // Server errors - error level (critical, will be retried)
                        log.error(`Status Code: ${status}\nHeaders: ${JSON.stringify(headers)}\nBody: ${body.message}`);
                        throw new BlinkRetryableException(body.message);
                    }
            }
        });
    }

    /**
     * Configure retry policy for the Axios instance.
     *
     * Note: The Cockatiel retry policy configured here is ONLY used by the polling helper methods
     * (awaitSuccessfulConsentStatus, awaitSuccessfulPaymentStatus, awaitSuccessfulRefundStatus).
     * It is NOT used for regular API calls, which handle their own retries via executeWithRetry().
     *
     * @private
     */
    private configureRetry() {
        if (!this._retryEnabled) {
            return;
        }

        this.retryPolicy = retry(handleType(BlinkRetryableException), {
            maxAttempts: 2,
            backoff: new ExponentialBackoff({
                maxDelay: 10000,      // 10 seconds maximum
                initialDelay: 1000,   // Start with 1 second
                exponent: 2
            })
        });
    }

    private static sanitiseHeaders(headers: Record<string, any>): Record<string, string> {
        const AUTHORIZATION = 'Authorization';
        const authorization = headers[AUTHORIZATION] || headers['authorization'];
        if (authorization && authorization.trim() !== '') {
            headers[AUTHORIZATION] = '***REDACTED BEARER TOKEN***';
        }

        return headers;
    }

}
