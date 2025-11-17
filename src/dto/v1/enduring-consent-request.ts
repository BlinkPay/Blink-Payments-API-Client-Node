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

import {Amount} from './amount.js';
import {AuthFlow} from './auth-flow.js';
import {ConsentDetail} from './consent-detail.js';
import {Period} from './period.js';

/**
 * The model for an enduring consent request, relating to multiple payments.
 *
 * @export
 * @interface EnduringConsentRequest
 */
export interface EnduringConsentRequest extends ConsentDetail {
    /**
     *
     * @type {AuthFlow}
     * @memberof EnduringConsentRequest
     */
    flow: AuthFlow;
    /**
     * The ISO 8601 start date to calculate the periods for which to calculate the consent period.
     * @type {Date}
     * @memberof EnduringConsentRequest
     */
    fromTimestamp: Date;
    /**
     * The ISO 8601 timeout for when an enduring consent will expire. If this field is blank, an indefinite request will be attempted.
     * @type {Date}
     * @memberof EnduringConsentRequest
     */
    expiryTimestamp?: Date;
    /**
     *
     * @type {Period}
     * @memberof EnduringConsentRequest
     */
    period: Period;
    /**
     *
     * @type {Amount}
     * @memberof EnduringConsentRequest
     */
    maximumAmountPeriod: Amount;
    /**
     * The hashed unique ID of the customer e.g. customer internal ID. SHA-256 is recommended.
     * @type {string}
     * @memberof EnduringConsentRequest
     */
    hashedCustomerIdentifier?: string;
    /**
     *
     * @type {Amount}
     * @memberof EnduringConsentRequest
     */
    maximumAmountPayment: Amount;
}
