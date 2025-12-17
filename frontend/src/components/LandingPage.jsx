import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, BarChart2 } from 'lucide-react';


import api from '../api';

function LandingPage() {
    const [code, setCode] = useState('');
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const usernameInputRef = useRef(null);

    useEffect(() => {
        if (isAdminLogin && usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, [isAdminLogin]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (!code) return;
        const slug = code.trim();
        navigate(`/poll/${slug}`);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/token', formData);
            localStorage.setItem('token', response.data.access_token);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            const msg = err.response?.data?.detail || err.message || 'Invalid credentials';
            setError(msg);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start pt-24 md:pt-32 p-4 text-gray-800">
            <div className="max-w-md w-full text-center space-y-10">
                <div className="flex justify-center">
                    <button onClick={() => setIsAdminLogin(!isAdminLogin)} className="focus:outline-none transition transform hover:scale-105" title={isAdminLogin ? "Back to Join" : "Live Poll Login"}>
                        <img
                            src="/lehigh_logo.png"
                            alt="Lehigh University"
                            className="h-40 w-auto"
                        />
                    </button>
                </div>

                {!isAdminLogin ? (
                    <>
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">Live Poll</h1>
                            <p className="text-gray-600 text-lg mt-2">Enter a poll code to participate</p>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-6">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Enter 6-character code"
                                className="w-full px-6 py-4 rounded-lg border-2 border-gray-300 text-center text-xl font-mono tracking-widest focus:outline-none focus:border-primary focus:ring-0 shadow-sm bg-white"
                                maxLength={6}
                            />
                            <button
                                type="submit"
                                className="w-full bg-primary text-white font-bold py-4 rounded-lg hover:bg-primary-hover transition transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                Join Live Poll <ArrowRight size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">Live Poll Login</h1>
                            <p className="text-gray-600 text-lg mt-2">Enter your credentials</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">{error}</div>}
                            <input
                                ref={usernameInputRef}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-lg focus:outline-none focus:border-primary focus:ring-0 shadow-sm bg-white"
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-lg focus:outline-none focus:border-primary focus:ring-0 shadow-sm bg-white"
                            />
                            <button
                                type="submit"
                                className="w-full bg-primary text-white font-bold py-4 rounded-lg hover:bg-primary-hover transition transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                Login
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default LandingPage;
