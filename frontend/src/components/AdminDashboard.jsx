import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, Archive, Share2, Check, Edit, Trash2, RotateCcw } from 'lucide-react';
import DeleteModal from './DeleteModal';
import Header from './Header';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

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
        const url = `${window.location.origin}/${slug}/vote`;
        navigator.clipboard.writeText(url);
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
                                    active
                                    onCopy={handleCopy}
                                    copiedId={copiedId}
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

function Section({ title, polls, onClose, onDelete, active, onCopy, copiedId }) {
    if (polls.length === 0) return (
        <div className="text-gray-400 italic p-6 bg-white rounded-lg border border-gray-200">No polls found in this section.</div>
    );

    return (
        <section>
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
                                    <Link
                                        to={`/${poll.slug}/edit`}
                                        className="font-medium text-gray-900 text-lg hover:underline decoration-gray-400 underline-offset-4"
                                    >
                                        {poll.title}
                                    </Link>
                                    <div className="text-gray-500 text-sm mt-1">{poll.questions.length} Questions</div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {new Date(poll.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {poll.closes_at ? new Date(poll.closes_at).toLocaleString() : (poll.closed_at ? new Date(poll.closed_at).toLocaleDateString() : <span className="text-2xl leading-none">&infin;</span>)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex gap-4 justify-end items-center">
                                        <Link to={`/${poll.slug}/edit`} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Edit Poll">
                                            <Edit size={20} />
                                        </Link>

                                        <button
                                            onClick={() => onCopy(poll.id, poll.slug)}
                                            className={`transition-colors ${copiedId === poll.id ? 'text-gray-400' : 'text-gray-400 hover:text-blue-600'}`}
                                            title="Share Poll"
                                        >
                                            {copiedId === poll.id ? <Check size={20} /> : <Share2 size={20} />}
                                        </button>

                                        {active ? (
                                            <button onClick={() => onClose(poll.slug)} className="text-gray-400 hover:text-amber-600 transition-colors" title="Close Poll">
                                                <Archive size={20} />
                                            </button>
                                        ) : (
                                            <button onClick={() => onClose(poll.slug)} className="text-gray-400 hover:text-green-600 transition-colors" title="Reopen Poll">
                                                <RotateCcw size={20} />
                                            </button>
                                        )}

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

export default AdminDashboard;
