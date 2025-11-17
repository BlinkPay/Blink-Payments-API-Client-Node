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
import {Pcr} from './pcr.js';

/**
 * The payment request model.
 *
 * @export
 * @interface PaymentRequest
 */
export interface PaymentRequest {
    /**
     * The consent ID
     * @type {string}
     * @memberof PaymentRequest
     */
    consentId: string;
    /**
     * PCR (Particulars, Code, Reference) details.
     * Optional for single consents (uses the consent's PCR).
     * Can be provided for enduring consents to specify payment-specific PCR details.
     * @type {Pcr}
     * @memberof PaymentRequest
     */
    pcr?: Pcr;
    /**
     * Payment amount.
     * Optional for single consents (uses the consent's amount).
     * Can be provided for enduring consents to specify the payment amount
     * (must be within the consent's maximum limits).
     * @type {Amount}
     * @memberof PaymentRequest
     */
    amount?: Amount;
}
