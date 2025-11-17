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
import {Consent, CreateConsentResponse, EnduringConsentRequest} from '../../dto/index.js';
import {decamelizeKeys} from 'humps';
import {BlinkInvalidValueException} from '../../exceptions/index.js';
import {GenericParameters} from "../../util/types.js";
import {buildRequestHeaders} from "../../util/helper.js";
import {executeWithRetry} from "../../util/retry-helper.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * EnduringConsentsApi - axios parameter creator
 *
 * @export
 */
export const EnduringConsentsApiAxiosParamCreator = function (axios: AxiosInstance, configuration?: Configuration) {
    if (!axios) {
        throw new BlinkInvalidValueException("Axios instance is required");
    }

    return {
        /**
         * Create an enduring consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
         * @summary Create Enduring Consent
         * @param {EnduringConsentRequest} [body] The consent request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        createEnduringConsent: async (body: EnduringConsentRequest, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, idempotencyKey, options} = params;
            const localVarPath = `/enduring-consents`;
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
         * Get an existing consent by ID.
         * @summary Get Enduring Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        getEnduringConsent: async (consentId: string, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            // verify required parameter 'consentId' is not null or undefined
            if (consentId === null || consentId === undefined) {
                throw new BlinkInvalidValueException('Required parameter consentId was null or undefined when calling getEnduringConsent.');
            }
            const localVarPath = `/enduring-consents/{consent_id}`
                    .replace(`{${"consent_id"}}`, encodeURIComponent(String(consentId)));
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
         * Revoke an existing consent by ID.
         * @summary Revoke Enduring Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        revokeEnduringConsent: async (consentId: string, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            // verify required parameter 'consentId' is not null or undefined
            if (consentId === null || consentId === undefined) {
                throw new BlinkInvalidValueException('Required parameter consentId was null or undefined when calling revokeEnduringConsent.');
            }
            const localVarPath = `/enduring-consents/{consent_id}`
                    .replace(`{${"consent_id"}}`, encodeURIComponent(String(consentId)));
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
 * EnduringConsentsApi - functional programming interface
 * @export
 */
export const EnduringConsentsApiFp = function (axios: AxiosInstance, configuration?: Configuration) {
    return {
        /**
         * Create an enduring consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
         * @summary Create Enduring Consent
         * @param {EnduringConsentRequest} [body] The consent request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        async createEnduringConsent(body: EnduringConsentRequest, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<CreateConsentResponse>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();
            const idempotencyKey = params.idempotencyKey || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId, idempotencyKey };
            const localVarAxiosArgs = await EnduringConsentsApiAxiosParamCreator(axios, configuration).createEnduringConsent(body, paramsWithIds);

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
         * Get an existing consent by ID.
         * @summary Get Enduring Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async getEnduringConsent(consentId: string, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<Consent>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await EnduringConsentsApiAxiosParamCreator(axios, configuration).getEnduringConsent(consentId, paramsWithIds);

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
         * Revoke an existing consent by ID.
         * @summary Revoke Enduring Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async revokeEnduringConsent(consentId: string, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<void>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await EnduringConsentsApiAxiosParamCreator(axios, configuration).revokeEnduringConsent(consentId, paramsWithIds);

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
 * EnduringConsentsApi - factory interface
 * @export
 */
export const EnduringConsentsApiFactory = function (axios: AxiosInstance, configuration?: Configuration, basePath?: string) {
    return {
        /**
         * Create an enduring consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
         * @summary Create Enduring Consent
         * @param {EnduringConsentRequest} [body] The consent request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        async createEnduringConsent(body: EnduringConsentRequest, params: GenericParameters = {}): Promise<AxiosResponse<CreateConsentResponse>> {
            return EnduringConsentsApiFp(axios, configuration).createEnduringConsent(body, params).then((request) => request(axios, basePath));
        },
        /**
         * Get an existing consent by ID.
         * @summary Get Enduring Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async getEnduringConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<Consent>> {
            return EnduringConsentsApiFp(axios, configuration).getEnduringConsent(consentId, params).then((request) => request(axios, basePath));
        },
        /**
         * Revoke an existing consent by ID.
         * @summary Revoke Enduring Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async revokeEnduringConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<void>> {
            return EnduringConsentsApiFp(axios, configuration).revokeEnduringConsent(consentId, params).then((request) => request(axios, basePath));
        },
    };
};

/**
 * EnduringConsentsApi - object-oriented interface
 * @export
 * @class EnduringConsentsApi
 * @extends {BaseAPI}
 */
export class EnduringConsentsApi extends BaseAPI {
    /**
     * Create an enduring consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
     * @summary Create Enduring Consent
     * @param {EnduringConsentRequest} [body] The consent request parameters.
     * @param {GenericParameters} params the generic parameters
     * @memberof EnduringConsentsApi
     */
    public async createEnduringConsent(body: EnduringConsentRequest, params: GenericParameters = {}): Promise<AxiosResponse<CreateConsentResponse>> {
        return EnduringConsentsApiFp(this.axios, this.configuration).createEnduringConsent(body, params).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get an existing consent by ID.
     * @summary Get Enduring Consent
     * @param {string} consentId The consent ID
     * @param {GenericParameters} params the generic parameters
     * @memberof EnduringConsentsApi
     */
    public async getEnduringConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<Consent>> {
        return EnduringConsentsApiFp(this.axios, this.configuration).getEnduringConsent(consentId, params).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Revoke an existing consent by ID.
     * @summary Revoke Enduring Consent
     * @param {string} consentId The consent ID
     * @param {GenericParameters} params the generic parameters
     * @memberof EnduringConsentsApi
     */
    public async revokeEnduringConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<void>> {
        return EnduringConsentsApiFp(this.axios, this.configuration).revokeEnduringConsent(consentId, params).then((request) => request(this.axios, this.basePath));
    }
}
