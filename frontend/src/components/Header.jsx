import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart2, LogOut } from 'lucide-react';
import api from '../api';

function Header() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        navigate('/');
    };

    return (
        <div className="flex justify-between items-center mb-8 border-b border-gray-400 pb-6">
            <div className="flex items-center gap-3">
                <img
                    src="/lts_logo.png"
                    alt="Lehigh LTS"
                    className="h-12 w-auto"
                />
                <h1 className="text-3xl font-serif font-bold text-[#502d0e]">Quick Poll Live</h1>
            </div>

            <div className="flex gap-4">
                <Link to="/dashboard" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition shadow-sm font-bold">
                    <BarChart2 size={20} /> Dashboard
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-secondary text-secondary-text px-4 py-2 rounded-lg border border-primary hover:bg-secondary-hover transition font-bold">
                    <LogOut size={20} /> Logout
                </button>
            </div>
        </div>
    );
}

export default Header;
