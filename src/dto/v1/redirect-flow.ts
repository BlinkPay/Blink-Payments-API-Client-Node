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

import {AuthFlowDetail} from './auth-flow-detail.js';
import {Bank} from './bank.js';

/**
 * The details for a Redirect flow.
 *
 * @export
 * @class RedirectFlow
 */
export class RedirectFlow extends AuthFlowDetail {
    /**
     * The URI to redirect back to once the consent is completed. App-based workflows may use deep/universal links. The `cid` (Consent ID) will be added as a URL parameter. If there is an error, an `error` parameter will be appended also.
     * @type {string}
     * @memberof RedirectFlow
     */
    redirectUri: string;
    /**
     *
     * @type {Bank}
     * @memberof RedirectFlow
     */
    bank: Bank;
    /**
     * Whether the redirect URI goes back to an app directly. If this value is true, the app will receive code and state parameters with this redirection. The app must pass these through to us at: https://debit.blinkpay.co.nz/bank/1.0/return?state={state}&code={code}, along with other query parameters like error. Applies only to Redirect flow.
     * @type {boolean}
     * @memberof RedirectFlow
     */
    redirectToApp?: boolean;
}
