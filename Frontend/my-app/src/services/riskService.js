import api from "./api"; // MUST be from "./api", NOT "axios"

export const getStudentRisk = async () => {
    const response = await api.get("/analytics/risk");
    return response.data;
};