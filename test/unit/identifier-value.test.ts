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
 * Unit tests for identifierValue, which the API sends as null once the bank has the request.
 */

import path from 'path';
import ts from 'typescript';
import axios, {AxiosInstance} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {BlinkDebitClient} from '../../src/client/v1/blink-debit-client';
import {ConsentStatusEnum} from '../../src/dto/v1/consent';
import {DecoupledFlow} from '../../src/dto/v1/decoupled-flow';
import {DecoupledFlowHint} from '../../src/dto/v1/decoupled-flow-hint';
import {GatewayFlow} from '../../src/dto/v1/gateway-flow';
import {IdentifierType} from '../../src/dto/v1/identifier-type';
import {SingleConsentRequest} from '../../src/dto/v1/single-consent-request';

const DEBIT_URL = 'https://sandbox.debit.blinkpay.co.nz';
const TOKEN_URL = `${DEBIT_URL}/oauth2/token`;
const CONSENT_ID = 'a5d7c994-1a4a-4061-9987-c07d8ab34e28';

const consentBody = (status: ConsentStatusEnum, flowDetail: object) => ({
    consent_id: CONSENT_ID,
    status,
    creation_timestamp: '2026-10-27T04:10:00+13:00',
    status_updated_timestamp: '2026-10-27T04:10:01+13:00',
    detail: {
        type: 'single',
        flow: {detail: flowDetail},
        amount: {currency: 'NZD', total: '0.01'},
        pcr: {particulars: 'particulars'}
    },
    payments: []
});

describe('identifierValue in responses', () => {
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

    it('should read a null identifier value on a decoupled flow', async () => {
        mock.onGet(`${DEBIT_URL}/payments/v1/single-consents/${CONSENT_ID}`).reply(200,
            consentBody(ConsentStatusEnum.AwaitingAuthorisation, {
                type: 'decoupled',
                bank: 'PNZ',
                identifier_type: 'phone_number',
                identifier_value: null,
                callback_url: 'https://www.blinkpay.co.nz/callback'
            }));

        const consent = await client.getSingleConsent(CONSENT_ID);

        const flow = (consent.detail as SingleConsentRequest).flow.detail as DecoupledFlow;
        expect(consent.status).toBe(ConsentStatusEnum.AwaitingAuthorisation);
        expect(flow.identifierValue).toBeNull();
        expect(flow.identifierType).toBe(IdentifierType.PhoneNumber);
    });

    it('should read a null identifier value on a gateway decoupled flow hint', async () => {
        mock.onGet(`${DEBIT_URL}/payments/v1/quick-payments/${CONSENT_ID}`).reply(200, {
            quick_payment_id: CONSENT_ID,
            consent: consentBody(ConsentStatusEnum.Revoked, {
                type: 'gateway',
                redirect_uri: 'https://www.blinkpay.co.nz/sample-merchant-return-page',
                flow_hint: {type: 'decoupled', bank: 'PNZ', identifier_type: 'phone_number', identifier_value: null}
            })
        });

        const {consent} = await client.getQuickPayment(CONSENT_ID);

        const flowHint = ((consent.detail as SingleConsentRequest).flow.detail as GatewayFlow)
            .flowHint as DecoupledFlowHint;
        expect(consent.status).toBe(ConsentStatusEnum.Revoked);
        expect(flowHint.identifierValue).toBeNull();
        expect(flowHint.identifierType).toBe(IdentifierType.PhoneNumber);
    });
});

/**
 * ts-jest transpiles without type checking (isolatedModules), so the declared type is
 * checked here with the compiler API instead, as a strictNullChecks consumer would see it.
 */
describe('identifierValue declared type', () => {
    const fileName = path.join(__dirname, 'identifier-value-consumer.ts');
    const lines = [
        "import {DecoupledFlow, DecoupledFlowHint} from '../../src/dto/v1/index.js';",
        'declare const flow: DecoupledFlow;',
        'declare const flowHint: DecoupledFlowHint;',
        'export const unguardedFlow: string = flow.identifierValue;',
        'export const unguardedFlowHint: string = flowHint.identifierValue;',
        'export const nullableFlow: string | null = flow.identifierValue;',
        'export const nullableFlowHint: string | null = flowHint.identifierValue;',
        "export const nonStringFlow: Partial<DecoupledFlow> = {identifierValue: 42};"
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

    it.each(['unguardedFlow', 'unguardedFlowHint'])(
        'should reject %s, which treats the identifier value as always present', declaration => {
            // TS2322: Type 'string | null' is not assignable to type 'string'
            expect(errorCodesByLine.get(lineOf(declaration))).toEqual([2322]);
        });

    it.each(['nullableFlow', 'nullableFlowHint'])(
        'should accept %s, which allows for null', declaration => {
            expect(errorCodesByLine.get(lineOf(declaration))).toBeUndefined();
        });

    it('should reject an identifier value that is not a string', () => {
        expect(errorCodesByLine.get(lineOf('nonStringFlow'))).toEqual([2322]);
    });
});
