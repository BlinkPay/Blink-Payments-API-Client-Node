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
import {Refund, RefundDetail, RefundResponse} from '../../dto/index.js';
import {decamelizeKeys} from 'humps';
import {BlinkInvalidValueException} from '../../exceptions/index.js';
import {GenericParameters} from "../../util/types.js";
import {buildRequestHeaders} from "../../util/helper.js";
import {executeWithRetry} from "../../util/retry-helper.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * RefundsApi - axios parameter creator
 *
 * @export
 */
export const RefundsApiAxiosParamCreator = function (axios: AxiosInstance, configuration?: Configuration) {
    if (!axios) {
        throw new BlinkInvalidValueException("Axios instance is required");
    }

    return {
        /**
         * Create a request for refund.  Multiple money-transfer refunds can be processed against one payment, but for no greater than the total value of the payment.  **For money transfer refunds, a 201 response does not indicate that the refund has been processed successfully. The status needs to be subsequently checked using the GET endpoint**
         * @summary Create Refund
         * @param {RefundDetail} [body] The particulars of the refund request.

         In the case of money transfers, PCR is included to provide reference details to the customers bank account about the refund.

         Amount can be included if the type is a &#x60;partial_refund&#x60;.
         * @param {GenericParameters} params the generic parameters
         */
        createRefund: async (body: RefundDetail, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            const localVarPath = `/refunds`;
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
         * Get refund by ID.
         * @summary Get Refund
         * @param {string} refundId The refund ID
         * @param {GenericParameters} params the generic parameters
         */
        getRefund: async (refundId: string, params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            // verify required parameter 'refundId' is not null or undefined
            if (refundId === null || refundId === undefined) {
                throw new BlinkInvalidValueException('Required parameter refundId was null or undefined when calling getRefund.');
            }
            const localVarPath = `/refunds/{refund_id}`
                    .replace(`{${"refund_id"}}`, encodeURIComponent(String(refundId)));
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
    }
};

/**
 * RefundsApi - functional programming interface
 * @export
 */
export const RefundsApiFp = function (axios: AxiosInstance, configuration?: Configuration) {
    return {
        /**
         * Create a request for refund.  Multiple money-transfer refunds can be processed against one payment, but for no greater than the total value of the payment.  **For money transfer refunds, a 201 response does not indicate that the refund has been processed successfully. The status needs to be subsequently checked using the GET endpoint**
         * @summary Create Refund
         * @param {RefundDetail} [body] The particulars of the refund request.

         In the case of money transfers, PCR is included to provide reference details to the customers bank account about the refund.

         Amount can be included if the type is a &#x60;partial_refund&#x60;.
         @param {GenericParameters} params the generic parameters
         */
        async createRefund(body: RefundDetail, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<RefundResponse>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await RefundsApiAxiosParamCreator(axios, configuration).createRefund(body, paramsWithIds);

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
         * Get refund by ID.
         * @summary Get Refund
         * @param {string} refundId The refund ID
         * @param {GenericParameters} params the generic parameters
         */
        async getRefund(refundId: string, params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<Refund>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await RefundsApiAxiosParamCreator(axios, configuration).getRefund(refundId, paramsWithIds);

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
 * RefundsApi - factory interface
 * @export
 */
export const RefundsApiFactory = function (axios: AxiosInstance, configuration?: Configuration, basePath?: string) {
    return {
        /**
         * Create a request for refund.  Multiple money-transfer refunds can be processed against one payment, but for no greater than the total value of the payment.  **For money transfer refunds, a 201 response does not indicate that the refund has been processed successfully. The status needs to be subsequently checked using the GET endpoint**
         * @summary Create Refund
         * @param {RefundDetail} [body] The particulars of the refund request.

         In the case of money transfers, PCR is included to provide reference details to the customers bank account about the refund.

         Amount can be included if the type is a &#x60;partial_refund&#x60;.
         @param {GenericParameters} params the generic parameters
         */
        async createRefund(body: RefundDetail, params: GenericParameters = {}): Promise<AxiosResponse<RefundResponse>> {
            return RefundsApiFp(axios, configuration).createRefund(body, params).then((request) => request(axios, basePath));
        },
        /**
         * Get refund by ID.
         * @summary Get Refund
         * @param {string} refundId The refund ID
         * @param {GenericParameters} params the generic parameters
         */
        async getRefund(refundId: string, params: GenericParameters = {}): Promise<AxiosResponse<Refund>> {
            return RefundsApiFp(axios, configuration).getRefund(refundId, params).then((request) => request(axios, basePath));
        },
    };
};

/**
 * RefundsApi - object-oriented interface
 * @export
 * @class RefundsApi
 * @extends {BaseAPI}
 */
export class RefundsApi extends BaseAPI {
    /**
     * Create a request for refund.  Multiple money-transfer refunds can be processed against one payment, but for no greater than the total value of the payment.  **For money transfer refunds, a 201 response does not indicate that the refund has been processed successfully. The status needs to be subsequently checked using the GET endpoint**
     * @summary Create Refund
     * @param {RefundDetail} [body] The particulars of the refund request.

     In the case of money transfers, PCR is included to provide reference details to the customers bank account about the refund.

     Amount can be included if the type is a &#x60;partial_refund&#x60;.
     @param {GenericParameters} params the generic parameters
     * @memberof RefundsApi
     */
    public async createRefund(body: RefundDetail, params: GenericParameters = {}): Promise<AxiosResponse<RefundResponse>> {
        return RefundsApiFp(this.axios, this.configuration).createRefund(body, params).then((request) => request(this.axios, this.basePath));
    }

    /**
     * Get refund by ID.
     * @summary Get Refund
     * @param {string} refundId The refund ID
     * @param {GenericParameters} params the generic parameters
     * @memberof RefundsApi
     */
    public async getRefund(refundId: string, params: GenericParameters = {}): Promise<AxiosResponse<Refund>> {
        return RefundsApiFp(this.axios, this.configuration).getRefund(refundId, params).then((request) => request(this.axios, this.basePath));
    }
}
