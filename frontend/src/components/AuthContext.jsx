import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import supabase from "../utils/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "../hooks/useAuth";

const AuthContext = createContext({ user: null, session: null, loading: false });

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const queryClient = useQueryClient();

    const { data: me, isLoading: meLoading } = useMe();

    useEffect(() => {

        (async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data?.session ?? null);
        })();

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession ?? null);
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        });

        return () => {
            sub?.subscription?.unsubscribe?.();
        };
    }, [queryClient]);

    // merge supabase user and public user
    const user = useMemo(() => {
        const base = session?.user ?? null;
        if (!base && !me) return null;
        return base ? { ...base, ...(me?.user || {}) } : { ...(me?.user || {}) };
    }, [session, me]);

    return (
        <AuthContext.Provider value={{ user, session, loading: meLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);