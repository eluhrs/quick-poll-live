import React from 'react';

// Enhanced preview showing INTERACTIVE Buttons AND Grouping context
const ColorOption = ({ name, primary, primaryHover, secondary, secondaryHover, secondaryText, groupOpacity = 100, rowOpacity = 100 }) => (
    <div className="bg-[#f6f4f2] p-6 rounded-xl shadow-sm border border-gray-200 break-inside-avoid mb-6 relative overflow-hidden">
        {/* Label */}
        <div className="absolute top-0 left-0 bg-white px-3 py-1 text-xs font-bold text-gray-400 border-b border-r border-gray-200 rounded-br-lg z-10">
            {name}
        </div>

        <div className="pt-8 space-y-6">

            {/* 1. Interactive Button Area */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider text-center">Primary Action</p>
                    <div className="flex flex-col gap-2 items-center">
                        <button
                            className={`w-full px-4 py-3 rounded-lg font-bold shadow-sm transition-all duration-200 transform active:scale-95 text-white`}
                            style={{
                                backgroundColor: primary,
                                '--hover-color': primaryHover
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = primaryHover}
                            onMouseLeave={(e) => e.target.style.backgroundColor = primary}
                        >
                            Default
                        </button>

                        {/* Forced States for Visualization */}
                        <div className="w-full flex justify-between text-[10px] text-gray-400 pt-1">
                            <div className="text-center w-full">Hover</div>
                            <div className="text-center w-full">Active</div>
                        </div>

                        <div className="flex gap-2 w-full">
                            {/* Hover Simulation */}
                            <button
                                className={`flex-1 px-2 py-2 rounded-lg font-bold shadow-sm text-xs text-white`}
                                style={{ backgroundColor: primaryHover }}
                            >
                                Hover
                            </button>
                            {/* Active Simulation */}
                            <button
                                className={`flex-1 px-2 py-2 rounded-lg font-bold shadow-sm text-xs transform scale-95 text-white`}
                                style={{ backgroundColor: primary }}
                            >
                                Active
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider text-center">Secondary Action</p>
                    <div className="flex flex-col gap-2 items-center">
                        <button
                            className={`w-full px-4 py-3 rounded-lg font-bold shadow-sm transition-all duration-200 transform active:scale-95 border`}
                            style={{
                                backgroundColor: secondary,
                                color: secondaryText,
                                borderColor: primary,
                                '--hover-color': secondaryHover
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = secondaryHover}
                            onMouseLeave={(e) => e.target.style.backgroundColor = secondary}
                        >
                            Default
                        </button>

                        <div className="w-full flex justify-between text-[10px] text-gray-400 pt-1">
                            <div className="text-center w-full">Hover</div>
                            <div className="text-center w-full">Active</div>
                        </div>

                        <div className="flex gap-2 w-full">
                            <button
                                className={`flex-1 px-2 py-2 rounded-lg font-bold border transition text-xs`}
                                style={{
                                    backgroundColor: secondaryHover,
                                    color: secondaryText,
                                    borderColor: primary,
                                }}
                            >
                                Hover
                            </button>
                            <button
                                className={`flex-1 px-2 py-2 rounded-lg font-bold border transition text-xs transform scale-95`}
                                style={{
                                    backgroundColor: secondary,
                                    color: secondaryText,
                                    borderColor: primary,
                                }}
                            >
                                Active
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Coordinated Grouping Colors (Dynamic) */}
            <div className={`border border-[${primary}] border-opacity-30 rounded-lg overflow-hidden bg-white shadow-sm`}>
                {/* Header Mockup */}
                <div
                    className={`border-b border-[${primary}] border-opacity-20 px-3 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center`}
                    style={{ backgroundColor: secondary, color: secondaryText, opacity: groupOpacity / 100 }}
                >
                    <span>Grouping Header</span>
                </div>

                {/* Row Mockup - Hover Effect Simulated with Group */}
                <div
                    className={`p-3 border-b border-[${primary}] border-opacity-10 transition-colors flex justify-between items-center group cursor-pointer`}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = secondaryHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    style={{ color: secondaryText }}
                >
                    <span className="text-sm font-medium">List Item (Hover Me)</span>
                </div>

                {/* Active/Edit Row */}
                <div
                    className={`p-3 border-b border-[${primary}] border-opacity-10 flex justify-between items-center`}
                    style={{ backgroundColor: secondary, opacity: Math.min((rowOpacity + 30), 100) / 100, color: secondaryText }}
                >
                    <span className="text-sm font-medium font-bold">Active/Edit Row</span>
                </div>
            </div>

        </div>
    </div>
);

const ScratchpadButtons = () => {
    return (
        <div className="min-h-screen bg-white p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Button Collection (Archived)</h1>
                    <p className="text-gray-500">Archived "Lehigh" button variations.</p>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6">

                    {/* 1. Original */}
                    <ColorOption name="1. Lehigh Cool (Original)"
                        primary="#3b2f2f" primaryHover="#4a3e3e"
                        secondary="#dcdcdc" secondaryText="#3b2f2f" secondaryHover="#ededed"
                        groupOpacity={100} rowOpacity={100} />

                    {/* 2. Modern */}
                    <ColorOption name="2. Lehigh Modern"
                        primary="#4e4242" primaryHover="#605454"
                        secondary="#dcdcdc" secondaryText="#3b2f2f" secondaryHover="#ededed"
                        groupOpacity={100} rowOpacity={100} />

                    {/* 3. Stone */}
                    <ColorOption name="3. Lehigh Stone"
                        primary="#565656" primaryHover="#6b6b6b"
                        secondary="#dcdcdc" secondaryText="#3b2f2f" secondaryHover="#ededed"
                        groupOpacity={100} rowOpacity={100} />

                    {/* 4. Minimal */}
                    <ColorOption name="4. Lehigh Minimal"
                        primary="#625858" primaryHover="#756c6c"
                        secondary="#dcdcdc" secondaryText="#3b2f2f" secondaryHover="#ededed"
                        groupOpacity={100} rowOpacity={100} />

                    {/* 5. Soft */}
                    <ColorOption name="5. Lehigh Soft"
                        primary="#7a6e6e" primaryHover="#8d8282"
                        secondary="#dcdcdc" secondaryText="#3b2f2f" secondaryHover="#ededed"
                        groupOpacity={100} rowOpacity={100} />

                    {/* 6. Air */}
                    <ColorOption name="6. Lehigh Air"
                        primary="#928888" primaryHover="#a69e9e"
                        secondary="#dcdcdc" secondaryText="#3b2f2f" secondaryHover="#ededed"
                        groupOpacity={100} rowOpacity={100} />

                </div>
            </div>
        </div>
    );
};

export default ScratchpadButtons;
