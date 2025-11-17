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

import {RefundRequest} from './refund-request.js';

/**
 * The model for a refund.
 *
 * @export
 * @interface Refund
 */
export interface Refund {
    /**
     * The refund ID.
     * @type {string}
     * @memberof Refund
     */
    refundId: string;
    /**
     * The refund status
     * @type {string}
     * @memberof Refund
     */
    status: RefundStatusEnum;
    /**
     * The time that the refund was created.
     * @type {Date}
     * @memberof Refund
     */
    creationTimestamp: Date;
    /**
     * The time that the status was last updated.
     * @type {Date}
     * @memberof Refund
     */
    statusUpdatedTimestamp: Date;
    /**
     * The customer account number used or to be used for the refund.
     * @type {string}
     * @memberof Refund
     */
    accountNumber: string;
    /**
     *
     * @type {RefundRequest}
     * @memberof Refund
     */
    detail: RefundRequest;
}

/**
 * The enumeration of refund statuses.
 * @export
 * @enum {string}
 */
export enum RefundStatusEnum {
    Failed = 'failed',
    Processing = 'processing',
    Completed = 'completed'
}
