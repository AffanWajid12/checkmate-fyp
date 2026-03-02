import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";

const getUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany();
        res.status(200).json({
            message: "Users retrieved successfully",
            users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addUser = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: {
                name, role
            },
        });
        if (authError) return res.status(400).json({ message: authError.message });

        const newUser = await prisma.users.findUnique({
            where: { id: authData.user.id },
        });

        res.status(201).json({
            message: "User created successfully",
            newUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (req.user.id === id) {
            return res.status(400).json({ message: "You cannot demote yourself. Please ask another admin to change your role." });
        }

        const updatedUser = await prisma.users.update({
            where: { id },
            data: { role },
        });

        res.status(200).json({
            message: "User role updated successfully",
            updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getUsers, addUser, updateUserRole };