import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Trash, ArrowLeft, Calendar, ChevronRight, X } from 'lucide-react';
import Header from './Header';
import { PALETTES } from '../constants/palettes';

function CreatePoll() {
    const [title, setTitle] = useState('');
    const [closesAt, setClosesAt] = useState('');
    const [palette, setPalette] = useState('lehigh_soft');
    const navigate = useNavigate();
    const dateInputRef = useRef(null);

    const palettes = PALETTES;

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title) return;
        try {
            const payload = {
                title,
                color_palette: palette
            };
            if (closesAt) {
                payload.closes_at = new Date(closesAt).toISOString();
            }

            const res = await api.post('/polls/', payload);
            navigate(`/${res.data.slug}/edit`);
        } catch (err) {
            console.error(err);
            alert('Failed to create poll');
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <Header />

                <div className="max-w-2xl mx-auto mt-12">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-secondary px-8 py-6 border-b border-gray-300">
                            <h1 className="text-2xl font-bold text-gray-900">Create New Poll</h1>
                            <p className="text-gray-600 mt-1">Set up your poll details and appearance.</p>
                        </div>

                        <form onSubmit={handleCreate} className="p-8 space-y-8">
                            {/* Poll Title */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Poll Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors"
                                    placeholder="e.g., Quarterly Team Survey"
                                    autoFocus
                                />
                            </div>

                            {/* Schedule Date */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Auto-Close Schedule</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => dateInputRef.current.showPicker()}
                                        className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all font-bold ${closesAt ? 'border-primary text-primary bg-secondary/30' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <Calendar size={20} />
                                        <span>{closesAt ? new Date(closesAt).toLocaleString() : 'Schedule Close Date'}</span>
                                    </button>
                                    {closesAt && (
                                        <button
                                            type="button"
                                            onClick={() => setClosesAt('')}
                                            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
                                            title="Clear Date"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="datetime-local"
                                    ref={dateInputRef}
                                    value={closesAt}
                                    onChange={e => setClosesAt(e.target.value)}
                                    className="sr-only" // Hidden visually but accessible
                                />
                                <p className="text-xs text-gray-400 mt-2 ml-1">Optional. Poll will automatically archive after this date.</p>
                            </div>

                            {/* Color Palette */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Chart Color Theme</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {palettes.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setPalette(p.id)}
                                            className={`relative p-3 rounded-xl border-2 text-left transition-all ${palette === p.id ? 'border-primary bg-secondary/30 ring-1 ring-primary' : 'border-gray-100 hover:border-gray-300'}`}
                                        >
                                            <div className="flex gap-1 mb-2">
                                                {p.colors.slice(0, 6).map(c => (
                                                    <div key={c} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }}></div>
                                                ))}
                                            </div>
                                            <span className={`text-sm font-bold ${palette === p.id ? 'text-primary' : 'text-gray-500'}`}>{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="px-6 py-3 rounded-xl bg-secondary text-secondary-text border border-primary font-bold hover:bg-secondary-hover transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!title}
                                    className={`px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary-hover hover:shadow-xl transition transform active:scale-95 flex items-center gap-2 ${!title ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Create Poll <ChevronRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreatePoll;
