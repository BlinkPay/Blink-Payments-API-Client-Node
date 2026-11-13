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

import {SurchargeDetail} from './surcharge-detail.js';

/**
 * What paying with one method would charge, shaped like the fields it previews. A single consent or quick payment
 * carries `surcharge` and `totalCharge`; an enduring consent carries `maximumAmountPayment` (omitted when the consent
 * has no per-payment maximum) and `maximumAmountPeriod`. Read-only.
 *
 * @export
 * @interface SurchargeOption
 */
export interface SurchargeOption {
    /**
     * The surcharge that would apply for this payment method. Single consents and quick payments only.
     * @type {string}
     * @memberof SurchargeOption
     */
    surcharge?: string | null;
    /**
     * The total that would be charged (amount total + surcharge) for this payment method. Single consents and quick
     * payments only.
     * @type {string}
     * @memberof SurchargeOption
     */
    totalCharge?: string | null;
    /**
     * The surcharge on the maximum amount per payment. Enduring consents only.
     * @type {SurchargeDetail}
     * @memberof SurchargeOption
     */
    maximumAmountPayment?: SurchargeDetail | null;
    /**
     * The surcharge on the maximum amount per period. Enduring consents only.
     * @type {SurchargeDetail}
     * @memberof SurchargeOption
     */
    maximumAmountPeriod?: SurchargeDetail | null;
}
