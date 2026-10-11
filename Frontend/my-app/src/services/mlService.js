import api from "./api";

export const getMLRisk = async () => {
    const response = await api.get("/analytics/ml/risk");

    return response.data;
};