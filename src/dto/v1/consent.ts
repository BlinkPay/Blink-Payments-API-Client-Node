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

import {EnduringConsentRequest} from './enduring-consent-request.js';
import {Payment} from './payment.js';
import {SingleConsentRequest} from './single-consent-request.js';
import {CardNetwork} from "./card-network.js";

/**
 * The model for a consent.
 *
 * @export
 * @interface Consent
 */
export interface Consent {
    /**
     * The consent ID
     * @type {string}
     * @memberof Consent
     */
    consentId: string;
    /**
     * The status of the consent
     * @type {string}
     * @memberof Consent
     */
    status: ConsentStatusEnum;
    /**
     * The timestamp that the consent was created
     * @type {Date}
     * @memberof Consent
     */
    creationTimestamp: Date;
    /**
     * The time that the status was last updated
     * @type {Date}
     * @memberof Consent
     */
    statusUpdatedTimestamp: Date;
    /**
     * The consent details
     * @type {EnduringConsentRequest | SingleConsentRequest}
     * @memberof Consent
     */
    detail: EnduringConsentRequest | SingleConsentRequest;
    /**
     * Payments associated with this consent, if any.
     * @type {Array<Payment>}
     * @memberof Consent
     */
    payments: Array<Payment>;
    /**
     * The card network (only present for card payments)
     * @type {CardNetwork}
     * @memberOf Consent
     */
    cardNetwork?: CardNetwork;
}

/**
 * The enumeration of consent statuses.
 * @export
 * @enum {string}
 */
export enum ConsentStatusEnum {
    GatewayAwaitingSubmission = 'GatewayAwaitingSubmission',
    GatewayTimeout = 'GatewayTimeout',
    AwaitingAuthorisation = 'AwaitingAuthorisation',
    Authorised = 'Authorised',
    Consumed = 'Consumed',
    Rejected = 'Rejected',
    Revoked = 'Revoked'
}
