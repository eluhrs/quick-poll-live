import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ArrowLeft, ArrowRight, Keyboard } from 'lucide-react';

// Helper functions (Outside component for cleaner state init)
const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
};

const generatePaletteForMode = (mode) => {
    let newColors = [];
    if (mode === 'multi-hue') {
        for (let i = 0; i < 6; i++) {
            newColors.push(hslToHex(Math.floor(Math.random() * 360), 60 + Math.random() * 20, 45 + Math.random() * 15));
        }
    } else if (mode === 'single-hue') {
        const baseHue = Math.floor(Math.random() * 360);
        for (let i = 0; i < 6; i++) {
            newColors.push(hslToHex(baseHue, 50 + Math.random() * 30, 20 + (i * 12)));
        }
    } else if (mode === 'divergent') {
        const hue1 = Math.floor(Math.random() * 360);
        const hue2 = (hue1 + 180) % 360;
        for (let i = 0; i < 3; i++) newColors.push(hslToHex(hue1, 70, 30 + (i * 15)));
        for (let i = 0; i < 3; i++) newColors.push(hslToHex(hue2, 70, 30 + (i * 15)));
    }
    return newColors;
};

function ColorGeneratorModal({ onClose, onApply, initialColors }) {
    const [mode, setMode] = useState('multi-hue');

    // History Management - Initialize with valid data to ensure Index starts at 1
    const [history, setHistory] = useState(() => {
        if (initialColors && initialColors.length) return [initialColors];
        return [generatePaletteForMode('multi-hue')];
    });
    const [currentIndex, setCurrentIndex] = useState(0);

    const getNewPaletteColors = useCallback(() => {
        return generatePaletteForMode(mode);
    }, [mode]);

    const generateNew = useCallback(() => {
        const nextColors = getNewPaletteColors();
        const newHistory = [...history.slice(0, currentIndex + 1), nextColors];
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }, [history, currentIndex, getNewPaletteColors]);

    const goBack = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const goForward = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            generateNew();
        }
    }, [currentIndex, history, generateNew]);

    // Initial Load & Mode Switch logic handled by manual trigger below
    // We do NOT want to regen on mode change automatically via Effect if we want Index stability logic, 
    // BUT user asked for immediate jump.
    // The previous implementation of `triggerModeChange` handles the jump.

    const triggerModeChange = (newMode) => {
        setMode(newMode);
        const nextColors = generatePaletteForMode(newMode);
        setHistory(prev => [...prev.slice(0, currentIndex + 1), nextColors]);
        setCurrentIndex(prev => prev + 1);
    };

    // Keyboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                generateNew();
            } else if (e.code === 'ArrowLeft') {
                goBack();
            } else if (e.code === 'ArrowRight') {
                goForward();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [generateNew, goBack, goForward]);

    const currentColors = history[currentIndex] || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Custom Palette Generator</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 space-y-6">
                    <div className="flex justify-center gap-4">
                        {['multi-hue', 'single-hue', 'divergent'].map(m => (
                            <button
                                key={m}
                                onClick={() => triggerModeChange(m)}
                                className={`px-4 py-2 rounded-lg font-bold capitalize transition-all ${mode === m ? 'bg-primary text-white shadow-lg transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {m.replace('-', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Instructions */}
                    <div className="flex items-center justify-center gap-6 text-gray-500 text-sm font-medium bg-gray-50 py-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                            <Keyboard size={16} /> <span className="uppercase tracking-wider text-xs font-bold text-gray-400">Keyboard Controls</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><span className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-xs shadow-sm">←</span> Previous Palette</span>
                            <span className="flex items-center gap-1"><span className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-xs shadow-sm">→</span> New Palette</span>
                        </div>
                    </div>

                    {/* Palette Preview */}
                    <div className="h-48 rounded-2xl overflow-hidden flex shadow-inner ring-4 ring-gray-100 relative group/display">
                        {currentColors.map((c, i) => (
                            <div
                                key={`${currentIndex}-${i}`}
                                className="h-full flex-1 transition-colors duration-300 flex items-end justify-center pb-4 group"
                                style={{ backgroundColor: c }}
                            >
                                <span className="bg-black/20 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition backdrop-blur-sm font-mono">
                                    {c}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="text-xs text-gray-400 font-bold">
                        History: {currentIndex + 1} / {history.length}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onApply(currentColors)}
                            className="px-8 py-2 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary-hover hover:shadow-xl transition transform active:scale-95"
                        >
                            Apply Colors
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ColorGeneratorModal;
