import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';

function ColorGeneratorModal({ onClose, onApply, initialColors }) {
    const [mode, setMode] = useState('multi-hue'); // multi-hue, single-hue, divergent
    const [colors, setColors] = useState(initialColors || []);

    const generateColor = () => {
        const hue = Math.floor(Math.random() * 360);
        const sat = 70 + Math.random() * 30; // 70-100%
        const light = 40 + Math.random() * 20; // 40-60%
        return `hsl(${hue}, ${sat}%, ${light}%)`;
    };

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

    const generatePalette = () => {
        let newColors = [];
        if (mode === 'multi-hue') {
            for (let i = 0; i < 6; i++) {
                const h = Math.floor(Math.random() * 360);
                const s = 60 + Math.random() * 20;
                const l = 45 + Math.random() * 15;
                newColors.push(hslToHex(h, s, l));
            }
        } else if (mode === 'single-hue') {
            const baseHue = Math.floor(Math.random() * 360);
            for (let i = 0; i < 6; i++) {
                const s = 50 + Math.random() * 30;
                const l = 20 + (i * 12); // Spread lightness
                newColors.push(hslToHex(baseHue, s, l));
            }
        } else if (mode === 'divergent') {
            const hue1 = Math.floor(Math.random() * 360);
            const hue2 = (hue1 + 180) % 360;
            for (let i = 0; i < 3; i++) {
                newColors.push(hslToHex(hue1, 70, 30 + (i * 15)));
            }
            for (let i = 0; i < 3; i++) {
                newColors.push(hslToHex(hue2, 70, 30 + (i * 15)));
            }
        }
        setColors(newColors);
    };

    useEffect(() => {
        if (colors.length === 0) {
            generatePalette();
        }
    }, [mode]); // Regen on mode change

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                generatePalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode]);

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
                                onClick={() => setMode(m)}
                                className={`px-4 py-2 rounded-lg font-bold capitalize transition-all ${mode === m ? 'bg-primary text-white shadow-lg transform scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {m.replace('-', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="text-center text-gray-400 text-sm font-medium animate-pulse">
                        Press Spacebar to Shuffle
                    </div>

                    {/* Palette Preview */}
                    <div className="h-48 rounded-2xl overflow-hidden flex shadow-inner ring-4 ring-gray-100">
                        {colors.map((c, i) => (
                            <div
                                key={i}
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
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onApply(colors)}
                        className="px-8 py-2 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary-hover hover:shadow-xl transition transform active:scale-95"
                    >
                        Apply Colors
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ColorGeneratorModal;
