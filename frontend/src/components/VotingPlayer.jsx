import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

function VotingPlayer({ poll, onSubmit, isPreview = false }) {
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: { value: string|int, isText: bool } }

    if (!poll || !poll.questions || poll.questions.length === 0) {
        return <div className="text-center p-8 text-gray-500">No questions to display.</div>;
    }

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


    // Auto-advance logic for Preview mode
    // Auto-advance logic for Preview mode
    const [isPlaying, setIsPlaying] = useState(true); // Default to playing
    const [timeLeft, setTimeLeft] = useState(poll.slide_duration || 3);
    const timerRef = React.useRef(null);

    // Timer Effect
    React.useEffect(() => {
        if (isPlaying && isPreview && poll.questions.length > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev > 0 ? prev - 1 : 0);
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, isPreview, poll]);

    // Trigger Side-Effect Effect
    React.useEffect(() => {
        if (isPlaying && isPreview && timeLeft === 0) {
            handleNext(true); // Force next
            setTimeLeft(poll.slide_duration || 3); // Reset timer
        }
    }, [timeLeft, isPlaying, isPreview, poll.slide_duration]);

    const handleNext = (force = false) => {
        // Validation (skipped if force=true which is used by auto-play or scrubbing)
        const currentQ = poll.questions[currentQIndex];

        // If not forced (manual interaction) and not just "scrubbing" via arrows
        if (!force && !isPreview && (!answers[currentQ.id] || (answers[currentQ.id].isText && !answers[currentQ.id].value.trim()))) {
            alert("Please answer the question to proceed.");
            return;
        }

        if (currentQIndex < poll.questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            if (!force && onSubmit) {
                onSubmit(answers);
            } else if (!force) {
                alert("This is a preview. Responses are not saved.");
            } else {
                // Loop back to start if auto-playing? Or just stop. PollPlayer loops.
                setCurrentQIndex(0);
            }
        }
    };

    const handleBack = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        } else {
            // Loop to end? PollPlayer loops.
            setCurrentQIndex(poll.questions.length - 1);
        }
    };

    // Manual Arrow Click (Scrubbing - skip validation in preview)
    const handleManualNext = () => {
        if (isPreview) handleNext(true);
        else handleNext();
    };

    const question = poll.questions[currentQIndex];
    const isLast = currentQIndex === poll.questions.length - 1;
    const currentAnswer = answers[question?.id];

    return (
        <div className="flex flex-col items-center w-full">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-xl font-bold text-gray-600">{poll.title} {isPreview && <span className="text-primary text-xs uppercase bg-primary/10 px-2 py-1 rounded ml-2">Preview</span>}</h1>
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

                {!poll.is_active && !isPreview && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 text-center">
                        This poll is closed.
                    </div>
                )}

                {/* Question Card */}
                {question && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary text-left">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 leading-tight">{question.text}</h2>

                        <div className="space-y-3">
                            {question.question_type === 'multiple_choice' && question.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(question.id, opt.id)}
                                    // In preview, we always allow interaction even if poll closed (to test)
                                    disabled={!poll.is_active && !isPreview}
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
                                    disabled={!poll.is_active && !isPreview}
                                />
                            )}
                        </div>

                        {/* Navigation - Standard Form Buttons */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleBack}
                                disabled={currentQIndex === 0 && !isPreview} // Allow looping in preview manual controls, but button here usually strict? Let's keep strict for "Form" feeling.
                                className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition ${currentQIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <ArrowLeft size={20} /> Back
                            </button>

                            <button
                                onClick={() => handleNext()}
                                disabled={(!poll.is_active && !isPreview)}
                                className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition transform active:scale-95 flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLast ? (isPreview ? 'Finish Preview' : 'Submit Votes') : 'Next'}
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Preview Controls - ONLY visible in Preview Mode */}
                {isPreview && (
                    <div className="h-12 flex justify-center items-center gap-6 text-gray-400 hover:text-gray-600 transition border-t border-gray-100 mt-8">
                        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full transition" title="Previous Slide"><ChevronLeft size={24} /></button>
                        <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 hover:bg-gray-100 rounded-full transition text-primary" title={isPlaying ? "Pause" : "Auto-Play"}>
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <button onClick={handleManualNext} className="p-2 hover:bg-gray-100 rounded-full transition" title="Next Slide"><ChevronRight size={24} /></button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VotingPlayer;
