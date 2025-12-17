import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const TabSection = ({ title, description, children }) => (
    <div className="bg-[#f6f4f2] p-8 rounded-xl border border-gray-200">
        <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {children}
        </div>
    </div>
);

const TabOption = ({ activeTab, onTabClick }) => {
    // This is a placeholder for the content passed in, but we handle state internally in the showcase for simplicity if needed,
    // or we render the visual part.
    // Actually, let's just render the 'Header' strip for each option to show the Tab + Button layout.
    return null;
};

const ScratchpadTabset = () => {
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'

    return (
        <div className="min-h-screen bg-white p-10 font-sans">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Tabset Explorations</h1>
                    <p className="text-gray-500">Minimalist ways to separate Active/Archived polls with a right-aligned action.</p>
                </div>

                <div className="space-y-10">

                    {/* Option 1: Clean Underline */}
                    <TabSection title="1. Clean Underline" description="Classic, high-clarity minimalist.">
                        <div className="flex items-center justify-between border-b border-gray-200">
                            <div className="flex gap-8">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'active' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Active Polls
                                    {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#7a6e6e] rounded-t-full" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab('archived')}
                                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'archived' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Archived Polls
                                    {activeTab === 'archived' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#7a6e6e] rounded-t-full" />}
                                </button>
                            </div>
                            <button className="flex items-center gap-2 bg-[#7a6e6e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#8d8282] transition transform active:scale-95 mb-2">
                                <PlusCircle size={16} /> New Poll
                            </button>
                        </div>
                        <div className="py-8 text-center text-gray-400 italic bg-gray-50 mt-4 rounded">
                            {activeTab === 'active' ? 'List of Active Polls...' : 'List of Archived Polls...'}
                        </div>
                    </TabSection>


                    {/* Option 2: Soft Pill */}
                    <TabSection title="2. Soft Pill" description="Modern, contained, friendly.">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab('archived')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'archived' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Archived
                                </button>
                            </div>
                            <button className="flex items-center gap-2 bg-[#7a6e6e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#8d8282] transition transform active:scale-95">
                                <PlusCircle size={16} /> New Poll
                            </button>
                        </div>
                        <div className="py-8 text-center text-gray-400 italic bg-gray-50 mt-4 rounded">
                            {activeTab === 'active' ? 'List of Active Polls...' : 'List of Archived Polls...'}
                        </div>
                    </TabSection>


                    {/* Option 3: Minimal Text Only */}
                    <TabSection title="3. Minimal Text" description="Ultra-clean, relying on opacity/color only.">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`text-2xl font-bold transition-colors ${activeTab === 'active' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab('archived')}
                                    className={`text-2xl font-bold transition-colors ${activeTab === 'archived' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    Archived
                                </button>
                            </div>
                            <button className="flex items-center gap-2 bg-[#7a6e6e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#8d8282] transition transform active:scale-95">
                                <PlusCircle size={16} /> New Poll
                            </button>
                        </div>
                        <div className="py-8 text-center text-gray-400 italic bg-gray-50 mt-4 rounded border-t border-gray-100">
                            {activeTab === 'active' ? 'List of Active Polls...' : 'List of Archived Polls...'}
                        </div>
                    </TabSection>


                    {/* Option 4: Floating Segment (Apple Style) */}
                    <TabSection title="4. Floating Segment" description="Subtle background integration.">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'active' ? 'bg-[#7a6e6e] text-white shadow' : 'hover:bg-gray-100 text-gray-500'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab('archived')}
                                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'archived' ? 'bg-[#7a6e6e] text-white shadow' : 'hover:bg-gray-100 text-gray-500'}`}
                                >
                                    Archived
                                </button>
                            </div>

                            <button className="flex items-center gap-2 border border-[#7a6e6e] text-[#7a6e6e] px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition transform active:scale-95">
                                <PlusCircle size={16} /> New Poll
                            </button>
                        </div>
                        <div className="py-8 text-center text-gray-400 italic bg-gray-50 mt-4 rounded">
                            {activeTab === 'active' ? 'List of Active Polls...' : 'List of Archived Polls...'}
                        </div>
                    </TabSection>

                </div>
            </div>
        </div>
    );
};

export default ScratchpadTabset;
