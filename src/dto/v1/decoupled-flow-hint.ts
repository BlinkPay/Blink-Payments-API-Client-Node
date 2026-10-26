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

import {FlowHint} from './flow-hint.js';
import {IdentifierType} from './identifier-type.js';
import {Transform} from "class-transformer";

/**
 * Decoupled flow hint.
 *
 * @export
 * @class DecoupledFlowHint
 */
export class DecoupledFlowHint extends FlowHint {
    /**
     *
     * @type {IdentifierType}
     * @memberof DecoupledFlowHint
     */
    @Transform(({value}) => {
        return Object.values(IdentifierType).find(status => status === value)
    })
    identifierType: IdentifierType;
    /**
     * The identifier value. Required in requests. In responses it is `null` once the consent is no longer awaiting
     * submission or authorisation (it may already be `null` once the bank has accepted the request); a `consent_id`
     * reference is always returned.
     * @type {string | null}
     * @memberof DecoupledFlowHint
     */
    identifierValue: string | null;
}
