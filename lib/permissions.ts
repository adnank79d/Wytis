
export type Role = 'owner' | 'accountant' | 'staff';

export const PERMISSIONS = {
    VIEW_DASHBOARD: 'view_dashboard',
    CREATE_INVOICE: 'create_invoice',
    MANAGE_INVOICES: 'manage_invoices', // Edit/Delete
    VIEW_REPORTS: 'view_reports',
    MANAGE_SETTINGS: 'manage_settings',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_BILLING: 'manage_billing',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    owner: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.CREATE_INVOICE,
        PERMISSIONS.MANAGE_INVOICES,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.MANAGE_BILLING,
    ],
    accountant: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.CREATE_INVOICE, // Often accountants create invoices too
        PERMISSIONS.MANAGE_INVOICES,
        PERMISSIONS.VIEW_REPORTS,
    ],
    staff: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.CREATE_INVOICE,
    ],
};

export function can(role: Role | undefined | null, action: Permission): boolean {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}
