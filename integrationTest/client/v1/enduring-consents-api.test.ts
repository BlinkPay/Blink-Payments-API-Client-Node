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
    ConsentDetailTypeEnum,
    ConsentStatusEnum,
    DecoupledFlow,
    DecoupledFlowHint,
    EnduringConsentRequest,
    EnduringConsentsApiFactory,
    FlowHintTypeEnum,
    GatewayFlow,
    IdentifierType,
    Period,
    RedirectFlow,
    RedirectFlowHint
} from '../../../src';
import {Configuration} from '../../../configuration';
import globalAxios from 'axios';
import {v4 as uuidv4} from 'uuid';
import {DateTime} from 'luxon';
import {GenericParameters} from "../../../src/util/types";

require('dotenv').config();
jest.setTimeout(60000);

describe('EnduringConsentsApi Integration Test', () => {
    const redirectUri = 'https://www.blinkpay.co.nz/sample-merchant-return-page';
    const callbackUrl = 'https://www.mymerchant.co.nz/callback';
    const params: GenericParameters = {
        xCustomerIp: "192.168.0.1",
        xCustomerUserAgent: "demo-api-client"
    };
    let apiInstance: ReturnType<typeof EnduringConsentsApiFactory>;

    beforeAll(async (): Promise<void> => {
        const configuration: Configuration = new Configuration(globalAxios);

        apiInstance = EnduringConsentsApiFactory(globalAxios, configuration, undefined);
    });

    beforeEach((): void => {
        params.requestId = uuidv4();
        params.xCorrelationId = uuidv4();
        params.idempotencyKey = uuidv4();
    });

    it('Verify that enduring consent with redirect flow is created in PNZ', async () => {
        // create
        const now = DateTime.now().setZone('Pacific/Auckland');
        const request: EnduringConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Redirect,
                    bank: Bank.PNZ,
                    redirectUri: redirectUri
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

        const createConsentResponseAxiosResponse = await apiInstance.createEnduringConsent(request,
                params);
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).not.toEqual('');
        expect(createConsentResponse.redirectUri.startsWith('https://api-nomatls.apicentre.middleware.co.nz/oauth/v2.0/authorize?scope=openid%20payments&response_type=code%20id_token&request=')).toBeTruthy();

        // retrieve
        let consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse).not.toBeNull();
        let consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.AwaitingAuthorisation);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isRedirectFlow(detail.flow.detail)) {
                const flow: RedirectFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Redirect);
                expect(flow.bank).toEqual(Bank.PNZ);
                expect(flow.redirectUri).toEqual(redirectUri);
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }

        // revoke
        await apiInstance.revokeEnduringConsent(consentId);

        consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse).not.toBeNull();
        consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Revoked);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isRedirectFlow(detail.flow.detail)) {
                const flow: RedirectFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Redirect);
                expect(flow.bank).toEqual(Bank.PNZ);
                expect(flow.redirectUri).toEqual(redirectUri);
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }
    });

    it('Verify that rejected enduring consent with redirect flow is retrieved from PNZ', async () => {
        const consentAxiosResponse = await apiInstance.getEnduringConsent("f0b5fc9e-afa2-441f-a9e7-e2131952b835");
        expect(consentAxiosResponse).not.toBeNull();

        const consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Rejected);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isRedirectFlow(detail.flow.detail)) {
                const flow: RedirectFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Redirect);
                expect(flow.bank).toEqual(Bank.PNZ);
                expect(flow.redirectUri).toEqual(redirectUri);
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }
    });

    it('Verify that enduring consent with decoupled flow is created in PNZ', async () => {
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

        const createConsentResponseAxiosResponse = await apiInstance.createEnduringConsent(request,
                params);
        expect(createConsentResponseAxiosResponse).not.toBeNull();
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).toBeUndefined();

        // retrieve
        let consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse).not.toBeNull();
        let consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.AwaitingAuthorisation);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isDecoupledFlow(detail.flow.detail)) {
                const flow: DecoupledFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
                expect(flow.bank).toEqual(Bank.PNZ);
                expect(flow.callbackUrl).toEqual(callbackUrl);
                expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
                expect(['+64-259531933', null]).toContain(flow.identifierValue);
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }

        // revoke
        await apiInstance.revokeEnduringConsent(consentId);

        consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse.status).toEqual(200);
        consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Revoked);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isDecoupledFlow(detail.flow.detail)) {
                const flow: DecoupledFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Decoupled);
                expect(flow.bank).toEqual(Bank.PNZ);
                expect(flow.callbackUrl).toEqual(callbackUrl);
                expect(flow.identifierType).toEqual(IdentifierType.PhoneNumber);
                expect(['+64-259531933', null]).toContain(flow.identifierValue);
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }
    });

    it('Verify that enduring consent with gateway flow and redirect flow hint is created in PNZ', async () => {
        // create
        const now = DateTime.now().setZone('Pacific/Auckland');
        const request: EnduringConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Gateway,
                    redirectUri: redirectUri,
                    flowHint: {
                        type: FlowHintTypeEnum.Redirect,
                        bank: Bank.PNZ
                    } as RedirectFlowHint
                } as GatewayFlow
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

        const createConsentResponseAxiosResponse = await apiInstance.createEnduringConsent(request,
                params);
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri).not.toEqual('');
        expect(createConsentResponse.redirectUri.endsWith('/gateway/pay?id=' + consentId)).toBeTruthy();

        // retrieve
        let consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse).not.toBeNull();
        let consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.GatewayAwaitingSubmission);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isGatewayFlow(detail.flow.detail)) {
                const flow: GatewayFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Gateway);
                expect(flow.redirectUri).toEqual(redirectUri);

                expect(flow.flowHint).not.toBeNull();
                if (isRedirectFlowHint(flow.flowHint)) {
                    const flowHint: RedirectFlowHint = flow.flowHint;
                    expect(flowHint.type).toEqual(FlowHintTypeEnum.Redirect)
                    expect(flowHint.bank).toEqual(Bank.PNZ);
                }
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }

        // revoke
        await apiInstance.revokeEnduringConsent(consentId);

        consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse).not.toBeNull();
        consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Revoked);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isGatewayFlow(detail.flow.detail)) {
                const flow: GatewayFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Gateway);
                expect(flow.redirectUri).toEqual(redirectUri);

                expect(flow.flowHint).not.toBeNull();
                if (isRedirectFlowHint(flow.flowHint)) {
                    const flowHint: RedirectFlowHint = flow.flowHint;
                    expect(flowHint.type).toEqual(FlowHintTypeEnum.Redirect)
                    expect(flowHint.bank).toEqual(Bank.PNZ);
                }
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }
    });

    it('Verify that enduring consent with gateway flow and decoupled flow hint is created in PNZ', async () => {
        // create
        const now = DateTime.now().setZone('Pacific/Auckland');
        const request: EnduringConsentRequest = {
            flow: {
                detail: {
                    type: AuthFlowDetailTypeEnum.Gateway,
                    redirectUri: redirectUri,
                    flowHint: {
                        type: FlowHintTypeEnum.Decoupled,
                        bank: Bank.PNZ,
                        identifierType: IdentifierType.PhoneNumber,
                        identifierValue: '+64-259531933'
                    } as DecoupledFlowHint
                } as GatewayFlow
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

        const createConsentResponseAxiosResponse = await apiInstance.createEnduringConsent(request,
                params);
        expect(createConsentResponseAxiosResponse).not.toBeNull();
        const createConsentResponse = createConsentResponseAxiosResponse.data;
        expect(createConsentResponse).not.toBeNull();

        const consentId = createConsentResponse.consentId;
        expect(consentId).not.toBeNull();
        expect(createConsentResponse.redirectUri.endsWith('/gateway/pay?id=' + consentId)).toBeTruthy();

        // retrieve
        let consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse).not.toBeNull();
        let consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.GatewayAwaitingSubmission);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isGatewayFlow(detail.flow.detail)) {
                const flow: GatewayFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Gateway);
                expect(flow.redirectUri).toEqual(redirectUri);

                expect(flow.flowHint).not.toBeNull();
                if (isDecoupledFlowHint(flow.flowHint)) {
                    const flowHint: DecoupledFlowHint = flow.flowHint;
                    expect(flowHint.type).toEqual(FlowHintTypeEnum.Decoupled)
                    expect(flowHint.bank).toEqual(Bank.PNZ);
                    expect(flowHint.identifierType).toEqual(IdentifierType.PhoneNumber);
                    expect(flowHint.identifierValue).toEqual('+64-259531933');
                }
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }

        // revoke
        await apiInstance.revokeEnduringConsent(consentId);

        consentAxiosResponse = await apiInstance.getEnduringConsent(consentId);
        expect(consentAxiosResponse.status).toEqual(200);
        consent = consentAxiosResponse.data;
        expect(consent).not.toBeNull();
        expect(consent.status).toEqual(ConsentStatusEnum.Revoked);
        expect(consent.cardNetwork).toBeUndefined();
        expect(consent.payments).toEqual([]);
        expect(consent.creationTimestamp).not.toBeNull();
        expect(consent.statusUpdatedTimestamp).not.toBeNull();

        expect(consent.detail).not.toBeNull();
        if (isEnduringConsentRequest(consent.detail)) {
            const detail: EnduringConsentRequest = consent.detail;
            expect(detail.type).toEqual(ConsentDetailTypeEnum.Enduring);

            expect(detail.flow).not.toBeNull();
            if (isGatewayFlow(detail.flow.detail)) {
                const flow: GatewayFlow = detail.flow.detail;
                expect(flow.type).toEqual(AuthFlowDetailTypeEnum.Gateway);
                expect(flow.redirectUri).toEqual(redirectUri);

                expect(flow.flowHint).not.toBeNull();
                if (isDecoupledFlowHint(flow.flowHint)) {
                    const flowHint: DecoupledFlowHint = flow.flowHint;
                    expect(flowHint.type).toEqual(FlowHintTypeEnum.Decoupled)
                    expect(flowHint.bank).toEqual(Bank.PNZ);
                    expect(flowHint.identifierType).toEqual(IdentifierType.PhoneNumber);
                    expect(['+64-259531933', null]).toContain(flowHint.identifierValue);
                }
            }

            expect(detail.period).toEqual(Period.Fortnightly);

            expect(detail.maximumAmountPeriod).not.toBeNull();
            expect(detail.maximumAmountPeriod.currency).toEqual(AmountCurrencyEnum.NZD);
            expect(detail.maximumAmountPeriod.total).toEqual('50.00');
        }
    });
});

function isEnduringConsentRequest(object: any): object is EnduringConsentRequest {
    return 'type' in object;
}

function isRedirectFlow(object: any): object is RedirectFlow {
    return 'type' in object;
}

function isDecoupledFlow(object: any): object is DecoupledFlow {
    return 'type' in object;
}

function isGatewayFlow(object: any): object is GatewayFlow {
    return 'type' in object;
}

function isRedirectFlowHint(object: any): object is RedirectFlowHint {
    return 'type' in object;
}

function isDecoupledFlowHint(object: any): object is DecoupledFlowHint {
    return 'type' in object;
}
