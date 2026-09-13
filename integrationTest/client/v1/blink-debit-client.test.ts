/**
 * Copyright (c) 2023 BlinkPay
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

import {
    Amount,
    AmountCurrencyEnum,
    AuthFlow,
    AuthFlowDetailTypeEnum,
    Bank,
    BankMetadata,
    BlinkConsentRejectedException,
    BlinkConsentTimeoutException,
    BlinkDebitClient,
    BlinkResourceNotFoundException,
    BlinkServiceException,
    ConsentDetailTypeEnum,
    ConsentStatusEnum,
    DecoupledFlow,
    EnduringConsentRequest,
    FlowHintTypeEnum,
    GatewayFlow,
    IdentifierType,
    PaymentAcceptedReasonEnum,
    PaymentRequest,
    PaymentStatusEnum,
    PaymentTypeEnum,
    Pcr,
    Period,
    QuickPaymentRequest,
    RedirectFlow,
    SingleConsentRequest
} from '../../../src';
import {v4 as uuidv4} from 'uuid';
import {DateTime} from 'luxon';
import globalAxios from 'axios';
import {GenericParameters} from "../../../src/util/types";

require('dotenv').config();
jest.setTimeout(180000);

describe('BlinkDebitClient Integration Tests', () => {
    const redirectUrl = "https://www.blinkpay.co.nz/sample-merchant-return-page";
    const callbackUrl = "https://www.mymerchant.co.nz/callback";
    const params: GenericParameters = {
        xCustomerIp: "192.168.0.1",
        xCustomerUserAgent: "demo-api-client"
    };
    let instance: BlinkDebitClient;

    beforeAll((): void => {
        instance = new BlinkDebitClient(globalAxios);
    });

    beforeEach((): void => {
        params.requestId = uuidv4();
        params.xCorrelationId = uuidv4();
        params.idempotencyKey = uuidv4();
    });

    it('Verify that bank metadata is retrieved', async () => {
        const actual = await instance.getMeta();
        expect(actual).toBeInstanceOf(Array);
        expect(actual.length).toBeGreaterThanOrEqual(1);

        // Verify each bank has required fields
        actual.forEach((bank: BankMetadata) => {
            expect(bank.name).toBeDefined();
            expect(bank.features).toBeDefined();
        });
    });

    it("Verify that timed out single consent is handled", async () => {
        // create
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Redirect,
                    bank: Bank.PNZ,
                    redirectUri: redirectUrl
                } as RedirectFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).not.toEqual('');
        expect(createConsentResponse.redirectUri.startsWith('https://api-nomatls.apicentre.middleware.co.nz/oauth/v2.0/authorize?scope=openid%20payments&response_type=code%20id_token&request=')).toBeTruthy();

        // retrieve
        try {
            await instance.awaitAuthorisedSingleConsent(consentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkConsentTimeoutException);
            expect(e.message).toBe("Consent timed out");
        }
    });

    it("Verify that non-existent single consent is handled", async () => {
        const consentId = uuidv4();

        try {
            await instance.awaitAuthorisedSingleConsent(consentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toBe(`Consent with ID [${consentId}] does not exist`);
        }
    });

    it("Verify that single consent with decoupled flow is retrieved", async () => {
        // create
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve
        const consent = await instance.awaitAuthorisedSingleConsent(consentId, 30);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: SingleConsentRequest = consent.detail as SingleConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');
    });

    it("Verify that timed out single consent is handled (using exception)", async () => {
        // create
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Redirect,
                    bank: Bank.PNZ,
                    redirectUri: redirectUrl
                } as RedirectFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request, params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).not.toEqual('');
        expect(createConsentResponse.redirectUri.startsWith('https://api-nomatls.apicentre.middleware.co.nz/oauth/v2.0/authorize?scope=openid%20payments&response_type=code%20id_token&request=')).toBeTruthy();

        // retrieve
        try {
            await instance.awaitAuthorisedSingleConsentOrThrowException(consentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkConsentTimeoutException);
            expect(e.message).toBe("Consent timed out");
        }
    });

    it("Verify that non-existent single consent is handled (using exception)", async () => {
        const consentId = uuidv4();

        try {
            await instance.awaitAuthorisedSingleConsentOrThrowException(consentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toBe(`Consent with ID [${consentId}] does not exist`);
        }
    });

    it("Verify that single consent with decoupled flow is retrieved (using exception)", async () => {
        // create
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve
        const consent = await instance.awaitAuthorisedSingleConsentOrThrowException(consentId, 60);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: SingleConsentRequest = consent.detail as SingleConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');
    });

    it('Verify that timed out enduring consent is handled', async () => {
        // create
        const now = DateTime.now().setZone('Pacific/Auckland');
        const request: EnduringConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Redirect,
                    bank: Bank.PNZ,
                    redirectUri: redirectUrl
                } as RedirectFlow
            } as AuthFlow,
            maximumAmountPeriod: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            maximumAmountPayment: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            fromTimestamp: now.toJSDate(),
            period: Period.Fortnightly
        };

        const createConsentResponse = await instance.createEnduringConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).not.toEqual('');
        expect(createConsentResponse.redirectUri.startsWith('https://api-nomatls.apicentre.middleware.co.nz/oauth/v2.0/authorize?scope=openid%20payments&response_type=code%20id_token&request=')).toBeTruthy();

        // retrieve
        try {
            await instance.awaitAuthorisedEnduringConsent(consentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkConsentTimeoutException);
            expect(e.message).toBe("Consent timed out");
        }
    });

    it('Verify that non-existent enduring consent is handled', async () => {
        const consentId = uuidv4();

        try {
            await instance.awaitAuthorisedEnduringConsent(consentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toBe(`Consent with ID [${consentId}] does not exist`);
        }
    });

    it('Verify that enduring consent with decoupled flow is retrieved', async () => {

        // create
        const now = DateTime.now().setZone('Pacific/Auckland');
        const request: EnduringConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            maximumAmountPeriod: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            maximumAmountPayment: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            fromTimestamp: now.toJSDate(),
            period: Period.Fortnightly
        };

        const createConsentResponse = await instance.createEnduringConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve
        const consent = await instance.awaitAuthorisedEnduringConsent(consentId, 30);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: EnduringConsentRequest = consent.detail as EnduringConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.period).toEqual(Period.Fortnightly);

        expect(detail.maximumAmountPeriod).not.toBeNull();
        expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.maximumAmountPeriod.total).toEqual('50.00');
    });

    it('Verify that timed out enduring consent is handled (using exception)', async () => {
        const now = DateTime.now().setZone('Pacific/Auckland');
        const request: EnduringConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Redirect,
                    bank: Bank.PNZ,
                    redirectUri: redirectUrl
                } as RedirectFlow
            } as AuthFlow,
            maximumAmountPeriod: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            maximumAmountPayment: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            fromTimestamp: now.toJSDate(),
            period: Period.Fortnightly
        };

        const createConsentResponse = await instance.createEnduringConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).not.toEqual('');
        expect(createConsentResponse.redirectUri.startsWith('https://api-nomatls.apicentre.middleware.co.nz/oauth/v2.0/authorize?scope=openid%20payments&response_type=code%20id_token&request=')).toBeTruthy();

        // retrieve
        try {
            await instance.awaitAuthorisedEnduringConsentOrThrowException(consentId, 1);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkConsentTimeoutException);
            expect(e.message).toBe("Consent timed out");
        }
    });

    it('Verify that non-existent enduring consent is handled', async () => {
        const consentId = uuidv4();

        try {
            await instance.awaitAuthorisedEnduringConsentOrThrowException(consentId, 30);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toBe(`Consent with ID [${consentId}] does not exist`);
        }
    });

    it('Verify that enduring consent with decoupled flow is retrieved', async () => {
        // create
        const now = DateTime.now().setZone('Pacific/Auckland');
        const request: EnduringConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            maximumAmountPeriod: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            maximumAmountPayment: {
                currency: AmountCurrencyEnum.NZD,
                total: '50.00'
            } as Amount,
            fromTimestamp: now.toJSDate(),
            period: Period.Fortnightly
        };

        const createConsentResponse = await instance.createEnduringConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve
        let consent = await instance.awaitAuthorisedEnduringConsentOrThrowException(consentId, 30);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: EnduringConsentRequest = consent.detail as EnduringConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.period).toEqual(Period.Fortnightly);

        expect(detail.maximumAmountPeriod).not.toBeNull();
        expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.maximumAmountPeriod.total).toEqual('50.00');
    });

    it('Verify that timed out quick payment is handled', async () => {
        // create
        const request: QuickPaymentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Redirect,
                    bank: Bank.PNZ,
                    redirectUri: redirectUrl
                } as RedirectFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createQuickPaymentResponse = await instance.createQuickPayment(request,
                params);

        expect(createQuickPaymentResponse).toBeDefined();

        const quickPaymentId = createQuickPaymentResponse.quickPaymentId;
        expect(quickPaymentId).not.toBeNull();
        expect(createQuickPaymentResponse.redirectUri).not.toEqual('');

        // retrieve
        try {
            await instance.awaitSuccessfulQuickPayment(quickPaymentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkConsentTimeoutException);
            expect(e.message).toEqual('Consent timed out');
        }
    });

    it('Verify that non-existent quick payment is handled', async () => {
        const quickPaymentId = uuidv4();

        try {
            await instance.awaitSuccessfulQuickPayment(quickPaymentId, 30);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toEqual(`Quick payment with ID [${quickPaymentId}] does not exist`);
        }
    });

    it('Verify that quick payment with decoupled flow is retrieved', async () => {
        // create
        const request: QuickPaymentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: "+64-259531933",
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createQuickPaymentResponse = await instance.createQuickPayment(request,
                params);

        expect(createQuickPaymentResponse).toBeDefined();

        const quickPaymentId = createQuickPaymentResponse.quickPaymentId;
        expect(quickPaymentId).not.toBeNull();
        expect(createQuickPaymentResponse.redirectUri).not.toEqual('');

        // retrieve
        const quickPayment = await instance.awaitSuccessfulQuickPayment(quickPaymentId, 60);
        expect(quickPayment).not.toBeNull();
        const consent = quickPayment.consent;
        expect([ConsentStatusEnum.Consumed, ConsentStatusEnum.Authorised]).toContain(consent.status);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toHaveLength(1);
        const payment = consent.payments[0];
        expect(payment.paymentId).not.toBeNull();
        expect(payment.type).toBe(PaymentTypeEnum.Single);
        // Payment can be Pending or AcceptedSettlementCompleted depending on sandbox timing
        expect([PaymentStatusEnum.Pending, PaymentStatusEnum.AcceptedSettlementCompleted]).toContain(payment.status);
        if (payment.status === PaymentStatusEnum.AcceptedSettlementCompleted) {
            expect(payment.acceptedReason).toBe(PaymentAcceptedReasonEnum.SourceBankPaymentSent);
        }
        expect(payment.refunds).toHaveLength(0);
        expect(payment.creationTimestamp).not.toBe(new Date(0));
        expect(payment.statusUpdatedTimestamp).not.toBe(new Date(0));
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: QuickPaymentRequest = consent.detail as QuickPaymentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');
    });

    it('Verify that timed out quick payment is handled (using exception)', async () => {
        // create
        const request: QuickPaymentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Redirect,
                    bank: Bank.PNZ,
                    redirectUri: redirectUrl
                } as RedirectFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createQuickPaymentResponse = await instance.createQuickPayment(request,
                params);

        expect(createQuickPaymentResponse).toBeDefined();

        const quickPaymentId = createQuickPaymentResponse.quickPaymentId;
        expect(quickPaymentId).not.toBeNull();
        expect(createQuickPaymentResponse.redirectUri).not.toEqual('');

        // retrieve
        try {
            await instance.awaitSuccessfulQuickPaymentOrThrowException(quickPaymentId, 2);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkConsentTimeoutException);
            expect(e.message).toEqual('Consent timed out');
        }
    });

    it('Verify that non-existent quick payment is handled (using exception)', async () => {
        const quickPaymentId = uuidv4();

        try {
            await instance.awaitSuccessfulQuickPaymentOrThrowException(quickPaymentId, 30);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toEqual(`Quick payment with ID [${quickPaymentId}] does not exist`);
        }
    });

    it('Verify that quick payment with decoupled flow is retrieved (using exception)', async () => {
        // create
        const request: QuickPaymentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: "+64-259531933",
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createQuickPaymentResponse = await instance.createQuickPayment(request,
                params);

        expect(createQuickPaymentResponse).toBeDefined();

        const quickPaymentId = createQuickPaymentResponse.quickPaymentId;
        expect(quickPaymentId).not.toBeNull();
        expect(createQuickPaymentResponse.redirectUri).not.toEqual('');

        // retrieve
        const quickPayment = await instance.awaitSuccessfulQuickPaymentOrThrowException(quickPaymentId, 60);
        expect(quickPayment).not.toBeNull();
        const consent = quickPayment.consent;
        const validStatuses = [ConsentStatusEnum.Consumed, ConsentStatusEnum.Authorised];
        expect(validStatuses).toContain(consent.status);
        expect(consent.cardNetwork).toBeUndefined();
        if (consent.status == ConsentStatusEnum.Consumed) {
            expect(consent.payments).toHaveLength(1);
        } else {
            // Authorised status can have 0 or 1 payments (payment may be pending)
            expect(consent.payments.length).toBeLessThanOrEqual(1);
        }
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: QuickPaymentRequest = consent.detail as QuickPaymentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');
    });

    it("Verify that revoked quick payment with gateway flow is handled", async () => {
        // create
        const request: QuickPaymentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Gateway,
                    redirectUri: redirectUrl,
                    flowHint: {
                        type: FlowHintTypeEnum.Redirect,
                        bank: Bank.PNZ,
                    }
                } as GatewayFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createQuickPaymentResponse = await instance.createQuickPayment(request,
                params);
        expect(createQuickPaymentResponse).not.toBeNull();

        const quickPaymentId = createQuickPaymentResponse.quickPaymentId;
        expect(quickPaymentId).not.toBeNull();

        const redirectUri = createQuickPaymentResponse.redirectUri;
        expect(redirectUri.endsWith('/gateway/pay?id=' + quickPaymentId)).toBeTruthy();

        // revoke
        await instance.revokeQuickPaymentAsync(quickPaymentId);

        // retrieve
        try {
            await instance.awaitSuccessfulQuickPaymentOrThrowException(quickPaymentId, 30);
        } catch (exception) {
            expect(exception).toBeInstanceOf(BlinkConsentRejectedException);
            expect(exception.message).toEqual(`Quick payment [${quickPaymentId}] has been rejected or revoked`);
        }
    });

    it("Verify that timed out payment is handled", async () => {
        // create consent
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve consent
        const consent = await instance.awaitAuthorisedSingleConsent(consentId, 60);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: SingleConsentRequest = consent.detail as SingleConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');

        // sleep for 5 seconds
        jest.useRealTimers();
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(5000);

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId
        };

        const paymentResponse = await instance.createPayment(paymentRequest);
        expect(paymentResponse).not.toBeNull();
        const paymentId = paymentResponse.paymentId;

        // retrieve payment
        try {
            await instance.awaitSuccessfulPayment(paymentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkServiceException);
            expect(e.message).toEqual("Payment timed out");
        }
    });

    it("Verify that non-existent payment is handled", async () => {
        const paymentId = uuidv4();

        try {
            await instance.awaitSuccessfulPayment(paymentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toBe(`Payment with ID [${paymentId}] does not exist`);
        }
    });

    it("Verify that payment is created and retrieved", async () => {
        // create consent
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve consent
        const consent = await instance.awaitAuthorisedSingleConsent(consentId, 60);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: SingleConsentRequest = consent.detail as SingleConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');

        // sleep for 5 seconds
        jest.useRealTimers();
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        await delay(5000);

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId
        };

        const paymentResponse = await instance.createPayment(paymentRequest);
        expect(paymentResponse).not.toBeNull();
        const paymentId = paymentResponse.paymentId;

        // retrieve payment
        const payment = await instance.awaitSuccessfulPayment(paymentId, 30);

        expect(payment).not.toBeNull();
        expect(payment.type).toEqual(PaymentTypeEnum.Single);
        expect(payment.status).toEqual(PaymentStatusEnum.AcceptedSettlementCompleted);
        expect(payment.acceptedReason).toEqual(PaymentAcceptedReasonEnum.SourceBankPaymentSent)
        expect(payment.paymentId).not.toBeNull();
        expect(payment.creationTimestamp).not.toBeNull();
        expect(payment.statusUpdatedTimestamp).not.toBeNull();

        const paymentDetail = payment.detail as PaymentRequest;
        expect(paymentDetail).not.toBeNull();
        expect(paymentDetail.consentId).toEqual(consentId);
        expect(paymentDetail.pcr).toBeUndefined();
        expect(paymentDetail.amount).toEqual(request.amount);
        expect(payment.refunds).toHaveLength(0);
    });

    it("Verify that timed out payment is handled (using exception)", async () => {
        // create consent
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve consent
        const consent = await instance.awaitAuthorisedSingleConsent(consentId, 30);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: SingleConsentRequest = consent.detail as SingleConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId
        };

        const paymentResponse = await instance.createPayment(paymentRequest);
        expect(paymentResponse).not.toBeNull();
        const paymentId = paymentResponse.paymentId;

        // retrieve payment
        try {
            await instance.awaitSuccessfulPaymentOrThrowException(paymentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkServiceException);
            expect(e.message).toEqual("Payment timed out");
        }
    });

    it("Verify that non-existent payment is handled (using exception)", async () => {
        const paymentId = uuidv4();

        try {
            await instance.awaitSuccessfulPaymentOrThrowException(paymentId, 5);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkResourceNotFoundException);
            expect(e.message).toBe(`Payment with ID [${paymentId}] does not exist`);
        }
    });

    it("Verify that payment is created and retrieved (using exception)", async () => {
        // create consent
        const request: SingleConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Decoupled,
                    bank: Bank.PNZ,
                    identifierType: IdentifierType.PhoneNumber,
                    identifierValue: '+64-259531933',
                    callbackUrl: callbackUrl
                } as DecoupledFlow
            } as AuthFlow,
            amount: {
                currency: AmountCurrencyEnum.NZD,
                total: '1.25'
            } as Amount,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr
        };

        const createConsentResponse = await instance.createSingleConsent(request,
                params);
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve consent
        const consent = await instance.awaitAuthorisedSingleConsent(consentId, 60);
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Authorised);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        const detail: SingleConsentRequest = consent.detail as SingleConsentRequest;
        expect(detail.type).toEqual(ConsentDetailTypeEnum.Single);

        expect(detail.flow).not.toBeNull();
        const flow: DecoupledFlow = detail.flow.detail as DecoupledFlow;
        expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
        expect(flow.bank).toEqual(Bank.PNZ);
        expect(flow.callbackUrl).toEqual(callbackUrl);
        expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
        expect(flow.identifierValue).toEqual('+64-259531933');

        expect(detail.pcr).not.toBeNull();
        expect(detail.pcr.particulars).toEqual('particulars');
        expect(detail.pcr.code).toEqual('code');
        expect(detail.pcr.reference).toEqual('reference');

        expect(detail.amount).not.toBeNull();
        expect(detail.amount.currency).toEqual(AmountCurrencyEnum.NZD);
        expect(detail.amount.total).toEqual('1.25');

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId
        };

        const paymentResponse = await instance.createPayment(paymentRequest);
        expect(paymentResponse).not.toBeNull();
        const paymentId = paymentResponse.paymentId;

        // retrieve payment
        const payment = await instance.awaitSuccessfulPaymentOrThrowException(paymentId, 10);

        expect(payment).not.toBeNull();
        expect(payment.type).toEqual(PaymentTypeEnum.Single);
        expect(payment.status).toEqual(PaymentStatusEnum.AcceptedSettlementCompleted);
        expect(payment.acceptedReason).toEqual(PaymentAcceptedReasonEnum.SourceBankPaymentSent)
        expect(payment.paymentId).not.toBeNull();
        expect(payment.creationTimestamp).not.toBeNull();
        expect(payment.statusUpdatedTimestamp).not.toBeNull();

        const paymentDetail = payment.detail as PaymentRequest;
        expect(paymentDetail).not.toBeNull();
        expect(paymentDetail.consentId).toEqual(consentId);
        expect(paymentDetail.pcr).toBeUndefined();
        expect(paymentDetail.amount).toEqual(request.amount);

        expect(payment.refunds).toHaveLength(0);
    });
});
