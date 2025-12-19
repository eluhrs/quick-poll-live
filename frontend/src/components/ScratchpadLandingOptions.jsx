import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const LandingOptions = () => {
    // Shared State for interactivity
    const [joinMode, setJoinMode] = useState('vote');

    // Helper Component: The Join Widget
    const JoinWidget = ({
        title,
        toggleBg = "bg-gray-100",
        toggleBorder = "border-gray-300",
        inputBg = "bg-white",
        inputBorder = "border-gray-300",
        btnColor = "bg-primary"
    }) => (
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 pb-2 mb-4">
                {title}
            </h3>

            {/* Toggle (Cast/View) */}
            <div className={`flex ${toggleBg} border ${toggleBorder} p-1.5 rounded-lg mb-2`}>
                <button
                    onClick={() => setJoinMode('vote')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition-all ${joinMode === 'vote' ? `${btnColor} shadow-sm text-white` : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Cast VOTE
                </button>
                <button
                    onClick={() => setJoinMode('results')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-bold transition-all ${joinMode === 'results' ? `${btnColor} shadow-sm text-white` : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    View RESULTS
                </button>
            </div>

            {/* Code Input + GO */}
            <div className={`flex shadow-sm rounded-lg overflow-hidden border-2 ${inputBorder} focus-within:border-primary transition-colors ${inputBg}`}>
                <input
                    type="text"
                    placeholder="ENTER CODE"
                    className="w-full px-6 py-4 text-xl font-mono tracking-widest focus:outline-none focus:ring-0 uppercase placeholder-gray-300 font-bold border-0 bg-transparent text-gray-800"
                    maxLength={32}
                />
                <button className={`${btnColor} text-white font-bold px-8 hover:opacity-90 transition transform active:scale-95 flex items-center justify-center`}>
                    <span className="text-xl">GO</span>
                </button>
            </div>

            {/* Mock Login Input (To show color matching) */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Mock Password Input (For Color Match)</label>
                <input
                    type="password"
                    placeholder="Password"
                    className={`w-full px-4 py-2 rounded-lg border-2 ${inputBorder} focus:outline-none ${inputBg}`}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Landing Page Styling Options</h1>
                    <p className="text-gray-500 mt-2">Exploring Border Colors & Matching Backgrounds</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* 1. Current Baseline */}
                    <JoinWidget
                        title="Current Production (Gray-100 Toggle / White Input)"
                        toggleBg="bg-gray-100"
                        toggleBorder="border-gray-300"
                        inputBg="bg-white" // Input is white/transparent effectively
                        inputBorder="border-gray-300"
                    />

                    {/* 2. Matched Gray Backgrounds */}
                    <JoinWidget
                        title="Matched Backgrounds: Gray-50"
                        toggleBg="bg-gray-50"
                        toggleBorder="border-gray-200"
                        inputBg="bg-gray-50" // Input matches toggle
                        inputBorder="border-gray-200"
                    />

                    {/* 3. Matched Warm Backgrounds (Stone) */}
                    <JoinWidget
                        title="Matched Backgrounds: Warm Stone-50"
                        toggleBg="bg-stone-50"
                        toggleBorder="border-stone-200"
                        inputBg="bg-stone-50"
                        inputBorder="border-stone-200"
                        btnColor="bg-[#6d4c41]" // Bronze explicit
                    />

                    {/* 4. High Contrast Borders */}
                    <JoinWidget
                        title="High Contrast Borders"
                        toggleBg="bg-white"
                        toggleBorder="border-gray-400"
                        inputBg="bg-white"
                        inputBorder="border-gray-400"
                    />

                    {/* 5. Darker Toggle Area */}
                    <JoinWidget
                        title="Darker Toggle Area (Gray-200)"
                        toggleBg="bg-gray-200"
                        toggleBorder="border-gray-300"
                        inputBg="bg-white"
                        inputBorder="border-gray-300"
                    />

                    {/* 6. Subtle / Minimal */}
                    <JoinWidget
                        title="Subtle / Minimal (Slate-50)"
                        toggleBg="bg-slate-50"
                        toggleBorder="border-slate-200"
                        inputBg="bg-slate-50"
                        inputBorder="border-slate-200"
                        btnColor="bg-slate-600"
                    />

                </div>
            </div>
        </div>
    );
};

export default LandingOptions;
