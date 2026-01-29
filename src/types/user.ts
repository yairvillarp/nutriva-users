export interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    onboarding: boolean;
    weight: number;
    initialWeight: number;
    height: number;
    years: number;
    activity: number;
    sex: string;
    objective: {
        divider: string;
        calorias: number;
        rango: {
            prote: number;
            carb: number;
            fats: number;
        };
        dateObjetive: string;
    };
    avatar: string | null;
    facebook: string | null;
    profecionalId: number | null;
    notifications: any; // Using any for brevity as it's complex and not focus
    active_notifications: boolean;
    voucher_code: string | null;
    voucherId: number | null;
    influencerId: number | null;
    currency: string;
    isActive: boolean;
    tutorial: any;
    is_vegetarian: boolean;
    active_subscription: boolean;
    subscription_details: any;
    phone: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    roles: string[];
}

export interface UpdateUserPayload {
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    password?: string;
    avatar?: File | null;
}
