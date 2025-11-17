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
import {IdentifierType} from './identifier-type.js';
import {IdentifierValue} from './identifier-value.js';
import {Transform} from "class-transformer";
import {PaymentAcceptedReasonEnum} from "./payment.js";

/**
 * The details for a Decoupled flow.
 *
 * @export
 * @class DecoupledFlow
 */
export class DecoupledFlow extends AuthFlowDetail {
    /**
     *
     * @type {Bank}
     * @memberof DecoupledFlow
     */
    bank?: Bank;
    /**
     *
     * @type {IdentifierType}
     * @memberof DecoupledFlow
     */
    @Transform(({value}) => {
        return Object.values(IdentifierType).find(status => status === value)
    })
    identifierType: IdentifierType;
    /**
     *
     * @type {IdentifierValue}
     * @memberof DecoupledFlow
     */
    identifierValue: IdentifierValue;
    /**
     * A callback URL to call once the consent status has been updated using decoupled flow. Blink will also append the `cid` (the Consent ID) in an additional URL parameter. This is sent to your api as a GET request and will be retried up to 3 times if 5xx errors are received from your server.
     * @type {string}
     * @memberof DecoupledFlow
     */
    callbackUrl?: string;
}
