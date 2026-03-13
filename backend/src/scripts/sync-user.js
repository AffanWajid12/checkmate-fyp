import prisma from "../config/prismaClient.js";
import supabase from "../config/supabaseClient.js";

/**
 * Usage: node src/scripts/sync-user.js <email> [role]
 * This script finds a user in Supabase by email, confirms it, and syncs it to the DB.
 */

const syncUser = async () => {
    const email = process.argv[2];
    const roleArg = process.argv[3]; // Optional: ADMIN, TEACHER, STUDENT

    if (!email) {
        console.error("Error: Please provide an email address.");
        console.log("Usage: node src/scripts/sync-user.js <email> [role]");
        process.exit(1);
    }

    try {
        console.log(`Searching for user: ${email}...`);

        // 1. Find user in Supabase Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const supabaseUser = users.find(u => u.email === email);

        if (!supabaseUser) {
            console.error(`Error: User ${email} not found in Supabase Auth.`);
            process.exit(1);
        }

        // 2. Determine Role
        // Priority: Command line arg > Supabase metadata > Default 'STUDENT'
        const metaRole = supabaseUser.user_metadata?.role?.toUpperCase();
        const finalRole = (roleArg || metaRole || "STUDENT").toUpperCase();

        console.log(`Found Supabase user: ${supabaseUser.id}. Confirming email and syncing as ${finalRole}...`);

        // 3. Confirm email automatically
        await supabase.auth.admin.updateUserById(supabaseUser.id, { email_confirm: true });

        // 4. Create or Update user in Prisma
        const user = await prisma.users.upsert({
            where: { id: supabaseUser.id },
            update: {
                role: finalRole,
                name: supabaseUser.user_metadata?.name || email.split('@')[0],
                email: email
            },
            create: {
                id: supabaseUser.id,
                email: email,
                name: supabaseUser.user_metadata?.name || email.split('@')[0],
                role: finalRole
            }
        });

        console.log("------------------------------------------");
        console.log("Success! User account synchronized.");
        console.log(`ID:    ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role:  ${user.role}`);
        console.log("------------------------------------------");

    } catch (error) {
        console.error("An error occurred during synchronization:");
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

syncUser();
