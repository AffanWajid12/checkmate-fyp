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

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        const dbUser = await prisma.users.findUnique({ where: { id: user.id } });
        if (!dbUser) {
            return res.status(401).json({ error: "User not found" });
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