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

import {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import {Configuration} from '../../../configuration.js';
import {BaseAPI, RequestArgs} from '../../../base.js';
import {CreateQuickPaymentResponse, QuickPaymentRequest, QuickPaymentResponse} from '../../dto/index.js';
import {decamelizeKeys} from 'humps';
import {BlinkInvalidValueException} from '../../exceptions/index.js';
import {GenericParameters} from "../../util/types.js";
import {buildRequestHeaders} from "../../util/helper.js";
import {executeWithRetry} from "../../util/retry-helper.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * QuickPaymentsApi - axios parameter creator
 *
 * @export
 */
export const QuickPaymentsApiAxiosParamCreator = function (axios: AxiosInstance, configuration?: Configuration) {
    if (!axios) {
        throw new BlinkInvalidValueException("Axios instance is required");
    }

    return {
        /**
         * Create a quick payment, which both obtains the consent and debits the requested one-off payment.  This endpoint begins the customer consent process. Once the consent is authorised, Blink automatically attempts to debit the payment.  A successful response does **not** indicate a successful debit. The payment status can be checked by subsequent calls to the single payment endpoint.
         * @summary Create Quick Payment
         * @param {QuickPaymentRequest} [body] The single payment request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        createQuickPayment: async (body: QuickPaymentRequest, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, idempotencyKey, options} = params;
            const localVarPath = `/quick-payments`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }
            const localVarRequestOptions: AxiosRequestConfig = {method: 'POST', ...baseOptions, ...options};
            const localVarHeaderParameter = buildRequestHeaders({
                requestId,
                xCorrelationId,
                xCustomerIp,
                xCustomerUserAgent,
                idempotencyKey
            });
            const localVarQueryParameter: Record<string, string> = {};

            // authentication Bearer required
            // oauth required
            await configuration.tokenApi.getAccessToken();
            if (configuration && configuration.accessToken) {
                const localVarAccessTokenValue = typeof configuration.accessToken === 'function'
                        ? await configuration.accessToken("Bearer", ["create:single_consent", "view:single_consent", "revoke:single_consent", "create:enduring_consent", "view:enduring_consent", "revoke:enduring_consent", "create:payment", "view:payment", "view:metadata", "view:transaction", "create:quick_payment", "view:quick_payment", "create:refund", "view:refund"])
                        : await configuration.accessToken;
                localVarHeaderParameter["Authorization"] = `Bearer ${localVarAccessTokenValue}`;
            }

            localVarHeaderParameter['Content-Type'] = 'application/json';

            const query = new URLSearchParams(localVarUrlObj.search);
            for (const key in localVarQueryParameter) {
                query.set(key, localVarQueryParameter[key]);
            }
            for (const key in options?.params) {
                query.set(key, options.params[key]);
            }
            localVarUrlObj.search = (new URLSearchParams(query)).toString();
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options?.headers};
            const needsSerialization = (typeof body !== "string") || localVarRequestOptions.headers['Content-Type'] === 'application/json';
            localVarRequestOptions.data = needsSerialization ? JSON.stringify(body !== undefined ? decamelizeKeys(body) : {}) : (decamelizeKeys(body) || "");

            return {
                url: localVarUrlObj.pathname + localVarUrlObj.search + localVarUrlObj.hash,
                options: localVarRequestOptions,
            };
        },
        /**
         * Get a quick payment by ID.
         * @summary Get Quick Payment
         * @param {string} quickPaymentId The quick payment ID
         * @param {GenericParameters} params the generic parameters
         */
        getQuickPayment: async (quickPaymentId: string, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            // verify required parameter 'quickPaymentId' is not null or undefined
            if (quickPaymentId === null || quickPaymentId === undefined) {
                throw new BlinkInvalidValueException('Required parameter quickPaymentId was null or undefined when calling getQuickPayment.');
            }
            const localVarPath = `/quick-payments/{quick_payment_id}`
                    .replace(`{${"quick_payment_id"}}`, encodeURIComponent(String(quickPaymentId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }
            const localVarRequestOptions: AxiosRequestConfig = {method: 'GET', ...baseOptions, ...options};
            const localVarHeaderParameter = buildRequestHeaders({
                requestId,
                xCorrelationId,
                xCustomerIp,
                xCustomerUserAgent
            });
            const localVarQueryParameter: Record<string, string> = {};

            // authentication Bearer required
            // oauth required
            await configuration.tokenApi.getAccessToken();
            if (configuration && configuration.accessToken) {
                const localVarAccessTokenValue = typeof configuration.accessToken === 'function'
                        ? await configuration.accessToken("Bearer", ["create:single_consent", "view:single_consent", "revoke:single_consent", "create:enduring_consent", "view:enduring_consent", "revoke:enduring_consent", "create:payment", "view:payment", "view:metadata", "view:transaction", "create:quick_payment", "view:quick_payment", "create:refund", "view:refund"])
                        : await configuration.accessToken;
                localVarHeaderParameter["Authorization"] = `Bearer ${localVarAccessTokenValue}`;
            }

            const query = new URLSearchParams(localVarUrlObj.search);
            for (const key in localVarQueryParameter) {
                query.set(key, localVarQueryParameter[key]);
            }
            for (const key in options?.params) {
                query.set(key, options.params[key]);
            }
            localVarUrlObj.search = (new URLSearchParams(query)).toString();
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options?.headers};

            return {
                url: localVarUrlObj.pathname + localVarUrlObj.search + localVarUrlObj.hash,
                options: localVarRequestOptions,
            };
        },
        /**
         * Revoke an existing (unpaid) quick payment by ID.  The quick payment cannot be revoked if the payment has already been made.
         * @summary Revoke Quick Payment
         * @param {string} quickPaymentId The quick payment ID
         * @param {GenericParameters} params the generic parameters
         */
        revokeQuickPayment: async (quickPaymentId: string, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            // verify required parameter 'quickPaymentId' is not null or undefined
            if (quickPaymentId === null || quickPaymentId === undefined) {
                throw new BlinkInvalidValueException('Required parameter quickPaymentId was null or undefined when calling revokeQuickPayment.');
            }
            const localVarPath = `/quick-payments/{quick_payment_id}`
                    .replace(`{${"quick_payment_id"}}`, encodeURIComponent(String(quickPaymentId)));
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            let baseOptions;
            if (configuration) {
                baseOptions = configuration.baseOptions;
            }
            const localVarRequestOptions: AxiosRequestConfig = {method: 'DELETE', ...baseOptions, ...options};
            const localVarHeaderParameter = buildRequestHeaders({
                requestId,
                xCorrelationId,
                xCustomerIp,
                xCustomerUserAgent
            });
            const localVarQueryParameter: Record<string, string> = {};

            // authentication Bearer required
            // oauth required
            await configuration.tokenApi.getAccessToken();
            if (configuration && configuration.accessToken) {
                const localVarAccessTokenValue = typeof configuration.accessToken === 'function'
                        ? await configuration.accessToken("Bearer", ["create:single_consent", "view:single_consent", "revoke:single_consent", "create:enduring_consent", "view:enduring_consent", "revoke:enduring_consent", "create:payment", "view:payment", "view:metadata", "view:transaction", "create:quick_payment", "view:quick_payment", "create:refund", "view:refund"])
                        : await configuration.accessToken;
                localVarHeaderParameter["Authorization"] = `Bearer ${localVarAccessTokenValue}`;
            }

            const query = new URLSearchParams(localVarUrlObj.search);
            for (const key in localVarQueryParameter) {
                query.set(key, localVarQueryParameter[key]);
            }
            for (const key in options?.params) {
                query.set(key, options.params[key]);
            }
            localVarUrlObj.search = (new URLSearchParams(query)).toString();
            let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
            localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options?.headers};

            return {
                url: localVarUrlObj.pathname + localVarUrlObj.search + localVarUrlObj.hash,
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * QuickPaymentsApi - functional programming interface
 * @export
 */
export const QuickPaymentsApiFp = function (axios: AxiosInstance, configuration?: Configuration) {
    return {
        /**
         * Create a quick payment, which both obtains the consent and debits the requested one-off payment.  This endpoint begins the customer consent process. Once the consent is authorised, Blink automatically attempts to debit the payment.  A successful response does **not** indicate a successful debit. The payment status can be checked by subsequent calls to the single payment endpoint.
         * @summary Create Quick Payment
         * @param {QuickPaymentRequest} [body] The single payment request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        async createQuickPayment(body: QuickPaymentRequest, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<CreateQuickPaymentResponse>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();
            const idempotencyKey = params.idempotencyKey || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId, idempotencyKey };
            const localVarAxiosArgs = await QuickPaymentsApiAxiosParamCreator(axios, configuration).createQuickPayment(body, paramsWithIds);

            return (axios: AxiosInstance, basePath: string = configuration.basePath) => {
                const axiosRequestArgs: AxiosRequestConfig = {
                    ...localVarAxiosArgs.options,
                    url: basePath + localVarAxiosArgs.url
                };
                return executeWithRetry(
                    () => axios.request(axiosRequestArgs),
                    configuration,
                    { attemptNumber: 0, requestId, correlationId, idempotencyKey }
                );
            };
        },
        /**
         * Get a quick payment by ID.
         * @summary Get Quick Payment
         * @param {string} quickPaymentId The quick payment ID
         * @param {GenericParameters} params the generic parameters
         */
        async getQuickPayment(quickPaymentId: string, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<QuickPaymentResponse>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await QuickPaymentsApiAxiosParamCreator(axios, configuration).getQuickPayment(quickPaymentId, paramsWithIds);

            return (axios: AxiosInstance, basePath: string = configuration.basePath) => {
                const axiosRequestArgs: AxiosRequestConfig = {
                    ...localVarAxiosArgs.options,
                    url: basePath + localVarAxiosArgs.url
                };
                return executeWithRetry(
                    () => axios.request(axiosRequestArgs),
                    configuration,
                    { attemptNumber: 0, requestId, correlationId }
                );
            };
        },
        /**
         * Revoke an existing (unpaid) quick payment by ID.  The quick payment cannot be revoked if the payment has already been made.
         * @summary Revoke Quick Payment
         * @param {string} quickPaymentId The quick payment ID
         * @param {GenericParameters} params the generic parameters
         */
        async revokeQuickPayment(quickPaymentId: string, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<void>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await QuickPaymentsApiAxiosParamCreator(axios, configuration).revokeQuickPayment(quickPaymentId, paramsWithIds);

            return (axios: AxiosInstance, basePath: string = configuration.basePath) => {
                const axiosRequestArgs: AxiosRequestConfig = {
                    ...localVarAxiosArgs.options,
                    url: basePath + localVarAxiosArgs.url
                };
                return executeWithRetry(
                    () => axios.request(axiosRequestArgs),
                    configuration,
                    { attemptNumber: 0, requestId, correlationId }
                );
            };
        },
    }
};

/**
 * QuickPaymentsApi - factory interface
 * @export
 */
export const QuickPaymentsApiFactory = function (axios: AxiosInstance, configuration?: Configuration, basePath?: string) {
    return {
        /**
         * Create a quick payment, which both obtains the consent and debits the requested one-off payment.  This endpoint begins the customer consent process. Once the consent is authorised, Blink automatically attempts to debit the payment.  A successful response does **not** indicate a successful debit. The payment status can be checked by subsequent calls to the single payment endpoint.
         * @summary Create Quick Payment
         * @param {QuickPaymentRequest} [body] The single payment request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        async createQuickPayment(body: QuickPaymentRequest, params: GenericParameters = {}): Promise<AxiosResponse<CreateQuickPaymentResponse>> {
            return QuickPaymentsApiFp(axios, configuration).createQuickPayment(body, params).then((request) => request(axios, basePath));
        },
        /**
         * Get a quick payment by ID.
         * @summary Get Quick Payment
         * @param {string} quickPaymentId The quick payment ID
         * @param {GenericParameters} params the generic parameters
         */
        async getQuickPayment(quickPaymentId: string, params: GenericParameters = {}): Promise<AxiosResponse<QuickPaymentResponse>> {
            return QuickPaymentsApiFp(axios, configuration).getQuickPayment(quickPaymentId, params).then((request) => request(axios, basePath));
        },
        /**
         * Revoke an existing (unpaid) quick payment by ID.  The quick payment cannot be revoked if the payment has already been made.
         * @summary Revoke Quick Payment
         * @param {string} quickPaymentId The quick payment ID
         * @param {GenericParameters} params the generic parameters
         */
        async revokeQuickPayment(quickPaymentId: string, params: GenericParameters = {}): Promise<AxiosResponse<void>> {
            return QuickPaymentsApiFp(axios, configuration).revokeQuickPayment(quickPaymentId, params).then((request) => request(axios, basePath));
        },
    };
};

/**
 * QuickPaymentsApi - object-oriented interface
 * @export
 * @class QuickPaymentsApi
 * @extends {BaseAPI}
 */
export class QuickPaymentsApi extends BaseAPI {
    /**
     * Create a quick payment, which both obtains the consent and debits the requested one-off payment.  This endpoint begins the customer consent process. Once the consent is authorised, Blink automatically attempts to debit the payment.  A successful response does **not** indicate a successful debit. The payment status can be checked by subsequent calls to the single payment endpoint.
     * @summary Create Quick Payment
     * @param {QuickPaymentRequest} [body] The single payment request parameters.
     * @param {GenericParameters} params the generic parameters
     * @memberof QuickPaymentsApi
     */
    public async createQuickPayment(body: QuickPaymentRequest, params: GenericParameters = {}): Promise<AxiosResponse<CreateQuickPaymentResponse>> {
        return QuickPaymentsApiFp(this.axios, this.configuration).createQuickPayment(body, params).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get a quick payment by ID.
     * @summary Get Quick Payment
     * @param {string} quickPaymentId The quick payment ID
     * @param {GenericParameters} params the generic parameters
     * @memberof QuickPaymentsApi
     */
    public async getQuickPayment(quickPaymentId: string, params: GenericParameters = {}): Promise<AxiosResponse<QuickPaymentResponse>> {
        return QuickPaymentsApiFp(this.axios, this.configuration).getQuickPayment(quickPaymentId, params).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Revoke an existing (unpaid) quick payment by ID.  The quick payment cannot be revoked if the payment has already been made.
     * @summary Revoke Quick Payment
     * @param {string} quickPaymentId The quick payment ID
     * @param {GenericParameters} params the generic parameters
     * @memberof QuickPaymentsApi
     */
    public async revokeQuickPayment(quickPaymentId: string, params: GenericParameters = {}): Promise<AxiosResponse<void>> {
        return QuickPaymentsApiFp(this.axios, this.configuration).revokeQuickPayment(quickPaymentId, params).then((request) => request(this.axios, this.basePath));
    }
}
