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

import {SurchargeOption} from './surcharge-option.js';

/**
 * A best-effort preview of the surcharge each payment method would add, returned while a gateway consent is in
 * `GatewayAwaitingSubmission`. Only methods the merchant surcharges are included, card only when the consent can be
 * paid by card, and the whole object is omitted if the rates cannot be looked up. Read-only.
 *
 * @export
 * @interface SurchargeOptions
 */
export interface SurchargeOptions {
    /**
     * The surcharge that would apply when paying via bank.
     * @type {SurchargeOption}
     * @memberof SurchargeOptions
     */
    bank?: SurchargeOption | null;
    /**
     * The surcharge that would apply when paying via card. Single consents and quick payments only.
     * @type {SurchargeOption}
     * @memberof SurchargeOptions
     */
    card?: SurchargeOption | null;
}
