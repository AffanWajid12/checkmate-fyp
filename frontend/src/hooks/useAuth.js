import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../utils/supabaseClient.js";
import apiClient from "../utils/apiClient.js";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const authKeys = {
    me: ["auth", "me"],
    login: ["auth", "login"],
    logout: ["auth", "logout"],
};

export const useMe = () => {
    return useQuery({
        queryKey: authKeys.me,
        queryFn: async () => {
            const res = await apiClient.get("/api/auth/me");
            return res.data.user;
        },
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
};

export const useLogin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ email, password }) => {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(authKeys.me);
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.clear();
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const res = await apiClient.patch("/api/users/profile", data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(authKeys.me);
        },
    });
};

export const useUpdateProfilePicture = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const res = await apiClient.post("/api/users/profile-picture", formData);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(authKeys.me);
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: async (password) => {
            const res = await apiClient.patch("/api/users/change-password", { password });
            return res.data;
        },
    });
};