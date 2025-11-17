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

import {IdentifierType} from './identifier-type.js';
import {Transform} from "class-transformer";

/**
 * The available identifiers.
 *
 * @export
 * @class BankmetadataFeaturesDecoupledFlowAvailableIdentifiers
 */
export class BankmetadataFeaturesDecoupledFlowAvailableIdentifiers {
    /**
     *
     * @type {IdentifierType}
     * @memberof BankmetadataFeaturesDecoupledFlowAvailableIdentifiers
     */
    @Transform(({value}) => {
        return Object.values(IdentifierType).find(status => status === value)
    })
    type: IdentifierType;
    /**
     * A regex that can be used for validation of the field
     * @type {string}
     * @memberof BankmetadataFeaturesDecoupledFlowAvailableIdentifiers
     */
    regex?: string;
    /**
     * The common name of the field
     * @type {string}
     * @memberof BankmetadataFeaturesDecoupledFlowAvailableIdentifiers
     */
    name: string;
    /**
     * The description of the field and/or where to find it
     * @type {string}
     * @memberof BankmetadataFeaturesDecoupledFlowAvailableIdentifiers
     */
    description?: string;
}
