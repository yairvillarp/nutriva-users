import { apiClient } from "@/config/apiClient";

export interface MealPlanSummary {
    userObjective: any;
    patientObjective: string | null;
    consultationDates: {
        first: string | null;
        last: string | null;
    };
    dailyIntake: any | null;
    selectedDate: string;
}

export const mealPlanService = {
    getSummary: async (userId: string | number, date?: string): Promise<MealPlanSummary> => {
        const response = await apiClient.get<{ success: boolean; data: MealPlanSummary }>(
            '/daylis/meal-plan-summary',
            { params: { userId, date } }
        );
        return response.data.data;
    },
    getDatesWithData: async (userId: string | number): Promise<string[]> => {
        const response = await apiClient.get<{ success: boolean; data: string[] }>(
            '/daylis/dates-with-data',
            { params: { userId } }
        );
        return response.data.data;
    },
    addFood: async (data: { type: string; product: any; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/addfood', data, { params: { date: data.date } });
        return response.data.data;
    },
    updateFood: async (data: { type: string; old_type: string; product: any; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/updatefood', data, { params: { date: data.date } });
        return response.data.data;
    },
    removeFood: async (data: { type: string; product: any; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/removefood', data, { params: { date: data.date } });
        return response.data.data;
    },
    addRecipe: async (data: { type: string; recipeId: number | string; unit: string | number; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/addrecipe', data);
        return response.data.data;
    },
    deleteRecipe: async (data: { type: string; recipeId: number | string; date?: string; userId?: string | number }) => {
        const response = await apiClient.post('/api/daily/deleterecipe', data);
        return response.data.data;
    },
    deletePremade: async (data: { type: string; premadeId: number | string; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/deletepremade', data);
        return response.data.data;
    },
    addPremade: async (data: { type: string; premadeId: number | string; unit: number; userId?: string | number; date?: string }) => {
        const response = await apiClient.post('/api/daily/addpremade', data);
        return response.data.data;
    },
    registerRecipe: async (data: { recipeId: number | string; type: string; date?: string }) => {
        const response = await apiClient.post('/api/daily/register-recipe', data, { params: { date: data.date } });
        return response.data.data;
    },
    unregisterRecipe: async (data: { recipeId: number | string; type: string; date?: string }) => {
        const response = await apiClient.post('/api/daily/unregister-recipe', data, { params: { date: data.date } });
        return response.data.data;
    },
    registerPremade: async (data: { premadeId: number | string; type: string; date?: string }) => {
        const response = await apiClient.post('/api/daily/register-premade', data, { params: { date: data.date } });
        return response.data.data;
    },
    unregisterPremade: async (data: { premadeId: number | string; type: string; date?: string }) => {
        const response = await apiClient.post('/api/daily/unregister-premade', data, { params: { date: data.date } });
        return response.data.data;
    },
    regeneratePlan: async (userId: string | number, date: string) => {
        const response = await apiClient.get('/api/dashboard/regenerate-plan', {
            params: { userId, date }
        });
        return response.data.data;
    },
    copyPlan: async (userId: string | number, fromDate: string, toDate: string) => {
        const response = await apiClient.get('/api/dashboard/copy-plan', {
            params: { userId, fromDate, toDate }
        });
        return response.data.data;
    },
    addComment: async (data: { type: string; text: string; userId: string | number; date: string }) => {
        const response = await apiClient.post('/daylis/add-comment', data, { params: { date: data.date } });
        return response.data.data;
    },
    updateComment: async (data: { type: string; commentId: string; text: string; userId: string | number; date: string }) => {
        const response = await apiClient.post('/daylis/update-comment', data, { params: { date: data.date } });
        return response.data.data;
    },
    removeComment: async (data: { type: string; commentId: string; userId: string | number; date: string }) => {
        const response = await apiClient.post('/daylis/remove-comment', data, { params: { date: data.date } });
        return response.data.data;
    }
};
