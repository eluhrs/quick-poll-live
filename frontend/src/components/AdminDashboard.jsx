import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, Archive, Check, Edit, Trash2, RotateCcw, Copy, Hash, ExternalLink, BarChart2, ChevronDown } from 'lucide-react';
import DeleteModal from './DeleteModal';
import Header from './Header';


function AdminDashboard() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, slug: null });
    const [activeTab, setActiveTab] = useState('active');
    const navigate = useNavigate();

    const confirmDelete = (slug) => {
        setModalConfig({
            isOpen: true,
            type: 'delete',
            slug,
            title: 'Delete Poll?',
            message: 'Are you sure you want to delete this poll permanently? This cannot be undone.',
            confirmText: 'Delete Poll',
            isDanger: true
        });
    };

    const confirmClose = (slug) => {
        setModalConfig({
            isOpen: true,
            type: 'close',
            slug,
            title: 'Archive Poll?',
            message: 'Are you sure you want to close and archive this poll? Users will no longer be able to submit votes.',
            confirmText: 'Archive Poll',
            isDanger: false
        });
    };

    const confirmReopen = (slug) => {
        setModalConfig({
            isOpen: true,
            type: 'reopen',
            slug,
            title: 'Reopen Poll?',
            message: 'Are you sure you want to reopen this poll? Users will be able to submit votes again.',
            confirmText: 'Reopen Poll',
            isDanger: false
        });
    };

    const confirmReset = (slug) => {
        setModalConfig({
            isOpen: true,
            type: 'reset',
            slug,
            title: 'Reset Poll?',
            message: 'Are you sure you want to clear ALL votes for this poll? This cannot be undone.',
            confirmText: 'Reset Votes',
            isDanger: true
        });
    };

    const handleModalConfirm = async () => {
        const { type, slug } = modalConfig;
        if (!slug) return;

        try {
            if (type === 'delete') {
                await api.delete(`/polls/${slug}`);
            } else if (type === 'close') {
                await api.put(`/polls/${slug}/close`);
            } else if (type === 'reopen') {
                await api.put(`/polls/${slug}/open`);
            } else if (type === 'reset') {
                await api.put(`/polls/${slug}/reset`);
            }
            fetchPolls();
        } catch (error) {
            console.error(`Failed to ${type} poll`, error);
            alert(`Failed to ${type} poll`);
        } finally {
            setModalConfig({ ...modalConfig, isOpen: false });
        }
    };

    useEffect(() => {
        document.title = 'Quick Poll Live: Dashboard';
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        try {
            const response = await api.get(`/polls/?t=${Date.now()}`);
            setPolls(response.data);
        } catch (error) {
            console.error("Failed to fetch polls", error);
            if (error.response && error.response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };



    const activePolls = polls.filter(p => p.is_active);
    const archivedPolls = polls.filter(p => !p.is_active);

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <Header />

                {/* Debug Panel (Toggle via .env VITE_ENABLE_DEBUG=true) */}
                {import.meta.env.VITE_ENABLE_DEBUG === 'true' && (
                    <div className="bg-red-100 p-4 mb-4 rounded border border-red-400 text-xs font-mono">
                        <p><strong>DEBUG INFO:</strong></p>
                        <p>Polls Count: {polls.length}</p>
                        <p>Raw Data: {JSON.stringify(polls)}</p>
                    </div>
                )}

                {/* Tabbed Interface */}
                <div>
                    {/* Tab Nav & Action */}
                    <div className="flex items-center justify-between mb-6 border-b border-gray-300">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'active' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Active Polls
                                {activeTab === 'active' && <span className="absolute bottom-[-1px] left-0 w-full h-1 bg-primary rounded-t-md"></span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('archived')}
                                className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'archived' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Archived Polls
                                {activeTab === 'archived' && <span className="absolute bottom-[-1px] left-0 w-full h-1 bg-primary rounded-t-md"></span>}
                            </button>
                        </div>

                        <Link
                            to="/dashboard/create"
                            id="create-btn"
                            className={`bg-gray-50 hover:bg-secondary-hover text-gray-500 hover:text-primary border-2 border-dashed border-gray-300 hover:border-primary text-sm font-bold py-2 px-4 rounded-lg transition-colors active:scale-95 flex items-center gap-2 mb-2 ${activeTab === 'active' ? '' : 'invisible pointer-events-none'}`}
                        >
                            <PlusCircle size={16} /> New Poll
                        </Link>
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'active' ? (
                            <div id="active-polls">
                                <Section
                                    title="Active Polls"
                                    polls={activePolls}
                                    onClose={confirmClose}
                                    onDelete={confirmDelete}
                                    onReset={confirmReset}
                                    active
                                />
                            </div>
                        ) : (
                            <div id="archived-polls">
                                <Section
                                    title="Archived Polls"
                                    polls={archivedPolls}
                                    onClose={confirmReopen}
                                    onDelete={confirmDelete}
                                    onReset={confirmReset}
                                />
                            </div>
                        )}
                    </div>

                    {activeTab === 'active' && (
                        <Link
                            to="/dashboard/create"
                            className="w-1/3 mx-auto mt-4 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors group bg-gray-50 hover:bg-secondary-hover"
                        >
                            <PlusCircle className="group-hover:scale-110 transition-transform" />
                            <span className="font-bold">New Poll</span>
                        </Link>
                    )}
                </div>
            </div>

            <DeleteModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleModalConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                isDanger={modalConfig.isDanger}
            />
        </div>
    );
}

function Section({ title, polls, onClose, onDelete, onReset, active }) {
    if (polls.length === 0) return (
        <div className="text-gray-400 italic p-6 bg-white rounded-lg border border-gray-200">No polls found in this section.</div>
    );

    return (
        <section>
            {/* Removed overflow-hidden to allow dropdowns to spill out. Added rounded corners manually to headers. */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-400">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-secondary border-b border-gray-300 text-secondary-text text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4 first:rounded-tl-xl">Title</th>
                            <th className="px-6 py-4">Start Date</th>
                            <th className="px-6 py-4">Close Date</th>
                            <th className="px-6 py-4 text-right last:rounded-tr-xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {polls.map(poll => (
                            <tr key={poll.id} className="hover:bg-secondary-hover transition-colors last:rounded-b-xl">
                                <td className="px-6 py-4 first:rounded-bl-xl">
                                    <Link
                                        to={`/${poll.slug}/edit`}
                                        className="font-medium text-gray-900 text-lg hover:underline decoration-gray-400 underline-offset-4"
                                    >
                                        {poll.title}
                                    </Link>
                                    <div className="text-gray-500 text-sm mt-1">
                                        {poll.questions.length} Questions / {Math.max(0, ...poll.questions.map(q => q.votes ? q.votes.length : 0))} Responses
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {new Date(poll.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {poll.closes_at ? new Date(poll.closes_at).toLocaleString() : (poll.closed_at ? new Date(poll.closed_at).toLocaleDateString() : <span className="text-2xl leading-none">&infin;</span>)}
                                </td>
                                <td className="px-6 py-4 text-right last:rounded-br-xl">
                                    <div className="flex gap-4 justify-end items-center">
                                        <Link to={`/${poll.slug}/edit`} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Edit Poll">
                                            <Edit size={20} />
                                        </Link>

                                        <ShareMenu slug={poll.slug} />

                                        {active ? (
                                            <button onClick={() => onClose(poll.slug)} className="text-gray-400 hover:text-amber-600 transition-colors" title="Close Poll">
                                                <Archive size={20} />
                                            </button>
                                        ) : (
                                            <button onClick={() => onClose(poll.slug)} className="text-gray-400 hover:text-green-600 transition-colors" title="Reopen Poll">
                                                <RotateCcw size={20} />
                                            </button>
                                        )}

                                        <button onClick={() => onReset(poll.slug)} className="text-gray-400 hover:text-orange-600 transition-colors" title="Reset Poll">
                                            <RotateCcw size={20} />
                                        </button>

                                        <button onClick={() => onDelete(poll.slug)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete Poll">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

function ShareMenu({ slug }) {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'code', 'vote', 'results'

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.share-menu-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        setFeedback(type);
        setTimeout(() => setFeedback(null), 2000);
        // Optional: Close menu after copy or keep open? User preference usually keep open for multiple actions or close. 
        // Let's close after a short delay or keep open to see feedback.
        // Keeping open to see feedback checkmark is better UX.
    };

    return (
        <div className="relative share-menu-container flex items-center">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`transition-colors flex items-center ${isOpen ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                title="Copy Poll Options"
            >
                <Copy size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="py-1">
                        <button
                            onClick={() => copyToClipboard(slug, 'code')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                        >
                            {feedback === 'code' ? <Check size={16} className="text-green-600" /> : <Hash size={16} />}
                            Copy Code
                        </button>

                        <button
                            onClick={() => copyToClipboard(`${window.location.origin}/${slug}/vote`, 'vote')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                        >
                            {feedback === 'vote' ? <Check size={16} className="text-green-600" /> : <ExternalLink size={16} />}
                            Copy Vote URL
                        </button>

                        <button
                            onClick={() => copyToClipboard(`${window.location.origin}/${slug}/results`, 'results')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
                        >
                            {feedback === 'results' ? <Check size={16} className="text-green-600" /> : <BarChart2 size={16} />}
                            Copy Results URL
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
