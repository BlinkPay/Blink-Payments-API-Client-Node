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

import {BlinkServiceException} from './blink-service-exception.js';

/**
 * The exception thrown when the request is unauthorised e.g. expired bearer access token or missing authorization request header (401).
 *
 * @export
 * @exception
 * @extends {BlinkServiceException}
 */
export class BlinkUnauthorisedException extends BlinkServiceException {
    constructor(message?: string, innerException?: Error) {
        super(message || "Unauthorised access to resource, check the JWT in Authorization HTTP request header with Bearer authentication scheme", innerException);
        this.name = "BlinkUnauthorisedException";
        Object.setPrototypeOf(this, BlinkUnauthorisedException.prototype);
    }
}
