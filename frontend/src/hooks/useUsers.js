import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../utils/apiClient.js";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const userKeys = {
    all: ["users"],
    detail: (userId) => ["users", userId],
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Returns all users (admin only).
 */
export const useUsers = () =>
    useQuery({
        queryKey: userKeys.all,
        queryFn: async () => {
            const { data } = await apiClient.get("/api/admin/users");
            return data.users; // array of user objects
        },
    });

/**
 * POST /api/admin/users
 * Body: { name, email, password, role }
 * Creates a new user (admin only).
 */
export const useAddUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userData) => {
            const { data } = await apiClient.post("/api/admin/users", userData);
            return data.newUser;
        },
        onSuccess: (newUser) => {
            if (!newUser) return;
            queryClient.setQueryData(userKeys.all, (prev) =>
                prev ? [newUser, ...prev] : [newUser]
            );
        },
    });
};

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role }
 * Updates a user's role (admin only).
 */
export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, role }) => {
            const { data } = await apiClient.patch(`/api/admin/users/${userId}/role`, { role });
            return data.updatedUser;
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(userKeys.all, (prev) =>
                prev?.map((u) => (u.id === updatedUser.id ? updatedUser : u))
            );
        },
    });
};

/**
 * DELETE /api/admin/users/:id
 * Deletes a user (admin only, cannot delete self or another admin).
 */
export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId) => {
            await apiClient.delete(`/api/admin/users/${userId}`);
            return userId;
        },
        onSuccess: (deletedUserId) => {
            queryClient.setQueryData(userKeys.all, (prev) =>
                prev?.filter((u) => u.id !== deletedUserId)
            );
        },
    });
};
