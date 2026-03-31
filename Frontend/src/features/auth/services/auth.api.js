import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
});

export const register = async ({ username, email, password }) => {
    try {
        const response = await api.post("/api/v1/auth/register", {
            username,
            email,
            password,
        });
        return response.data;
    } catch (error) {
        console.log("Register error:", error.response?.data || error.message);
        throw error;
    }
};

export const login = async ({ email, password }) => {
    try {
        const response = await api.post("/api/v1/auth/login", {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        console.log("Login error:", error.response?.data || error.message);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await api.get("/api/v1/auth/logout");
        return response.data;
    } catch (error) {
        console.log("Logout error:", error.response?.data || error.message);
        throw error;
    }
};

export const getMe = async () => {
    try {
        const response = await api.get("/api/v1/auth/get-me");
        return response.data;
    } catch (error) {
        console.log("GetMe error:", error.response?.data || error.message);
        throw error;
    }
};

export default api;