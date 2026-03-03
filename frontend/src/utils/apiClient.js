import axios from "axios";
import supabase from "./supabaseClient.js";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach the Supabase JWT to every outgoing request
apiClient.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

export default apiClient;