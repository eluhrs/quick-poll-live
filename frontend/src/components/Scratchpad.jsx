import React from 'react';
import { Link } from 'react-router-dom';

const Scratchpad = () => {
    return (
        <div className="min-h-screen bg-white p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="text-center space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900">UI Scratchpad</h1>
                    <p className="text-gray-500">A space for iterating on new UI concepts.</p>

                    <div className="flex justify-center items-start space-x-4"> {/* Added a flex container here */}
                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 inline-block">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Archived Concepts</h2>
                            <ul className="space-y-4">
                                <li>
                                    <Link to="/scratchpad/buttons" className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition group">
                                        <span className="font-bold text-gray-700 group-hover:text-blue-600">Button Collection (Archived)</span>
                                        <span className="text-xs text-gray-400">Lehigh Variations</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 inline-block ml-4 align-top">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">New Experiments</h2>
                            <ul className="space-y-4">
                                <li>
                                    <Link to="/scratchpad/tabset" className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-green-400 transition group">
                                        <span className="font-bold text-gray-700 group-hover:text-green-600">Tabset Explorations</span>
                                        <span className="text-xs text-gray-400">Tabs + Actions</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Entry Page Concepts: Vote vs Results</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Option 1: The "Split Action" Group */}
                        <div className="p-6 bg-gray-50 border rounded-xl">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Option 1: Split Actions</h3>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Enter Poll Code</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        placeholder="CODE"
                                        className="w-full text-xl font-bold p-3 border-2 border-r-0 border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500 uppercase"
                                    />
                                    <div className="flex flex-col border-2 border-l-0 border-gray-300 rounded-r-lg overflow-hidden divide-y-2 divide-gray-300">
                                        <button className="flex-1 px-4 bg-blue-600 text-white font-bold hover:bg-blue-700 text-xs uppercase tracking-wider transition">
                                            Vote
                                        </button>
                                        <button className="flex-1 px-4 bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-xs uppercase tracking-wider transition">
                                            Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Option 2: The "Hover Reveal" (Low Friction) */}
                        <div className="p-6 bg-gray-50 border rounded-xl">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Option 2: Hover Reveal</h3>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-48 flex flex-col justify-center">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Enter Poll Code</label>
                                <div className="relative group">
                                    <div className="flex">
                                        <input
                                            type="text"
                                            placeholder="CODE"
                                            className="w-full text-xl font-bold p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase z-10 relative bg-white"
                                        />
                                        <button className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 z-20 group-hover:opacity-0 transition-opacity duration-200">
                                            GO
                                        </button>
                                    </div>

                                    {/* Reveal Menu - Appears on Group Hover */}
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-lg p-2 invisible opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 translate-y-2 transition-all duration-200 z-30 flex gap-2">
                                        <button className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">
                                            VOTE
                                        </button>
                                        <button className="flex-1 bg-gray-600 text-white font-bold py-2 rounded hover:bg-gray-700">
                                            RESULTS
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center group-focus-within:opacity-0 transition-opacity">
                                        Type code to start
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Option 3: The "Segmented Toggle" */}
                        <div className="p-6 bg-gray-50 border rounded-xl">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Option 3: Mode Toggle</h3>
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">

                                {/* Toggle Switch */}
                                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                                    <button className="flex-1 bg-white shadow-sm py-1 px-3 rounded-md text-sm font-bold text-blue-600">
                                        I want to VOTE
                                    </button>
                                    <button className="flex-1 py-1 px-3 rounded-md text-sm font-bold text-gray-400 hover:text-gray-600">
                                        View RESULTS
                                    </button>
                                </div>

                                <div className="flex">
                                    <input
                                        type="text"
                                        placeholder="ENTER CODE"
                                        className="w-full text-xl font-bold p-3 border-2 border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500 uppercase"
                                    />
                                    <button className="px-6 bg-blue-600 text-white font-bold rounded-r-lg hover:bg-blue-700">
                                        GO
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scratchpad;
