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
import {BankMetadata} from '../../dto/index.js';
import {BlinkInvalidValueException} from "../../exceptions/index.js";
import {GenericParameters} from "../../util/types.js";
import {buildRequestHeaders} from "../../util/helper.js";
import {executeWithRetry} from "../../util/retry-helper.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * BankMetadataApi - axios parameter creator
 *
 * @export
 */
export const BankMetadataApiAxiosParamCreator = function (axios: AxiosInstance, configuration?: Configuration) {
    if (!axios) {
        throw new BlinkInvalidValueException("Axios instance is required");
    }

    return {
        /**
         * The available banks, features available for the banks, and relevant fields.
         * @summary Get Bank Metadata
         * @param {GenericParameters} params the generic parameters
         */
        getMeta: async (params: GenericParameters = {}): Promise<RequestArgs> => {
            const {requestId, xCorrelationId, xCustomerIp, xCustomerUserAgent, options} = params;
            const localVarPath = `/meta`;
            // use dummy base URL string because the URL constructor only accepts absolute URLs.
            const localVarUrlObj = new URL(localVarPath, 'https://example.com');
            const baseOptions = configuration?.baseOptions || {};
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
 * BankMetadataApi - functional programming interface
 * @export
 */
export const BankMetadataApiFp = function (axios: AxiosInstance, configuration?: Configuration) {
    return {
        /**
         * The available banks, features available for the banks, and relevant fields.
         * @summary Get Bank Metadata
         * @param {GenericParameters} params the generic parameters
         */
        async getMeta(params: GenericParameters = {}): Promise<(axios?: AxiosInstance, basePath?: string) => Promise<AxiosResponse<Array<BankMetadata>>>> {
            // Auto-generate IDs if not provided - reused across retries
            const requestId = params.requestId || uuidv4();
            const correlationId = params.xCorrelationId || uuidv4();

            const paramsWithIds = { ...params, requestId, xCorrelationId: correlationId };
            const localVarAxiosArgs = await BankMetadataApiAxiosParamCreator(axios, configuration).getMeta(paramsWithIds);

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
 * BankMetadataApi - factory interface
 * @export
 */
export const BankMetadataApiFactory = function (axios: AxiosInstance, configuration?: Configuration, basePath?: string) {
    return {
        /**
         * The available banks, features available for the banks, and relevant fields.
         * @summary Get Bank Metadata
         * @param {GenericParameters} params the generic parameters
         */
        async getMeta(params: GenericParameters = {}): Promise<AxiosResponse<Array<BankMetadata>>> {
            return BankMetadataApiFp(axios, configuration).getMeta(params).then((request) => request(axios, basePath));
        },
    };
};

/**
 * BankMetadataApi - object-oriented interface
 * @export
 * @class BankMetadataApi
 * @extends {BaseAPI}
 */
export class BankMetadataApi extends BaseAPI {
    /**
     * The available banks, features available for the banks, and relevant fields.
     * @summary Get Bank Metadata
     * @param {GenericParameters} params the generic parameters
     * @memberof BankMetadataApi
     */
    public async getMeta(params: GenericParameters = {}): Promise<AxiosResponse<Array<BankMetadata>>> {
        return BankMetadataApiFp(this.axios, this.configuration).getMeta(params).then((request) => request(this.axios, this.basePath));
    }
}
