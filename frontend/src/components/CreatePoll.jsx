import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Trash, ArrowLeft } from 'lucide-react';

function CreatePoll() {
    const [title, setTitle] = useState('');
    const [closesAt, setClosesAt] = useState('');
    const navigate = useNavigate();

    // For MVP, we might create the poll first, then redirect to a "Edit Poll" page to add questions?
    // Or do it all in one go. The backend API creates a poll with title, then adds questions separately.
    // I'll implement a 2-step process for robustness:
    // 1. Create Poll (get slug)
    // 2. Add Questions to that slug.

    // Actually, let's keep it simple. User enters title, clicks "Next", poll is created, then they add questions.

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title) return;
        try {
            // Convert local time to UTC or ISO string.
            // datetime-local returns YYYY-MM-DDTHH:mm. 
            // We can send it directly or ensuring it matches backend expectation.
            // Backend expects ISO-8601.
            const payload = { title };
            if (closesAt) {
                payload.closes_at = new Date(closesAt).toISOString();
            }

            const res = await api.post('/polls/', payload);
            navigate(`/${res.data.slug}/edit`);
        } catch (err) {
            console.error(err);
            alert('Failed to create poll');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6">Create New Poll</h1>
                <form onSubmit={handleCreate}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Poll Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Library User Survey"
                            autoFocus
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Close Date (Optional)</label>
                        <input
                            type="datetime-local"
                            value={closesAt}
                            onChange={e => setClosesAt(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-1"
                        />
                        <p className="text-xs text-gray-500">The poll will automatically move to 'Archived' after this time.</p>
                    </div>
                    <div className="flex justify-between">
                        <button type="button" onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Next</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreatePoll;
