import api from "./api";


export const getFaculty = async () => {
    const response = await api.get(
        "/faculty/"
    );
    return response.data;
};


export const createFaculty = async (facultyData) => {
    const response = await api.post(
        "/faculty/",
        facultyData
    );
    return response.data;
};


export const deleteFaculty = async (id) => {
    const response = await api.delete(
        `/faculty/${id}`
    );
    return response.data;
};