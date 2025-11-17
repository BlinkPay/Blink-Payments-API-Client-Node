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
import log from 'loglevel';
import {Configuration} from '../../../configuration.js';
import {AccessTokenResponse} from '../../dto/v1/access-token-response.js';

export class TokenAPI {
    private static readonly TOKEN_REFRESH_BUFFER_SECONDS = 60;
    private readonly _axios: AxiosInstance;
    private readonly _configuration: Configuration;

    constructor(axios: AxiosInstance, configuration: Configuration) {
        this._axios = axios;
        this._configuration = configuration;
    }

    /**
     * Gets the OAuth2 access token, refreshing it if expired or not yet obtained.
     *
     * This method checks if the current access token is valid (exists and not expired).
     * If the token is missing or will expire within 60 seconds, it automatically triggers
     * a refresh before returning. The 60-second buffer ensures the token remains valid
     * for the duration of the API request.
     *
     * @param {boolean} forceRefresh - If true, forces a token refresh regardless of expiration time
     * @returns {Promise<string | ((name?: string, scopes?: string[]) => string) | ((name?: string, scopes?: string[]) => Promise<string>)>}
     *          The access token, either as a string or as a function that returns a string/Promise<string>
     * @throws {BlinkForbiddenException} When the client credentials are invalid or insufficient permissions
     * @throws {BlinkServiceException} When the token refresh fails for other reasons
     */
    async getAccessToken(forceRefresh: boolean = false): Promise<string | ((name?: string, scopes?: string[]) => string) | ((name?: string, scopes?: string[]) => Promise<string>)> {
        // Calculate the expiration threshold (current time + 60 seconds buffer)
        const expirationThreshold = new Date(Date.now() + (TokenAPI.TOKEN_REFRESH_BUFFER_SECONDS * 1000));

        // If token is undefined, expired, or will expire soon (within buffer period), refresh it
        if (forceRefresh || !this._configuration.accessToken || expirationThreshold >= this._configuration.expirationDate) {
            await this.refreshToken();
        }

        return this._configuration.accessToken;
    }

    public async refreshToken(): Promise<void> {
        const clientId = this._configuration.clientId;
        const clientSecret = this._configuration.clientSecret;
        const tokenEndpoint = this._configuration.debitUrl + '/oauth2/token';

        const axiosConfig: AxiosRequestConfig = {
            method: 'POST',
            url: tokenEndpoint,
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                'client_id': clientId,
                'client_secret': clientSecret,
                'grant_type': 'client_credentials'
            }
        };

        try {
            const response = await this._axios.request<AccessTokenResponse>(axiosConfig);
            const accessTokenResponse = response.data;
            this._configuration.accessToken = accessTokenResponse.accessToken;
            this._configuration.expirationDate = new Date(Date.now() + (response.data.expiresIn * 1000));
            // Note: Authorization header is set in each API call via getAccessToken()
            // No need to add an interceptor here (prevents interceptor accumulation)
        } catch (error) {
            log.error(`Token refresh failed: ${error}`);
            throw error; // Rethrow to propagate authentication failures
        }
    }
}