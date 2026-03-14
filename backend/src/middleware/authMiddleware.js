import supabase from "../config/supabaseClient.js";
import prisma from "../config/prismaClient.js";

const verifyUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header missing" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Token missing" });
        }

        // The following block seems to be an unrelated API client interceptor
        // and cannot be directly inserted here as it would cause a syntax error.
        // It appears to be a copy-paste error from another part of the codebase.
        // If the intention was to add console logs related to session or token
        // within this middleware, please provide the specific console.log statements.
        // For now, I will proceed with the original logic for token verification.

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        let dbUser = await prisma.users.findUnique({ where: { id: user.id } });
        
        if (!dbUser) {
            // AUTO-SYNC: If user is authenticated in Supabase but missing in DB (e.g. after DB reset)
            // Recreate the user record automatically using Supabase metadata
            const metadata = user.user_metadata || {};
            dbUser = await prisma.users.create({
                data: {
                    id: user.id,
                    email: user.email,
                    name: metadata.name || user.email.split('@')[0],
                    role: metadata.role?.toUpperCase() || 'STUDENT',
                },
            });
            console.log(`Auto-synced user ${user.email} to database.`);
        }
        
        req.user = dbUser;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const verifyUserType = (requiredType) => {
    return (req, res, next) => {
        if (req.user?.role !== requiredType) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
};

export { verifyUser, verifyUserType };