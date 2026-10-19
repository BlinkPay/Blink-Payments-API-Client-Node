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
 * Unit tests for statusUpdatedTimestamp, which the API omits until a status first changes.
 */

import path from 'path';
import ts from 'typescript';
import axios, {AxiosInstance} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {BlinkDebitClient} from '../../src/client/v1/blink-debit-client';
import {ConsentStatusEnum} from '../../src/dto/v1/consent';

const DEBIT_URL = 'https://sandbox.debit.blinkpay.co.nz';
const TOKEN_URL = `${DEBIT_URL}/oauth2/token`;
const QUICK_PAYMENT_ID = '11111111-2222-3333-4444-555555555555';
const CONSENT_ID = '66666666-7777-8888-9999-000000000000';
const CREATION_TIMESTAMP = '2026-10-20T01:47:10+13:00';
const STATUS_UPDATED_TIMESTAMP = '2026-10-20T01:47:56+13:00';

const consentBody = (status: ConsentStatusEnum, statusUpdatedTimestamp?: string) => ({
    consent_id: QUICK_PAYMENT_ID,
    status,
    creation_timestamp: CREATION_TIMESTAMP,
    ...(statusUpdatedTimestamp === undefined ? {} : {status_updated_timestamp: statusUpdatedTimestamp}),
    detail: {
        type: 'single',
        flow: {detail: {type: 'gateway', redirect_uri: 'https://www.blinkpay.co.nz/sample-merchant-return-page'}},
        amount: {currency: 'NZD', total: '0.01'},
        pcr: {particulars: 'particulars', code: 'code', reference: 'reference'}
    },
    payments: []
});

describe('statusUpdatedTimestamp in responses', () => {
    let mock: MockAdapter;
    let client: BlinkDebitClient;

    beforeEach(() => {
        const axiosInstance: AxiosInstance = axios.create();
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

    it('should resolve a quick payment awaiting gateway submission without a status updated timestamp', async () => {
        mock.onGet(`${DEBIT_URL}/payments/v1/quick-payments/${QUICK_PAYMENT_ID}`).reply(200, {
            quick_payment_id: QUICK_PAYMENT_ID,
            consent: consentBody(ConsentStatusEnum.GatewayAwaitingSubmission)
        });

        const {consent} = await client.getQuickPayment(QUICK_PAYMENT_ID);

        expect(consent.status).toBe(ConsentStatusEnum.GatewayAwaitingSubmission);
        expect(consent.creationTimestamp).toBe(CREATION_TIMESTAMP);
        expect('statusUpdatedTimestamp' in consent).toBe(false);
        expect(consent.statusUpdatedTimestamp).toBeUndefined();
    });

    it('should resolve a single consent awaiting gateway submission without a status updated timestamp', async () => {
        mock.onGet(`${DEBIT_URL}/payments/v1/single-consents/${CONSENT_ID}`)
            .reply(200, {...consentBody(ConsentStatusEnum.GatewayAwaitingSubmission), consent_id: CONSENT_ID});

        const consent = await client.getSingleConsent(CONSENT_ID);

        expect(consent.status).toBe(ConsentStatusEnum.GatewayAwaitingSubmission);
        expect(consent.statusUpdatedTimestamp).toBeUndefined();
    });

    it('should carry the status updated timestamp once the status has changed', async () => {
        mock.onGet(`${DEBIT_URL}/payments/v1/quick-payments/${QUICK_PAYMENT_ID}`).reply(200, {
            quick_payment_id: QUICK_PAYMENT_ID,
            consent: consentBody(ConsentStatusEnum.Revoked, STATUS_UPDATED_TIMESTAMP)
        });

        const {consent} = await client.getQuickPayment(QUICK_PAYMENT_ID);

        expect(consent.status).toBe(ConsentStatusEnum.Revoked);
        expect(consent.statusUpdatedTimestamp).toBe(STATUS_UPDATED_TIMESTAMP);
    });
});

/**
 * ts-jest transpiles without type checking (isolatedModules), so the declared type is
 * checked here with the compiler API instead, as a strictNullChecks consumer would see it.
 */
describe('statusUpdatedTimestamp declared type', () => {
    const fileName = path.join(__dirname, 'status-updated-timestamp-consumer.ts');
    const lines = [
        "import {Consent, Payment, Refund} from '../../src/dto/v1/index.js';",
        'declare const consent: Consent;',
        'declare const payment: Payment;',
        'declare const refund: Refund;',
        'export const unguardedConsent: Date = consent.statusUpdatedTimestamp;',
        'export const unguardedPayment: Date = payment.statusUpdatedTimestamp;',
        'export const unguardedRefund: Date = refund.statusUpdatedTimestamp;',
        'export const guardedConsent: Date = consent.statusUpdatedTimestamp ?? consent.creationTimestamp;',
        'export const guardedPayment: Date = payment.statusUpdatedTimestamp ?? payment.creationTimestamp;',
        'export const guardedRefund: Date = refund.statusUpdatedTimestamp ?? refund.creationTimestamp;'
    ];
    let errorCodesByLine: Map<number, number[]>;

    beforeAll(() => {
        const options: ts.CompilerOptions = {
            strictNullChecks: true,
            noEmit: true,
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.Node16,
            moduleResolution: ts.ModuleResolutionKind.Node16,
            experimentalDecorators: true,
            types: []
        };
        const host = ts.createCompilerHost(options);
        const readSourceFile = host.getSourceFile.bind(host);
        host.getSourceFile = (name, languageVersion, ...rest) => name === fileName
            ? ts.createSourceFile(name, lines.join('\n'), languageVersion, true)
            : readSourceFile(name, languageVersion, ...rest);
        host.fileExists = (name => name === fileName || ts.sys.fileExists(name));

        const program = ts.createProgram([fileName], options, host);
        const sourceFile = program.getSourceFile(fileName)!;
        errorCodesByLine = new Map();
        for (const diagnostic of ts.getPreEmitDiagnostics(program, sourceFile)) {
            const line = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line;
            errorCodesByLine.set(line, [...(errorCodesByLine.get(line) ?? []), diagnostic.code]);
        }
    });

    const lineOf = (declaration: string): number => lines.findIndex(line => line.includes(`const ${declaration}:`));

    it('should resolve the DTO imports', () => {
        expect(errorCodesByLine.get(0)).toBeUndefined();
    });

    it.each(['unguardedConsent', 'unguardedPayment', 'unguardedRefund'])(
        'should reject %s, which treats the timestamp as always present', declaration => {
            // TS2322: Type 'Date | undefined' is not assignable to type 'Date'
            expect(errorCodesByLine.get(lineOf(declaration))).toEqual([2322]);
        });

    it.each(['guardedConsent', 'guardedPayment', 'guardedRefund'])(
        'should accept %s, which handles the missing timestamp', declaration => {
            expect(errorCodesByLine.get(lineOf(declaration))).toBeUndefined();
        });
});
