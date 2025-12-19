import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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

                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 inline-block ml-4 align-top">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Landing Experiments</h2>
                            <ul className="space-y-4">
                                <li>
                                    <Link to="/scratchpad/landing-options" className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-primary transition group">
                                        <span className="font-bold text-gray-700 group-hover:text-primary">Landing Page Styling</span>
                                        <span className="text-xs text-gray-400">Toggle & Colors</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scratchpad;
