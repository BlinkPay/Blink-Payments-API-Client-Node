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
import {PaymentRequest} from './payment-request.js';
import {Refund} from './refund.js';
import {Transform} from "class-transformer";

/**
 * The model for a payment.
 *
 * @export
 * @class Payment
 */
export class Payment {
    /**
     * The payment ID
     * @type {string}
     * @memberof Payment
     */
    paymentId: string;
    /**
     * The type of payment (single or enduring).
     * @type {string}
     * @memberof Payment
     */
    type: PaymentTypeEnum;
    /**
     * The status of the payment.
     * @type {string}
     * @memberof Payment
     */
    status: PaymentStatusEnum;
    /**
     * The reason for `AcceptedSettlementCompleted`.
     * @type {string}
     * @memberof Payment
     */
    @Transform(({value}) => {
        return Object.values(PaymentAcceptedReasonEnum).find(status => status === value)
    })
    acceptedReason?: PaymentAcceptedReasonEnum;
    /**
     * The timestamp that the payment was created.
     * @type {Date}
     * @memberof Payment
     */
    creationTimestamp: Date;
    /**
     * The timestamp that the payment status was last updated.
     * @type {Date}
     * @memberof Payment
     */
    statusUpdatedTimestamp: Date;
    /**
     *
     * @type {PaymentRequest}
     * @memberof Payment
     */
    detail: PaymentRequest;
    /**
     * Refunds that are related to this payment, if any.
     * @type {Array<Refund>}
     * @memberof Payment
     */
    refunds: Array<Refund>;
}

/**
 * The enumeration of payment types.
 *
 * @export
 * @enum {string}
 */
export enum PaymentTypeEnum {
    Single = 'single',
    Enduring = 'enduring'
}

/**
 * The enumeration of payment statuses.
 *
 * @export
 * @enum {string}
 */
export enum PaymentStatusEnum {
    Pending = 'Pending',
    AcceptedSettlementInProcess = 'AcceptedSettlementInProcess',
    AcceptedSettlementCompleted = 'AcceptedSettlementCompleted',
    Rejected = 'Rejected'
}

/**
 * The enumeration of payment accepted reasons.
 *
 * @export
 * @enum {string}
 */
export enum PaymentAcceptedReasonEnum {
    SourceBankPaymentSent = 'source_bank_payment_sent',
    CardNetworkAccepted = 'card_network_accepted'
}

