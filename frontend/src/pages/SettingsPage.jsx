import React, { useState, useRef } from 'react';
import { useMe, useUpdateProfile, useUpdateProfilePicture, useChangePassword } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { getAvatarUrl } from '../utils/avatarHelper';

const SettingsPage = () => {
    const { data: user } = useMe();
    const updateProfile = useUpdateProfile();
    const updateProfilePicture = useUpdateProfilePicture();
    const changePassword = useChangePassword();

    const [name, setName] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef(null);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateProfile.mutateAsync({ name });
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }
        try {
            await changePassword.mutateAsync(password);
            toast.success('Password changed successfully');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.message || 'Failed to change password');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            return toast.error('File size should be less than 5MB');
        }

        setIsUploading(true);
        try {
            await updateProfilePicture.mutateAsync(file);
            toast.success('Profile picture updated');
        } catch (error) {
            toast.error(error.message || 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Account Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Picture Section */}
                <div className="lg:col-span-1">
                    <div className="bg-background border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
                        <div className="relative group mb-4">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-100 border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold text-neutral-400">
                                {user?.profile_picture ? (
                                    <img 
                                        src={getAvatarUrl(user.profile_picture)} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '';
                                            e.target.parentElement.innerHTML = user?.name?.charAt(0).toUpperCase() || '?';
                                        }}
                                    />
                                ) : (
                                    user?.name?.charAt(0).toUpperCase() || '?'
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-sm font-medium text-text-primary mb-1">{user?.name}</p>
                        <p className="text-xs text-text-muted">{user?.role}</p>
                        
                        {isUploading && (
                            <div className="mt-4 flex items-center gap-2 text-xs text-primary font-medium">
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                            </div>
                        )}
                    </div>
                </div>

                {/* Forms Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Personal Information */}
                    <section className="bg-background border border-neutral-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-neutral-400">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            Personal Information
                        </h2>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-neutral-400"
                                    placeholder="Your full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Address</label>
                                <input 
                                    type="email" 
                                    value={user?.email || ''} 
                                    disabled 
                                    className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-text-muted cursor-not-allowed opacity-70"
                                />
                                <p className="mt-1.5 text-[11px] text-text-muted">Email cannot be changed after registration.</p>
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    disabled={updateProfile.isPending || name === user?.name}
                                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Change Password */}
                    <section className="bg-background border border-neutral-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-neutral-400">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            Security Settings
                        </h2>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">New Password</label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-neutral-400"
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-neutral-400"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    disabled={changePassword.isPending || !password}
                                    className="bg-text-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-neutral-800 hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {changePassword.isPending ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
