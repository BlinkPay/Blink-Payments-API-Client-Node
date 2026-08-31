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
    AccountNumberRefundRequest,
    Amount,
    AmountCurrencyEnum,
    AuthFlow,
    AuthFlowDetailTypeEnum,
    Bank, BlinkInvalidValueException,
    DecoupledFlow,
    EnduringConsentRequest,
    EnduringConsentsApiFactory,
    FullRefundRequest,
    IdentifierType,
    PartialRefundRequest,
    PaymentRequest,
    PaymentsApiFactory,
    Pcr,
    Period,
    RefundDetailTypeEnum,
    RefundsApiFactory,
    RefundStatusEnum,
    SingleConsentRequest,
    SingleConsentsApiFactory
} from '../../../src';
import {Configuration} from '../../../configuration';
import globalAxios from 'axios';
import {v4 as uuidv4} from 'uuid';
import {DateTime} from 'luxon';
import {GenericParameters} from "../../../src/util/types";

require('dotenv').config();
jest.setTimeout(120000);

describe('RefundsApi Integration Test', () => {
    const callbackUrl = 'https://www.mymerchant.co.nz/callback';
    const params: GenericParameters = {
        xCustomerIp: "192.168.0.1",
        xCustomerUserAgent: "demo-api-client"
    };
    let singleConsentsApiInstance: ReturnType<typeof SingleConsentsApiFactory>;
    let enduringConsentsApiInstance: ReturnType<typeof EnduringConsentsApiFactory>;
    let paymentsApiInstance: ReturnType<typeof PaymentsApiFactory>;
    let apiInstance: ReturnType<typeof RefundsApiFactory>;

    beforeAll(async (): Promise<void> => {
        const configuration: Configuration = new Configuration(globalAxios);

        singleConsentsApiInstance = SingleConsentsApiFactory(globalAxios, configuration, undefined);
        enduringConsentsApiInstance = EnduringConsentsApiFactory(globalAxios, configuration, undefined);
        paymentsApiInstance = PaymentsApiFactory(globalAxios, configuration, undefined);
        apiInstance = RefundsApiFactory(globalAxios, configuration, undefined);
    });

    beforeEach((): void => {
        params.requestId = uuidv4();
        params.xCorrelationId = uuidv4();
        params.idempotencyKey = uuidv4();
    });

    it('Verify that account number refund for single consent with decoupled flow is created and retrieved', async () => {
        // create single consent with decoupled flow
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

        const createConsentResponseAxiosResponse = await singleConsentsApiInstance.createSingleConsent(request,
                params);
        expect(createConsentResponseAxiosResponse).not.toBeNull();
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId
        };
        let paymentId;
        params.idempotencyKey = uuidv4();
        for (let i = 1; i <= 10; i++) {
            console.log(`attempt: ${i}`);
            try {
                const paymentResponse = await paymentsApiInstance.createPayment(paymentRequest,
                        params);

                expect(paymentResponse).not.toBeNull();
                const payment = paymentResponse.data;
                paymentId = payment.paymentId;

                break;
            } catch (error) {
                // sleep incrementally
                await new Promise(resolve => setTimeout(resolve, 2000 * i));
            }
        }

        expect(paymentId).not.toBeNull();

        // create account number refund
        const refundRequest: AccountNumberRefundRequest = {
            type: RefundDetailTypeEnum.AccountNumber,
            paymentId: paymentId
        }
        const refundResponseAxiosResponse = await apiInstance.createRefund(refundRequest);

        expect(refundResponseAxiosResponse).not.toBeNull();
        const refundResponse = refundResponseAxiosResponse.data;
        const refundId = refundResponse.refundId;
        expect(refundId).not.toBeNull();

        // retrieve account number refund
        const refundAxiosResponse = await apiInstance.getRefund(refundId);
        expect(refundAxiosResponse).not.toBeNull();
        const refund = refundAxiosResponse.data;
        expect(refund).not.toBeNull();
        expect(refund.status).toEqual(RefundStatusEnum.Completed);
        expect(refund.accountNumber).not.toBeNull();
        expect(refund.accountNumber.startsWith("99-")).toBeTruthy();
        expect(refund.accountNumber.endsWith("-00")).toBeTruthy();
        expect(refund.creationTimestamp).not.toEqual(new Date(0));
        expect(refund.statusUpdatedTimestamp).not.toEqual(new Date(0));
        const accountNumberRefundRequest = refund.detail as AccountNumberRefundRequest;
        expect(accountNumberRefundRequest.paymentId).toEqual(paymentId);
        expect(accountNumberRefundRequest.type).toEqual(RefundDetailTypeEnum.AccountNumber);
    });

    it('Verify that account number refund for enduring consent with decoupled flow is created and retrieved', async () => {
        // create enduring consent with decoupled flow
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

        const createConsentResponseAxiosResponse = await enduringConsentsApiInstance.createEnduringConsent(request,
                params);
        expect(createConsentResponseAxiosResponse).not.toBeNull();
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId,
            amount: {
                total: "45.00",
                currency: AmountCurrencyEnum.NZD
            } as Amount,
            pcr: {
                particulars: "particulars",
                code: "code",
                reference: "reference"
            } as Pcr
        };
        let paymentId;
        params.idempotencyKey = uuidv4();
        for (let i = 1; i <= 10; i++) {
            console.log(`attempt: ${i}`);
            try {
                const paymentResponse = await paymentsApiInstance.createPayment(paymentRequest,
                        params);

                expect(paymentResponse).not.toBeNull();
                const payment = paymentResponse.data;
                paymentId = payment.paymentId;

                break;
            } catch (error) {
                // sleep incrementally
                await new Promise(resolve => setTimeout(resolve, 2000 * i));
            }
        }

        expect(paymentId).not.toBeNull();

        // create account number refund
        const refundRequest: AccountNumberRefundRequest = {
            type: RefundDetailTypeEnum.AccountNumber,
            paymentId: paymentId
        }
        const refundResponseAxiosResponse = await apiInstance.createRefund(refundRequest);

        expect(refundResponseAxiosResponse).not.toBeNull();
        const refundResponse = refundResponseAxiosResponse.data;
        const refundId = refundResponse.refundId;
        expect(refundId).not.toBeNull();

        // retrieve account number refund
        const refundAxiosResponse = await apiInstance.getRefund(refundId);
        expect(refundAxiosResponse).not.toBeNull();
        const refund = refundAxiosResponse.data;
        expect(refund).not.toBeNull();
        expect(refund.status).toEqual(RefundStatusEnum.Completed);
        expect(refund.accountNumber).not.toBeNull();
        expect(refund.accountNumber.startsWith("99-")).toBeTruthy();
        expect(refund.accountNumber.endsWith("-00")).toBeTruthy();
        expect(refund.creationTimestamp).not.toEqual(new Date(0));
        expect(refund.statusUpdatedTimestamp).not.toEqual(new Date(0));
        const accountNumberRefundRequest = refund.detail as AccountNumberRefundRequest;
        expect(accountNumberRefundRequest.paymentId).toEqual(paymentId);
        expect(accountNumberRefundRequest.type).toEqual(RefundDetailTypeEnum.AccountNumber);
    });

    it('Verify that full refund for single consent with decoupled flow is created and retrieved', async () => {
        // create single consent with decoupled flow
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

        const createConsentResponseAxiosResponse = await singleConsentsApiInstance.createSingleConsent(request,
                params);
        expect(createConsentResponseAxiosResponse).not.toBeNull();
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId
        };
        let paymentId;
        params.idempotencyKey = uuidv4();
        for (let i = 1; i <= 10; i++) {
            console.log(`attempt: ${i}`);
            try {
                const paymentResponse = await paymentsApiInstance.createPayment(paymentRequest,
                        params);

                expect(paymentResponse).not.toBeNull();
                const payment = paymentResponse.data;
                paymentId = payment.paymentId;

                break;
            } catch (error) {
                // sleep incrementally
                await new Promise(resolve => setTimeout(resolve, 2000 * i));
            }
        }

        expect(paymentId).not.toBeNull();

        // create full refund
        const refundRequest: FullRefundRequest = {
            type: RefundDetailTypeEnum.FullRefund,
            paymentId: paymentId,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr,
            consentRedirect: callbackUrl
        }

        try {
            await apiInstance.createRefund(refundRequest);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkInvalidValueException);
            expect(e.message).toBe("Refund type [full_refund] is not yet supported for open banking payments — use an account-number refund instead, or contact BlinkPay");
        }
    });

    it('Verify that partial refund for single consent with decoupled flow is created and retrieved', async () => {
        // create single consent with decoupled flow
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

        const createConsentResponseAxiosResponse = await singleConsentsApiInstance.createSingleConsent(request,
                params);
        expect(createConsentResponseAxiosResponse).not.toBeNull();
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // create payment
        const paymentRequest: PaymentRequest = {
            consentId: consentId
        };
        let paymentId;
        params.idempotencyKey = uuidv4();
        for (let i = 1; i <= 10; i++) {
            console.log(`attempt: ${i}`);
            try {
                const paymentResponse = await paymentsApiInstance.createPayment(paymentRequest,
                        params);

                expect(paymentResponse).not.toBeNull();
                const payment = paymentResponse.data;
                paymentId = payment.paymentId;

                break;
            } catch (error) {
                // sleep incrementally
                await new Promise(resolve => setTimeout(resolve, 2000 * i));
            }
        }

        expect(paymentId).not.toBeNull();

        // create partial refund
        const refundRequest: PartialRefundRequest = {
            type: RefundDetailTypeEnum.PartialRefund,
            paymentId: paymentId,
            pcr: {
                particulars: 'particulars',
                code: 'code',
                reference: 'reference'
            } as Pcr,
            consentRedirect: callbackUrl,
            amount: {
                total: "25.00",
                currency: AmountCurrencyEnum.NZD
            } as Amount
        }

        try {
            await apiInstance.createRefund(refundRequest);
        } catch (e) {
            expect(e).toBeInstanceOf(BlinkInvalidValueException);
            expect(e.message).toBe("Refund type [partial_refund] is not yet supported for open banking payments — use an account-number refund instead, or contact BlinkPay");
        }
    });
});
