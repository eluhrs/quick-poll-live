import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function VotingView() {
    const { slug } = useParams();
    const [poll, setPoll] = useState(null);
    const [responses, setResponses] = useState({}); // Map questionId -> optionId or text
    const [submitted, setSubmitted] = useState({});

    useEffect(() => {
        fetchPoll();
    }, [slug]);

    const fetchPoll = async () => {
        try {
            const res = await api.get(`/polls/${slug}`);
            setPoll(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleVote = async (questionId, value, isText = false) => {
        const payload = {
            question_id: questionId,
            [isText ? 'text_answer' : 'option_id']: value
        };

        try {
            await api.post(`/polls/${slug}/vote`, payload);
            setSubmitted({ ...submitted, [questionId]: true });
        } catch (err) {
            alert("Failed to vote");
        }
    };

    if (!poll) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen p-6 flex flex-col items-center">
            <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg border-t-8 border-blue-600">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">{poll.title}</h1>
                <p className="text-gray-500 mb-6">Please answer the following questions</p>

                {!poll.is_active && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
                        This poll is closed.
                    </div>
                )}

                <div className="space-y-8">
                    {poll.questions.map((q, idx) => (
                        <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                            <h3 className="font-semibold text-lg mb-4 text-gray-800">{idx + 1}. {q.text}</h3>

                            {submitted[q.id] ? (
                                <div className="text-green-600 font-medium bg-green-50 p-3 rounded-lg flex items-center gap-2">
                                    Answer submitted
                                </div>
                            ) : (
                                <div>
                                    {q.type === 'multiple_choice' && (
                                        <div className="space-y-3">
                                            {q.options.map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleVote(q.id, opt.id)}
                                                    disabled={!poll.is_active}
                                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition active:scale-95 disabled:opacity-50"
                                                >
                                                    {opt.text}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {q.type === 'open_ended' && (
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-grow border rounded-lg px-3 py-2"
                                                placeholder="Type your answer..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleVote(q.id, e.target.value, true);
                                                }}
                                            />
                                            <button className="bg-blue-600 text-white px-4 rounded-lg">Send</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default VotingView;
