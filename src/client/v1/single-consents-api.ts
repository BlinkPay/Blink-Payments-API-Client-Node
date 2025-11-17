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
import {Consent, CreateConsentResponse, SingleConsentRequest} from '../../dto/index.js';
import {decamelizeKeys} from 'humps';
import {BlinkInvalidValueException} from '../../exceptions/index.js';
import {GenericParameters} from "../../util/types.js";
import {buildRequestHeaders} from "../../util/helper.js";
import {executeWithRetry} from "../../util/retry-helper.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * SingleConsentsApi - axios parameter creator
 *
 * @export
 */
export const SingleConsentsApiAxiosParamCreator = function (axios: AxiosInstance, configuration?: Configuration) {
    if (!axios) {
        throw new BlinkInvalidValueException("Axios instance is required");
    }

    return {
        /**
         * Create a single payment consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
         * @summary Create Single Consent
         * @param {SingleConsentRequest} [body] The consent request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        createSingleConsent: async (body: SingleConsentRequest, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, idempotencyKey, options} = params;
            const localVarPath = `/single-consents`;
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
         * @summary Get Single Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        getSingleConsent: async (consentId: string, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            // verify required parameter 'consentId' is not null or undefined
            if (consentId === null || consentId === undefined) {
                throw new BlinkInvalidValueException('Required parameter consentId was null or undefined when calling getSingleConsent.');
            }
            const localVarPath = `/single-consents/{consent_id}`
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
         * @summary Revoke Single Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        revokeSingleConsent: async (consentId: string, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            // verify required parameter 'consentId' is not null or undefined
            if (consentId === null || consentId === undefined) {
                throw new BlinkInvalidValueException('Required parameter consentId was null or undefined when calling revokeSingleConsent.');
            }
            const localVarPath = `/single-consents/{consent_id}`
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
 * SingleConsentsApi - functional programming interface
 * @export
 */
export const SingleConsentsApiFp = function (axios: AxiosInstance, configuration?: Configuration) {
    return {
        /**
         * Create a single payment consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
         * @summary Create Single Consent
         * @param {SingleConsentRequest} [body] The consent request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        async createSingleConsent(body: SingleConsentRequest, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<CreateConsentResponse>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();
            const idempotencyKey = params.idempotencyKey || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId, idempotencyKey };
            const localVarAxiosArgs = await SingleConsentsApiAxiosParamCreator(axios, configuration).createSingleConsent(body, paramsWithIds);

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
         * @summary Get Single Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async getSingleConsent(consentId: string, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<Consent>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await SingleConsentsApiAxiosParamCreator(axios, configuration).getSingleConsent(consentId, paramsWithIds);

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
         * @summary Revoke Single Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async revokeSingleConsent(consentId: string, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<void>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await SingleConsentsApiAxiosParamCreator(axios, configuration).revokeSingleConsent(consentId, paramsWithIds);

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
 * SingleConsentsApi - factory interface
 * @export
 */
export const SingleConsentsApiFactory = function (axios: AxiosInstance, configuration?: Configuration, basePath?: string) {
    return {
        /**
         * Create a single payment consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
         * @summary Create Single Consent
         * @param {SingleConsentRequest} [body] The consent request parameters.
         * @param {GenericParameters} params the generic parameters
         */
        async createSingleConsent(body: SingleConsentRequest, params: GenericParameters = {}): Promise<AxiosResponse<CreateConsentResponse>> {
            return SingleConsentsApiFp(axios, configuration).createSingleConsent(body, params).then((request) => request(axios, basePath));
        },
        /**
         * Get an existing consent by ID.
         * @summary Get Single Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async getSingleConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<Consent>> {
            return SingleConsentsApiFp(axios, configuration).getSingleConsent(consentId, params).then((request) => request(axios, basePath));
        },
        /**
         * Revoke an existing consent by ID.
         * @summary Revoke Single Consent
         * @param {string} consentId The consent ID
         * @param {GenericParameters} params the generic parameters
         */
        async revokeSingleConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<void>> {
            return SingleConsentsApiFp(axios, configuration).revokeSingleConsent(consentId, params).then((request) => request(axios, basePath));
        },
    };
};

/**
 * SingleConsentsApi - object-oriented interface
 * @export
 * @class SingleConsentsApi
 * @extends {BaseAPI}
 */
export class SingleConsentsApi extends BaseAPI {
    /**
     * Create a single payment consent request with the bank that will go to the customer for approval.  A successful response does not indicate a completed consent. The status of the consent can be subsequently checked with the consent ID.
     * @summary Create Single Consent
     * @param {SingleConsentRequest} [body] The consent request parameters.
     * @param {GenericParameters} params the generic parameters
     * @memberof SingleConsentsApi
     */
    public async createSingleConsent(body: SingleConsentRequest, params: GenericParameters = {}): Promise<AxiosResponse<CreateConsentResponse>> {
        return SingleConsentsApiFp(this.axios, this.configuration).createSingleConsent(body, params).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get an existing consent by ID.
     * @summary Get Single Consent
     * @param {string} consentId The consent ID
     * @param {GenericParameters} params the generic parameters
     * @memberof SingleConsentsApi
     */
    public async getSingleConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<Consent>> {
        return SingleConsentsApiFp(this.axios, this.configuration).getSingleConsent(consentId, params).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Revoke an existing consent by ID.
     * @summary Revoke Single Consent
     * @param {string} consentId The consent ID
     * @param {GenericParameters} params the generic parameters
     * @memberof SingleConsentsApi
     */
    public async revokeSingleConsent(consentId: string, params: GenericParameters = {}): Promise<AxiosResponse<void>> {
        return SingleConsentsApiFp(this.axios, this.configuration).revokeSingleConsent(consentId, params).then((request) => request(this.axios, this.basePath));
    }
}
