import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api';

function VotingView() {
    const { slug } = useParams();
    const [poll, setPoll] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: { value: string|int, isText: bool } }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
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

    const handleOptionSelect = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { value: optionId, isText: false }
        }));
    };

    const handleTextChange = (questionId, text) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { value: text, isText: true }
        }));
    };

    const handleNext = () => {
        // Validate current question answer
        const currentQ = poll.questions[currentQIndex];
        if (!answers[currentQ.id] || (answers[currentQ.id].isText && !answers[currentQ.id].value.trim())) {
            alert("Please answer the question to proceed.");
            return;
        }

        if (currentQIndex < poll.questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
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
    if (!poll) return <div className="p-8 text-center">Loading...</div>;

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
                        to={`/${slug}/view`}
                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                        View Results <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    const question = poll.questions[currentQIndex];
    const isLast = currentQIndex === poll.questions.length - 1;
    const currentAnswer = answers[question?.id];

    return (
        <div className="min-h-screen p-6 flex flex-col items-center bg-gray-50">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-xl font-bold text-gray-600">{poll.title}</h1>
                    <div className="flex justify-center gap-1 mt-2">
                        {poll.questions.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 w-8 rounded-full transition-colors ${idx <= currentQIndex ? 'bg-primary' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">Question {currentQIndex + 1} of {poll.questions.length}</p>
                </div>

                {!poll.is_active && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 text-center">
                        This poll is closed.
                    </div>
                )}

                {/* Question Card */}
                {question && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 leading-tight">{question.text}</h2>

                        <div className="space-y-3">
                            {question.question_type === 'multiple_choice' && question.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(question.id, opt.id)}
                                    disabled={!poll.is_active}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all active:scale-[0.98] ${currentAnswer?.value === opt.id
                                        ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                                        : 'border-gray-100 hover:border-primary/30 hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    {opt.text}
                                </button>
                            ))}

                            {question.question_type === 'open_ended' && (
                                <textarea
                                    className="w-full border-2 border-gray-200 rounded-lg p-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition"
                                    rows={4}
                                    placeholder="Type your answer here..."
                                    value={currentAnswer?.isText ? currentAnswer.value : ''}
                                    onChange={(e) => handleTextChange(question.id, e.target.value)}
                                    disabled={!poll.is_active}
                                />
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleBack}
                                disabled={currentQIndex === 0}
                                className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${currentQIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <ArrowLeft size={20} /> Back
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={!poll.is_active || isSubmitting}
                                className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition transform active:scale-95 flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : (isLast ? 'Submit Votes' : 'Next')}
                                {!isSubmitting && <ArrowRight size={20} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VotingView;
