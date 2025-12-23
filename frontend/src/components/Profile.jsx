import React, { useState } from 'react';
import { Lock, Check, AlertCircle, Eye, EyeOff, User } from 'lucide-react';
import api from '../api';
import Header from './Header';

function Profile() {
    const [username, setUsername] = useState('');
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Fetch current user details on mount
    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/users/me');
                if (res.data && res.data.username) {
                    setUsername(res.data.username);
                }
            } catch (err) {
                console.error("Failed to fetch user details", err);
            }
        };
        fetchUser();
    }, []);

    const handleChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        if (status.message) setStatus({ type: '', message: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
            setStatus({ type: 'error', message: 'All fields are required.' });
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            setStatus({ type: 'error', message: 'New passwords do not match.' });
            return;
        }
        if (passwordData.new_password.length < 4) {
            setStatus({ type: 'error', message: 'Password must be at least 4 characters.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.put('/users/me/password', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            setStatus({ type: 'success', message: 'Password updated successfully!' });
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail || 'Failed to update password.';
            setStatus({ type: 'error', message: msg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <Header />

                <div className="max-w-md mx-auto mt-12">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="bg-secondary px-8 py-6 border-b border-gray-300">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Lock className="text-primary" /> Profile Settings
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {status.message && (
                                <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold ${status.type === 'error'
                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                        : 'bg-green-50 text-green-700 border border-green-100'
                                    }`}>
                                    {status.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
                                    {status.message}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                    Logged in as
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={username}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 font-bold cursor-not-allowed select-none"
                                    />
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <h3 className="text-lg font-bold text-gray-900 border-l-4 border-primary pl-3">
                                Change Password
                            </h3>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="old_password"
                                        value={passwordData.old_password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">New Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="new_password"
                                    value={passwordData.new_password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Confirm New Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirm_password"
                                    value={passwordData.confirm_password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary-hover hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Updating...' : 'Update Password'}
                                    {!isLoading && <Check size={20} />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
