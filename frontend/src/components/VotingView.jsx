import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import api from '../api';
import VotingPlayer from './VotingPlayer';

function VotingView() {
    const { slug } = useParams();
    const [poll, setPoll] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = 'Quick Poll Live: Vote';
        fetchPoll();
    }, [slug]);

    const fetchPoll = async () => {
        try {
            const res = await api.get(`/polls/${slug}`);
            setPoll(res.data);
        } catch (err) {
            console.error(err);
            setError("Poll not found.");
        }
    };

    const handlePlayerSubmit = async (answers) => {
        setIsSubmitting(true);
        try {
            // Send votes in parallel
            const votePromises = Object.keys(answers).map(qId => {
                const ans = answers[qId];
                const payload = {
                    question_id: parseInt(qId),
                    [ans.isText ? 'text_answer' : 'option_id']: ans.value
                };
                return api.post(`/polls/${slug}/vote`, payload);
            });

            await Promise.all(votePromises);
            setIsFinished(true);
        } catch (err) {
            console.error(err);
            alert("Failed to submit votes. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (error) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;
    if (!poll) return <div className="p-8 text-center text-gray-500">Loading Poll...</div>;

    if (isFinished) {
        return (
            <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
                    <div className="flex justify-center mb-4 text-green-500">
                        <CheckCircle size={64} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">Thank You!</h1>
                    <p className="text-gray-600 mb-6">Your votes have been submitted successfully.</p>
                    <Link
                        to={`/${slug}/results`}
                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                        View Results <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500 font-bold">Submitting your votes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 flex flex-col items-center bg-gray-50">
            <VotingPlayer poll={poll} onSubmit={handlePlayerSubmit} />
        </div>
    );
}

export default VotingView;
