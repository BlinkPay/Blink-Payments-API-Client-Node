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

import {Bank} from './bank.js';

/**
 * Optionally include a hint to the Gateway of which flow should be used, allowing the customers details to be prefilled in order to make the checkout experience faster. You can also use Gateway flow hint to instruct Gateway to identify a customer using their last consent ID for mobile payments.
 *
 * @export
 * @class FlowHint
 */
export class FlowHint {
    /**
     * The flow hint type, i.e. Redirect or Decoupled.
     * @type {string}
     * @memberof FlowHint
     */
    type: FlowHintTypeEnum;
    /**
     *
     * @type {Bank}
     * @memberof FlowHint
     */
    bank?: Bank;
}

/**
 * The enumeration of flow hint types.
 *
 * @export
 * @enum {string}
 */
export enum FlowHintTypeEnum {
    Redirect = 'redirect',
    Decoupled = 'decoupled'
}
