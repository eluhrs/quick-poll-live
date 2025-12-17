import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, ExternalLink, Archive, PlayCircle, BarChart2, Edit, Trash2, RotateCcw, LogOut, Eye } from 'lucide-react';
import DeleteModal from './DeleteModal';
import Header from './Header';

function AdminDashboard() {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, slug: null });
    const [copiedId, setCopiedId] = useState(null);
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
            }
            fetchPolls();
        } catch (error) {
            console.error(`Failed to ${type} poll`, error);
            alert(`Failed to ${type} poll`);
        } finally {
            setModalConfig({ ...modalConfig, isOpen: false });
        }
    };

    const handleCopy = (id, slug) => {
        navigator.clipboard.writeText(slug);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    useEffect(() => {
        fetchPolls();
    }, []);

    useEffect(() => {
        if (!loading) {
            const tourSeen = localStorage.getItem('tour_seen');
            if (!tourSeen) {
                const driverObj = driver({
                    showProgress: true,
                    steps: [
                        { element: '#create-btn', popover: { title: 'Create Poll', description: 'Start here to create your first poll.' } },
                        { element: '#active-polls', popover: { title: 'Active Polls', description: 'Your running polls will appear here.' } },
                        { element: '#archived-polls', popover: { title: 'Archived Polls', description: 'Closed polls are stored here for reference.' } }
                    ]
                });
                driverObj.drive();
                localStorage.setItem('tour_seen', 'true');
            }
        }
    }, [loading]);

    const fetchPolls = async () => {
        try {
            const response = await api.get('/polls');
            setPolls(response.data);
        } catch (error) {
            console.error("Failed to fetch polls", error);
            if (error.response && error.response.status === 401) {
                navigate('/login');
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

                {/* Tabbed Interface */}
                <div>
                    {/* Tab Nav & Action */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`text-2xl font-bold transition-colors ${activeTab === 'active' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Active Polls
                            </button>

                            {/* Divider matching deselected color */}
                            <div className="h-8 w-px bg-gray-400 mx-6"></div>

                            <button
                                onClick={() => setActiveTab('archived')}
                                className={`text-2xl font-bold transition-colors ${activeTab === 'archived' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Archived Polls
                            </button>
                        </div>
                        <Link
                            to="/dashboard/create"
                            id="create-btn"
                            className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition transform active:scale-95"
                        >
                            <PlusCircle size={20} /> New Poll
                        </Link>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'active' ? (
                            <div id="active-polls">
                                <Section
                                    title="Active Polls"
                                    polls={activePolls}
                                    onClose={confirmClose}
                                    onDelete={confirmDelete}
                                    active
                                    onCopy={handleCopy}
                                    copiedId={copiedId}
                                // Removed headerAction as it is now global
                                />
                            </div>
                        ) : (
                            <div id="archived-polls">
                                <Section
                                    title="Archived Polls"
                                    polls={archivedPolls}
                                    onClose={confirmReopen}
                                    onDelete={confirmDelete}
                                    onCopy={handleCopy}
                                    copiedId={copiedId}
                                />
                            </div>
                        )}
                    </div>
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

function Section({ title, polls, onClose, onDelete, active, onCopy, copiedId, headerAction }) {
    // If we have specific header actions, show the header row. Otherwise, if title is hidden by tabs, we might skip it.
    // However, keeping the title "Active Polls" inside the tab content is redundant.
    // I will remove the Header Title rendering from Section since the Tabs serve that purpose now.

    if (polls.length === 0) return (
        <div className="text-gray-400 italic p-6 bg-white rounded-lg border border-gray-200">No polls found in this section.</div>
    );

    return (
        <section>
            {/* Removed redundant headerTitle since we have tabs now */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-400 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-secondary border-b border-gray-300 text-secondary-text text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Title</th>
                            <th className="px-6 py-4">Start Date</th>
                            <th className="px-6 py-4">Close Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {polls.map(poll => (
                            <tr key={poll.id} className="hover:bg-secondary-hover transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium text-gray-900 text-lg">{poll.title}</span>
                                        <button
                                            onClick={() => onCopy(poll.id, poll.slug)}
                                            className={`text-sm font-mono pl-1 py-0.5 transition-all cursor-pointer w-24 text-left ${copiedId === poll.id
                                                ? 'text-gray-500'
                                                : 'text-gray-500 hover:text-blue-600'
                                                }`}
                                            title="Click to copy code"
                                        >
                                            {copiedId === poll.id ? 'Copied!' : `(${poll.slug})`}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {new Date(poll.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {poll.closes_at ? new Date(poll.closes_at).toLocaleString() : (poll.closed_at ? new Date(poll.closed_at).toLocaleDateString() : '—')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <Link to={`/${poll.slug}/view`} target="_blank" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Present Mode">
                                            <Eye size={18} />
                                        </Link>

                                        <Link to={`/${poll.slug}/edit`} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit Poll">
                                            <Edit size={18} />
                                        </Link>

                                        {active ? (
                                            <button onClick={() => onClose(poll.slug)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded" title="Close Poll">
                                                <Archive size={18} />
                                            </button>
                                        ) : (
                                            <button onClick={() => onClose(poll.slug)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Reopen Poll">
                                                <RotateCcw size={18} />
                                            </button>
                                        )}

                                        <button onClick={() => onDelete(poll.slug)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete Poll">
                                            <Trash2 size={18} />
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

export default AdminDashboard;
