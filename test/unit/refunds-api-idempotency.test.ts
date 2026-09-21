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

/**
 * Unit tests for the idempotency key on the refunds endpoints.
 */

// Must be first: configuration.ts reaches TokenAPI through the src/index.js barrel, which
// exports blink-debit-client ahead of token-api. Loading the leaf up front is what stops the
// Configuration constructor seeing TokenAPI as undefined.
import '../../src/client/v1/token-api';

import axios, {AxiosInstance} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {BlinkDebitClient} from '../../src/client/v1/blink-debit-client';
import {RefundDetail, RefundDetailTypeEnum} from '../../src/dto/v1/refund-detail';

const DEBIT_URL = 'https://sandbox.debit.blinkpay.co.nz';
const REFUNDS_URL = `${DEBIT_URL}/payments/v1/refunds`;
const TOKEN_URL = `${DEBIT_URL}/oauth2/token`;
const REFUND_ID = '11111111-2222-3333-4444-555555555555';

// Version nibble and variant bits, so a non-v4 string (or a plain uuid-shaped
// literal) cannot satisfy the assertion.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The retry layer sleeps 1s then 5s for real, so the multi-attempt tests need
// headroom over Jest's 5s default.
const RETRY_TEST_TIMEOUT_MS = 20000;

describe('Refunds idempotency key', () => {
    let axiosInstance: AxiosInstance;
    let mock: MockAdapter;
    let client: BlinkDebitClient;
    let sentKeys: (string | undefined)[];
    let sentRequestIds: (string | undefined)[];

    const refundDetail: RefundDetail = {
        type: RefundDetailTypeEnum.AccountNumber,
        paymentId: '99999999-8888-7777-6666-555555555555'
    } as RefundDetail;

    /**
     * Records the idempotency-key of every POST /refunds attempt and replies with
     * the given status codes in order, defaulting to 201 once they run out.
     */
    const replyToRefundsWith = (...statuses: number[]): void => {
        const queue = [...statuses];
        mock.onPost(REFUNDS_URL).reply(config => {
            sentKeys.push(config.headers?.['idempotency-key'] as string | undefined);
            sentRequestIds.push(config.headers?.['request-id'] as string | undefined);
            const status = queue.shift() ?? 201;
            return [status, status === 201 ? {refund_id: REFUND_ID} : {message: 'stub error'}];
        });
    };

    beforeEach(() => {
        sentKeys = [];
        sentRequestIds = [];
        axiosInstance = axios.create();
        mock = new MockAdapter(axiosInstance);
        mock.onPost(TOKEN_URL).reply(200, {
            access_token: 'test-access-token',
            token_type: 'Bearer',
            expires_in: 3600
        });
        client = new BlinkDebitClient(axiosInstance, DEBIT_URL, 'test-client-id', 'test-client-secret');
    });

    afterEach(() => {
        mock.reset();
    });

    describe('createRefund', () => {
        it('should send a caller-supplied idempotency key verbatim', async () => {
            const callerKey = 'caller-supplied-key';
            replyToRefundsWith(201);

            await client.createRefund(refundDetail, {idempotencyKey: callerKey});

            expect(sentKeys).toEqual([callerKey]);
        });

        it('should generate a UUID v4 idempotency key when none is supplied', async () => {
            replyToRefundsWith(201);

            await client.createRefund(refundDetail);

            expect(sentKeys).toHaveLength(1);
            expect(sentKeys[0]).toMatch(UUID_V4);
        });

        it('should generate a different key for each call', async () => {
            replyToRefundsWith(201, 201);

            await client.createRefund(refundDetail);
            await client.createRefund(refundDetail);

            expect(sentKeys).toHaveLength(2);
            expect(sentKeys[0]).not.toEqual(sentKeys[1]);
        });

        it('should treat an empty idempotency key as absent and still send a generated one', async () => {
            replyToRefundsWith(201);

            await client.createRefund(refundDetail, {idempotencyKey: ''});

            expect(sentKeys).toHaveLength(1);
            expect(sentKeys[0]).toMatch(UUID_V4);
        });

        it('should reuse one generated key across every retry attempt after a 5xx', async () => {
            replyToRefundsWith(503, 503, 201);

            await client.createRefund(refundDetail);

            expect(sentKeys).toHaveLength(3);
            expect(new Set(sentKeys).size).toBe(1);
            expect(sentKeys[0]).toMatch(UUID_V4);
            // The pre-existing request-id guarantee must survive the change.
            expect(new Set(sentRequestIds).size).toBe(1);
        }, RETRY_TEST_TIMEOUT_MS);

        it('should reuse a caller-supplied key across every retry attempt after a 5xx', async () => {
            const callerKey = 'caller-supplied-key';
            replyToRefundsWith(503, 503, 201);

            await client.createRefund(refundDetail, {idempotencyKey: callerKey});

            expect(sentKeys).toEqual([callerKey, callerKey, callerKey]);
        }, RETRY_TEST_TIMEOUT_MS);

        it('should let an explicit options header override the generated key', async () => {
            const overrideKey = 'override-key';
            replyToRefundsWith(201);

            await client.createRefund(refundDetail, {
                options: {headers: {'idempotency-key': overrideKey}}
            });

            expect(sentKeys).toEqual([overrideKey]);
        });
    });

    describe('getRefund', () => {
        it('should not send an idempotency key, even when one is supplied', async () => {
            let getHeaders: Record<string, unknown> = {};
            mock.onGet(`${REFUNDS_URL}/${REFUND_ID}`).reply(config => {
                getHeaders = (config.headers ?? {}) as Record<string, unknown>;
                return [200, {refund_id: REFUND_ID}];
            });

            await client.getRefund(REFUND_ID, {idempotencyKey: 'should-be-ignored'});

            expect(getHeaders['idempotency-key']).toBeUndefined();
            expect(getHeaders['request-id']).toBeDefined();
        });
    });
});
