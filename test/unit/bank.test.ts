/**
 * Unit tests for the Bank enum wire values
 *
 * The enum member names form the SDK's public source contract, while the
 * string values are the wire values serialised into API payloads. This test
 * pins both so an accidental change (e.g. a DTO regeneration) is caught before
 * it silently breaks bank routing at the API boundary.
 */

import {Bank} from '../../src/dto/v1/bank';

describe('Bank enum wire values', () => {
    it('should serialise KiwiBank to the "Kiwibank" wire value', () => {
        // BDL-1260: the member name stays KiwiBank for source compatibility,
        // but the wire value the backend expects is "Kiwibank".
        expect(Bank.KiwiBank).toBe('Kiwibank');
    });

    it('should pin the wire value for every bank', () => {
        expect(Bank.ASB).toBe('ASB');
        expect(Bank.ANZ).toBe('ANZ');
        expect(Bank.BNZ).toBe('BNZ');
        expect(Bank.Westpac).toBe('Westpac');
        expect(Bank.KiwiBank).toBe('Kiwibank');
        expect(Bank.Cybersource).toBe('Cybersource');
        expect(Bank.PNZ).toBe('PNZ');
    });
});
