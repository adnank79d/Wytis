export type PlanTier = 'trial' | 'starter' | 'growth' | 'business' | 'enterprise';

export interface PlanLimits {
    maxInvoices: number; // -1 for unlimited
    maxUsers: number;
    canExport: boolean;
    canRemoveBranding: boolean;
}

export const PLANS: Record<PlanTier, PlanLimits> = {
    trial: {
        maxInvoices: -1,
        maxUsers: -1,
        canExport: true,
        canRemoveBranding: true,
    },
    starter: {
        maxInvoices: 100,
        maxUsers: 1,
        canExport: false,
        canRemoveBranding: false,
    },
    growth: {
        maxInvoices: -1,
        maxUsers: 5,
        canExport: false,
        canRemoveBranding: false,
    },
    business: {
        maxInvoices: -1,
        maxUsers: -1, // Unlimited
        canExport: true,
        canRemoveBranding: true,
    },
    enterprise: {
        maxInvoices: -1,
        maxUsers: -1,
        canExport: true,
        canRemoveBranding: true,
    },
};
