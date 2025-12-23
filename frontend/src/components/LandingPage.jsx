import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, BarChart2 } from 'lucide-react';


import api from '../api';

function LandingPage() {
    const [code, setCode] = useState('');
    const [joinMode, setJoinMode] = useState('vote'); // 'vote' or 'results'
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const usernameInputRef = useRef(null);

    useEffect(() => {
        document.title = 'Quick Poll Live';

        // UX IMPROVEMENT: If already logged in, go straight to Dashboard
        if (localStorage.getItem('token')) {
            navigate('/dashboard');
        }
    }, [navigate]);

    useEffect(() => {
        if (isAdminLogin && usernameInputRef.current) {
            usernameInputRef.current.focus();
        }
    }, [isAdminLogin]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (!code) return;
        const slug = code.trim();

        if (joinMode === 'results') {
            navigate(`/${slug}/results${window.location.search}`);
        } else {
            navigate(`/${slug}/vote${window.location.search}`); // Direct to /vote for explicitly casting a vote
        }
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
                            src="/lts_logo.png"
                            alt="Lehigh LTS"
                            className="w-full max-w-[320px] h-auto object-contain"
                        />
                    </button>
                </div>

                {!isAdminLogin ? (
                    <>
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">Quick Poll Live</h1>
                            <p className="text-gray-600 text-lg mt-2">Enter a poll code to participate</p>
                        </div>

                        <form onSubmit={handleJoin} className="space-y-4">

                            {/* Option 3: Mode Toggle (Segmented Control) */}
                            {/* NOTE: User may revert. Previous was 'border' (1px). Current is 'border-2' to match input. */}
                            <div className="flex bg-gray-100 border-2 border-gray-300 p-1.5 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setJoinMode('vote')}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition-all ${joinMode === 'vote'
                                        ? 'bg-primary shadow-sm text-white'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    Cast VOTE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setJoinMode('results')}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition-all ${joinMode === 'results'
                                        ? 'bg-primary shadow-sm text-white'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    View RESULTS
                                </button>
                            </div>

                            <div className="flex shadow-sm rounded-lg overflow-hidden border-2 border-gray-300 focus-within:border-primary transition-colors bg-white">
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="ENTER CODE"
                                    className="w-full px-6 py-4 text-xl font-mono tracking-widest focus:outline-none focus:ring-0 uppercase font-bold border-0 bg-transparent placeholder-gray-400"
                                    maxLength={32}
                                />
                                <button
                                    type="submit"
                                    className="bg-primary text-white font-bold px-8 hover:bg-primary-hover transition transform active:scale-95 flex items-center justify-center"
                                >
                                    <span className="text-xl">GO</span>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <div>
                            <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">Quick Poll Login</h1>
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
