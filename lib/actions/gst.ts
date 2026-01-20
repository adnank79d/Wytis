'use server';

type GstDetails = {
    legalName?: string;
    tradeName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
};

// Map of first 2 digits of GSTIN to State Names
const STATE_CODE_MAP: Record<string, string> = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
};

export async function fetchGstDetails(gstin: string): Promise<{ success: boolean; data?: GstDetails; error?: string }> {
    // In a real app, we would call a GST API here.
    // For now, we simulate basic extraction.

    if (!gstin || gstin.length < 2) {
        return { success: false, error: 'Invalid GSTIN format' };
    }

    const stateCode = gstin.substring(0, 2);
    const stateName = STATE_CODE_MAP[stateCode] || '';

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (stateName) {
        return {
            success: true,
            data: {
                addressLine1: 'Mock Business Address 123',
                addressLine2: 'Industrial Area',
                city: 'Mock City', // ideally we'd map this too if possible, but hard without API
                state: stateName,
                pincode: '400001'
            }
        };
    }

    return { success: false, error: 'Could not determine state from GSTIN' };
}
