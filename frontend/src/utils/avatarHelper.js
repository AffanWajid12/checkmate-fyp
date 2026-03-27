/**
 * Returns the correct URL for a profile picture.
 * Handles both signed URLs (starting with http) and relative paths.
 */
export const getAvatarUrl = (profile_picture) => {
    if (!profile_picture || profile_picture.trim() === "") return null;

    // If it's already a full URL (e.g., a signed URL from the backend), use it as is
    if (profile_picture.startsWith("http")) {
        return profile_picture;
    }

    // Otherwise, assume it's a relative path in the 'profiles' bucket
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/profiles/${profile_picture}`;
};
