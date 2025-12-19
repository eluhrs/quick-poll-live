import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Trash, ArrowLeft, Calendar, ChevronRight, X } from 'lucide-react';
import Header from './Header';
import { PALETTES } from '../constants/palettes';
import ColorGeneratorModal from './ColorGeneratorModal';

function CreatePoll() {
    const [title, setTitle] = useState('');
    const [closesAt, setClosesAt] = useState('');
    const [palette, setPalette] = useState('lehigh_soft');
    const [slideDuration, setSlideDuration] = useState(10);
    const [enableTitlePage, setEnableTitlePage] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [customColors, setCustomColors] = useState(null);

    const navigate = useNavigate();
    const dateInputRef = useRef(null);

    const palettes = PALETTES;

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title) return;
        try {
            const payload = {
                title,
                color_palette: palette,
                slide_duration: slideDuration,
                enable_title_page: enableTitlePage
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

    const handleApplyCustomColors = (colors) => {
        const jsonColors = JSON.stringify(colors);
        setCustomColors(colors);
        setPalette(jsonColors);
        setShowColorModal(false);
    };

    const isCustomSelected = customColors && palette === JSON.stringify(customColors);

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <Header />
                {showColorModal && (
                    <ColorGeneratorModal
                        onClose={() => setShowColorModal(false)}
                        onApply={handleApplyCustomColors}
                        initialColors={customColors}
                    />
                )}

                <div className="max-w-4xl mx-auto mt-12">
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

                            {/* Settings Grid */}
                            <div className="flex gap-8 justify-start items-end">
                                {/* Schedule Date */}
                                <div className="w-80">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Auto-Close Schedule</label>
                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => dateInputRef.current.showPicker()}
                                            className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all font-bold w-full ${closesAt ? 'border-primary text-primary bg-secondary/30' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            <Calendar size={20} />
                                            <span className="truncate">{closesAt ? new Date(closesAt).toLocaleString() : 'Schedule Close Date'}</span>
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
                                        className="sr-only"
                                    />
                                </div>

                                {/* Slide Duration */}
                                <div className="w-40">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Slide Duration</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={slideDuration}
                                            onChange={(e) => setSlideDuration(parseInt(e.target.value) || 3)}
                                            className="w-full px-3 py-3 pr-8 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors text-lg font-bold text-center"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold pointer-events-none">s</span>
                                    </div>
                                </div>

                                {/* Title Page Toggle */}
                                <div className="flex flex-col w-40 items-center">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Show Title Page</label>
                                    <div className="flex items-center gap-3 h-[52px]">
                                        <span className={`text-sm font-bold ${!enableTitlePage ? 'text-gray-900' : 'text-gray-400'}`}>No</span>
                                        <button
                                            type="button"
                                            onClick={() => setEnableTitlePage(!enableTitlePage)}
                                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${enableTitlePage ? 'bg-primary' : 'bg-gray-200'}`}
                                        >
                                            <span
                                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${enableTitlePage ? 'translate-x-7' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <span className={`text-sm font-bold ${enableTitlePage ? 'text-gray-900' : 'text-gray-400'}`}>Yes</span>
                                    </div>
                                </div>
                            </div>

                            {/* Color Palette */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Chart Color Theme</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {palettes.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                                setPalette(p.id);
                                                setCustomColors(null);
                                            }}
                                            className={`relative p-3 rounded-xl border-2 text-left transition-all ${palette === p.id ? 'border-primary bg-secondary/30 ring-1 ring-primary' : 'border-gray-100 hover:border-gray-300'}`}
                                        >
                                            <div className="flex gap-1 mb-2 h-4">
                                                {p.colors.slice(0, 6).map(c => (
                                                    <div key={c} className="flex-1 h-full rounded-sm" style={{ backgroundColor: c }}></div>
                                                ))}
                                            </div>
                                            <span className={`text-sm font-bold ${palette === p.id ? 'text-primary' : 'text-gray-500'}`}>{p.name}</span>
                                        </button>
                                    ))}

                                    {/* Custom Card */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!customColors) {
                                                setShowColorModal(true);
                                            } else {
                                                if (!isCustomSelected) {
                                                    setPalette(JSON.stringify(customColors));
                                                } else {
                                                    setShowColorModal(true);
                                                }
                                            }
                                        }}
                                        className={`relative p-3 rounded-xl border-2 text-left transition-all group ${isCustomSelected ? 'border-primary bg-secondary/30 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300 border-dashed'}`}
                                    >
                                        <div className="flex gap-1 mb-2 h-4 items-center justify-center bg-gray-50 rounded-sm overflow-hidden">
                                            {customColors ? (
                                                customColors.map((c, i) => (
                                                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                                                ))
                                            ) : (
                                                <Plus className="text-gray-400 group-hover:text-primary transition" size={16} />
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold ${isCustomSelected ? 'text-primary' : 'text-gray-500'}`}>
                                            {customColors ? 'Custom' : 'Custom'}
                                        </span>
                                    </button>
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
