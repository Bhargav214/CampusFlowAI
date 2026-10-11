import api from "./api"; // MUST be from "./api", NOT "axios"

export const getDashboardAnalytics = async () => {
    const response = await api.get("/analytics/dashboard");
    return response.data;
};