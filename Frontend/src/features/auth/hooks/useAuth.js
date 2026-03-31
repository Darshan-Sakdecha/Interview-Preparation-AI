import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout } from "../services/auth.api.js";

export const useAuth = () => {
    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context;

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });

            if (data?.user) {
                setUser(data.user);
                return true;
            }

            setUser(null);
            return false;
        } catch (error) {
            setUser(null);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });

            if (data?.user) {
                setUser(data.user);
                return true;
            }

            setUser(null);
            return false;
        } catch (error) {
            setUser(null);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
            return true;
        } catch (error) {
            console.log("Logout error:", error.response?.data || error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { user, loading, handleLogin, handleLogout, handleRegister };
};