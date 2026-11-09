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
 * Unit tests for the read-only surcharge fields: read on responses, never sent on requests.
 */

import path from 'path';
import ts from 'typescript';
import axios, {AxiosInstance} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {BlinkDebitClient} from '../../src/client/v1/blink-debit-client';
import {stripReadOnlyRequestFields} from '../../src/util/helper';
import {EnduringConsentRequest} from '../../src/dto/v1/enduring-consent-request';
import {PartialRefundRequest} from '../../src/dto/v1/partial-refund-request';
import {PaymentRequest} from '../../src/dto/v1/payment-request';
import {QuickPaymentRequest} from '../../src/dto/v1/quick-payment-request';
import {SingleConsentRequest} from '../../src/dto/v1/single-consent-request';

const DEBIT_URL = 'https://sandbox.debit.blinkpay.co.nz';
const API_URL = `${DEBIT_URL}/payments/v1`;
const TOKEN_URL = `${DEBIT_URL}/oauth2/token`;
const CONSENT_ID = '11111111-1111-4111-8111-000000000001';
const PAYMENT_ID = '11111111-1111-4111-8111-000000000008';

const PCR = {particulars: 'particulars', code: 'code', reference: 'reference'};
const REDIRECT = {detail: {type: 'redirect', bank: 'PNZ', redirect_uri: 'https://www.blinkpay.co.nz/sample-merchant-return-page'}};
const GATEWAY = {detail: {type: 'gateway', redirect_uri: 'https://www.blinkpay.co.nz/sample-merchant-return-page'}};
const UNSURCHARGED = {currency: 'NZD', total: '100.00'};
const SURCHARGED = {currency: 'NZD', total: '100.00', surcharge: '0.68', total_charge: '100.68'};
const SURCHARGED_PERIOD = {currency: 'NZD', total: '400.00', surcharge: '2.72', total_charge: '402.72'};

const singleConsentBody = (status: string, flow: object, amount: object, extra: object = {}) => ({
    consent_id: CONSENT_ID,
    status,
    creation_timestamp: '2026-11-10T09:00:00+13:00',
    status_updated_timestamp: '2026-11-10T09:00:01+13:00',
    detail: {type: 'single', flow, pcr: PCR, amount},
    payments: [],
    ...extra
});

const enduringConsentBody = (maxima: object, extra: object) => ({
    consent_id: CONSENT_ID,
    status: 'GatewayAwaitingSubmission',
    creation_timestamp: '2026-11-10T09:00:00+13:00',
    status_updated_timestamp: '2026-11-10T09:00:01+13:00',
    detail: {type: 'enduring', flow: GATEWAY, from_timestamp: '2026-11-10T09:00:00+13:00', period: 'monthly', ...maxima},
    payments: [],
    ...extra
});

describe('Surcharge fields', () => {
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

    describe('in responses', () => {
        it('should read the surcharge and total charge on a redirect single consent', async () => {
            mock.onGet(`${API_URL}/single-consents/${CONSENT_ID}`)
                .reply(200, singleConsentBody('AwaitingAuthorisation', REDIRECT, SURCHARGED));

            const consent = await client.getSingleConsent(CONSENT_ID);

            const {amount} = consent.detail as SingleConsentRequest;
            expect(amount).toEqual({currency: 'NZD', total: '100.00', surcharge: '0.68', totalCharge: '100.68'});
            expect(consent.surchargeOptions).toBeUndefined();
        });

        it('should read the bank and card surcharge options on a gateway single consent', async () => {
            mock.onGet(`${API_URL}/single-consents/${CONSENT_ID}`).reply(200, singleConsentBody(
                'GatewayAwaitingSubmission', GATEWAY, UNSURCHARGED, {
                    surcharge_options: {
                        bank: {surcharge: '0.68', total_charge: '100.68'},
                        card: {surcharge: '1.49', total_charge: '101.49'}
                    }
                }));

            const consent = await client.getSingleConsent(CONSENT_ID);

            expect(consent.surchargeOptions?.bank).toEqual({surcharge: '0.68', totalCharge: '100.68'});
            expect(consent.surchargeOptions?.card).toEqual({surcharge: '1.49', totalCharge: '101.49'});
            expect((consent.detail as SingleConsentRequest).amount.surcharge).toBeUndefined();
        });

        it('should read the surcharge options on a gateway quick payment consent', async () => {
            mock.onGet(`${API_URL}/quick-payments/${CONSENT_ID}`).reply(200, {
                quick_payment_id: CONSENT_ID,
                consent: singleConsentBody('GatewayAwaitingSubmission', GATEWAY, UNSURCHARGED, {
                    surcharge_options: {bank: {surcharge: '0.68', total_charge: '100.68'}}
                })
            });

            const {consent} = await client.getQuickPayment(CONSENT_ID);

            expect(consent.surchargeOptions).toEqual({bank: {surcharge: '0.68', totalCharge: '100.68'}});
        });

        it('should read the raised maxima and their surcharge options on a gateway enduring consent', async () => {
            mock.onGet(`${API_URL}/enduring-consents/${CONSENT_ID}`).reply(200, enduringConsentBody(
                {maximum_amount_period: SURCHARGED_PERIOD, maximum_amount_payment: SURCHARGED}, {
                    surcharge_options: {
                        bank: {
                            maximum_amount_payment: {surcharge: '0.68', total_charge: '100.68'},
                            maximum_amount_period: {surcharge: '2.72', total_charge: '402.72'}
                        }
                    }
                }));

            const consent = await client.getEnduringConsent(CONSENT_ID);

            const detail = consent.detail as EnduringConsentRequest;
            expect(detail.maximumAmountPayment).toEqual(
                {currency: 'NZD', total: '100.00', surcharge: '0.68', totalCharge: '100.68'});
            expect(detail.maximumAmountPeriod).toEqual(
                {currency: 'NZD', total: '400.00', surcharge: '2.72', totalCharge: '402.72'});
            expect(consent.surchargeOptions?.bank?.maximumAmountPayment).toEqual({surcharge: '0.68', totalCharge: '100.68'});
            expect(consent.surchargeOptions?.bank?.maximumAmountPeriod).toEqual({surcharge: '2.72', totalCharge: '402.72'});
        });

        it('should read an enduring consent without a per-payment maximum', async () => {
            mock.onGet(`${API_URL}/enduring-consents/${CONSENT_ID}`).reply(200, enduringConsentBody(
                {maximum_amount_period: SURCHARGED_PERIOD}, {
                    surcharge_options: {bank: {maximum_amount_period: {surcharge: '2.72', total_charge: '402.72'}}}
                }));

            const consent = await client.getEnduringConsent(CONSENT_ID);

            const detail = consent.detail as EnduringConsentRequest;
            expect(detail.maximumAmountPayment).toBeUndefined();
            expect(detail.maximumAmountPeriod.totalCharge).toBe('402.72');
            expect(consent.surchargeOptions?.bank?.maximumAmountPayment).toBeUndefined();
            expect(consent.surchargeOptions?.bank?.maximumAmountPeriod).toEqual({surcharge: '2.72', totalCharge: '402.72'});
        });

        it('should read the surcharge and total charge on a payment', async () => {
            mock.onGet(`${API_URL}/payments/${PAYMENT_ID}`).reply(200, {
                payment_id: PAYMENT_ID,
                type: 'single',
                status: 'AcceptedSettlementCompleted',
                accepted_reason: 'source_bank_payment_sent',
                creation_timestamp: '2026-11-10T09:00:00+13:00',
                status_updated_timestamp: '2026-11-10T09:00:01+13:00',
                detail: {consent_id: CONSENT_ID, pcr: PCR, amount: SURCHARGED},
                refunds: []
            });

            const payment = await client.getPayment(PAYMENT_ID);

            expect(payment.detail.amount).toEqual(
                {currency: 'NZD', total: '100.00', surcharge: '0.68', totalCharge: '100.68'});
        });

        it('should leave the fields absent on an unsurcharged consent', async () => {
            mock.onGet(`${API_URL}/single-consents/${CONSENT_ID}`)
                .reply(200, singleConsentBody('AwaitingAuthorisation', REDIRECT, UNSURCHARGED));

            const consent = await client.getSingleConsent(CONSENT_ID);

            const {amount} = consent.detail as SingleConsentRequest;
            expect(amount).toEqual({currency: 'NZD', total: '100.00'});
            expect(amount.surcharge).toBeUndefined();
            expect(amount.totalCharge).toBeUndefined();
            expect(consent.surchargeOptions).toBeUndefined();
        });

        it('should read explicit nulls as null', async () => {
            mock.onGet(`${API_URL}/single-consents/${CONSENT_ID}`).reply(200, singleConsentBody(
                'AwaitingAuthorisation', REDIRECT, {currency: 'NZD', total: '100.00', surcharge: null, total_charge: null},
                {surcharge_options: null}));

            const consent = await client.getSingleConsent(CONSENT_ID);

            const {amount} = consent.detail as SingleConsentRequest;
            expect(amount.total).toBe('100.00');
            expect(amount.surcharge).toBeNull();
            expect(amount.totalCharge).toBeNull();
            expect(consent.surchargeOptions).toBeNull();
        });
    });

    describe('in requests', () => {
        // A response amount reused in a request, in both the SDK's camelCase and the wire's snake_case spelling.
        const spellings = {
            camelCase: {
                amount: {total: '100.00', currency: 'NZD', surcharge: '0.68', totalCharge: '100.68'},
                period: {total: '400.00', currency: 'NZD', surcharge: '2.72', totalCharge: '402.72'},
                surchargeOptionsKey: 'surchargeOptions'
            },
            snake_case: {
                amount: {total: '100.00', currency: 'NZD', surcharge: '0.68', total_charge: '100.68'},
                period: {total: '400.00', currency: 'NZD', surcharge: '2.72', total_charge: '402.72'},
                surchargeOptionsKey: 'surcharge_options'
            }
        };
        const surchargeOptions = {bank: {surcharge: '0.68', totalCharge: '100.68'}};

        let sentBody: Record<string, unknown> | undefined;

        const captureBody = (url: string, response: object): void => {
            mock.onPost(url).reply(config => {
                sentBody = JSON.parse(config.data);
                return [201, response];
            });
        };

        beforeEach(() => {
            sentBody = undefined;
        });

        describe.each(Object.entries(spellings))('with %s keys', (_, spelling) => {
            const singleConsentRequest = () => ({
                type: 'single',
                flow: GATEWAY,
                amount: {...spelling.amount},
                pcr: {...PCR},
                [spelling.surchargeOptionsKey]: surchargeOptions
            });

            it('should not send them on a single consent', async () => {
                captureBody(`${API_URL}/single-consents`, {consent_id: CONSENT_ID});
                const request = singleConsentRequest();
                const before = structuredClone(request);

                await client.createSingleConsent(request as unknown as SingleConsentRequest);

                expect(sentBody).toEqual({
                    type: 'single',
                    flow: GATEWAY,
                    amount: {total: '100.00', currency: 'NZD'},
                    pcr: PCR
                });
                expect(request).toEqual(before);
            });

            it('should not send them on a quick payment', async () => {
                captureBody(`${API_URL}/quick-payments`, {quick_payment_id: CONSENT_ID});
                const request = singleConsentRequest();
                const before = structuredClone(request);

                await client.createQuickPayment(request as unknown as QuickPaymentRequest);

                expect(sentBody).toEqual({
                    type: 'single',
                    flow: GATEWAY,
                    amount: {total: '100.00', currency: 'NZD'},
                    pcr: PCR
                });
                expect(request).toEqual(before);
            });

            it('should not send them on either maximum of an enduring consent', async () => {
                captureBody(`${API_URL}/enduring-consents`, {consent_id: CONSENT_ID});
                const request = {
                    type: 'enduring',
                    flow: GATEWAY,
                    period: 'monthly',
                    fromTimestamp: '2026-11-10T09:00:00+13:00',
                    maximumAmountPayment: {...spelling.amount},
                    maximumAmountPeriod: {...spelling.period},
                    [spelling.surchargeOptionsKey]: surchargeOptions
                };
                const before = structuredClone(request);

                await client.createEnduringConsent(request as unknown as EnduringConsentRequest);

                expect(sentBody).toEqual({
                    type: 'enduring',
                    flow: GATEWAY,
                    period: 'monthly',
                    from_timestamp: '2026-11-10T09:00:00+13:00',
                    maximum_amount_payment: {total: '100.00', currency: 'NZD'},
                    maximum_amount_period: {total: '400.00', currency: 'NZD'}
                });
                expect(request).toEqual(before);
            });

            it('should not send them on a payment', async () => {
                captureBody(`${API_URL}/payments`, {payment_id: PAYMENT_ID});
                const request = {
                    consentId: CONSENT_ID,
                    pcr: {...PCR},
                    amount: {...spelling.amount},
                    [spelling.surchargeOptionsKey]: surchargeOptions
                };
                const before = structuredClone(request);

                await client.createPayment(request as unknown as PaymentRequest);

                expect(sentBody).toEqual({
                    consent_id: CONSENT_ID,
                    pcr: PCR,
                    amount: {total: '100.00', currency: 'NZD'}
                });
                expect(request).toEqual(before);
            });

            it('should not send them on a partial refund', async () => {
                captureBody(`${API_URL}/refunds`, {refund_id: CONSENT_ID});
                const request = {
                    type: 'partial_refund',
                    paymentId: PAYMENT_ID,
                    pcr: {...PCR},
                    amount: {...spelling.amount},
                    [spelling.surchargeOptionsKey]: surchargeOptions
                };
                const before = structuredClone(request);

                await client.createRefund(request as unknown as PartialRefundRequest);

                expect(sentBody).toEqual({
                    type: 'partial_refund',
                    payment_id: PAYMENT_ID,
                    pcr: PCR,
                    amount: {total: '100.00', currency: 'NZD'}
                });
                expect(request).toEqual(before);
            });
        });
    });
});

describe('stripReadOnlyRequestFields', () => {
    it('should strip only the amount fields and surcharge options', () => {
        const body = {
            amount: {total: '1.00', currency: 'NZD', surcharge: '0.01', total_charge: '1.01'},
            maximum_amount_payment: {total: '2.00', currency: 'NZD', surcharge: '0.02', total_charge: '2.02'},
            maximum_amount_period: {total: '3.00', currency: 'NZD', surcharge: '0.03', total_charge: '3.03'},
            surcharge_options: {bank: {surcharge: '0.01', total_charge: '1.01'}}
        };

        expect(stripReadOnlyRequestFields(body)).toEqual({
            amount: {total: '1.00', currency: 'NZD'},
            maximum_amount_payment: {total: '2.00', currency: 'NZD'},
            maximum_amount_period: {total: '3.00', currency: 'NZD'}
        });
    });

    it('should keep surcharge-named keys outside an amount', () => {
        const body = {
            pcr: {particulars: 'p', surcharge: 'kept', total_charge: 'kept'},
            flow: {detail: {type: 'gateway', surcharge: 'kept', surcharge_options: 'kept'}},
            surcharge: 'kept',
            total_charge: 'kept'
        };

        expect(stripReadOnlyRequestFields(body)).toEqual(body);
    });

    it('should not mutate the body it is given', () => {
        const body = {
            amount: {total: '1.00', currency: 'NZD', surcharge: '0.01', total_charge: '1.01'},
            surcharge_options: {bank: {surcharge: '0.01'}}
        };
        const before = structuredClone(body);

        stripReadOnlyRequestFields(body);

        expect(body).toEqual(before);
    });

    it.each([
        ['a string', 'raw body'],
        ['undefined', undefined],
        ['null', null],
        ['an array', [{amount: {total: '1.00', surcharge: '0.01'}}]]
    ])('should return %s unchanged', (_, body) => {
        expect(stripReadOnlyRequestFields(body)).toBe(body);
    });

    it('should leave a null amount as null', () => {
        expect(stripReadOnlyRequestFields({amount: null})).toEqual({amount: null});
    });
});

/**
 * ts-jest transpiles without type checking (isolatedModules), so the declared types are
 * checked here with the compiler API instead, as a strictNullChecks consumer would see them.
 */
describe('surcharge declared types', () => {
    const fileName = path.join(__dirname, 'surcharge-consumer.ts');
    const lines = [
        "import {Amount, AmountCurrencyEnum, Consent, SurchargeOption} from '../../src/dto/v1/index.js';",
        'declare const amount: Amount;',
        'declare const consent: Consent;',
        'declare const option: SurchargeOption;',
        'export const surcharge: string | null | undefined = amount.surcharge;',
        'export const totalCharge: string | null | undefined = amount.totalCharge;',
        'export const bankSurcharge: string | null | undefined = consent.surchargeOptions?.bank?.surcharge;',
        'export const cardTotalCharge: string | null | undefined = consent.surchargeOptions?.card?.totalCharge;',
        'export const maximumPayment: string | null | undefined = option.maximumAmountPayment?.totalCharge;',
        'export const maximumPeriod: string | null | undefined = option.maximumAmountPeriod?.surcharge;',
        "export const requestAmount: Amount = {total: '1.00', currency: AmountCurrencyEnum.NZD};",
        'export const unguardedSurcharge: string = amount.surcharge;'
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

    it.each(['surcharge', 'totalCharge', 'bankSurcharge', 'cardTotalCharge', 'maximumPayment', 'maximumPeriod'])(
        'should type %s as an optional, nullable string', declaration => {
            expect(errorCodesByLine.get(lineOf(declaration))).toBeUndefined();
        });

    it('should not require the read-only fields on an amount built for a request', () => {
        expect(errorCodesByLine.get(lineOf('requestAmount'))).toBeUndefined();
    });

    it('should reject a surcharge read as always present', () => {
        // TS2322: Type 'string | null | undefined' is not assignable to type 'string'
        expect(errorCodesByLine.get(lineOf('unguardedSurcharge'))).toEqual([2322]);
    });
});
