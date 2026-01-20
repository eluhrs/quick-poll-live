import React, { useState, useRef, useEffect } from 'react';
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

    // --- BOT PROTECTION & INTERACTION LOCK ---
    const [honey, setHoney] = useState('');
    const mountedAt = useRef(Date.now());
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Reset speed limit and lock interaction on slide change
    useEffect(() => {
        mountedAt.current = Date.now();
        setIsTransitioning(true);
        const timer = setTimeout(() => setIsTransitioning(false), 500);
        return () => clearTimeout(timer);
    }, [currentQIndex]);

    const handleNext = (force = false) => {
        // Validation (skipped if force=true which is used by auto-play or scrubbing)
        const currentQ = poll.questions[currentQIndex];
        const testFlag = import.meta.env.VITE_TEST_FLAG;
        const isDev = window.location.hostname === 'localhost' || new URLSearchParams(window.location.search).get(testFlag) === 'true';

        // BOT CHECK 1: Honeypot
        // If the hidden field has any value, it's a bot.
        if (!force && !isDev && honey) {
            console.warn("Honeypot triggered.");
            // Silent fail or fake success? Let's simply return to frustrate them.
            return;
        }

        // BOT CHECK 2: Speed Limit
        // If trying to submit within 1 second of SLIDE LOAD, it's inhumane.
        // Also checks isTransitioning (500ms hard lock)
        if (!force && !isPreview && !isDev && (isTransitioning || (Date.now() - mountedAt.current < 1000))) {
            console.warn("Speed limit or transition lock triggered.");
            return;
        }

        // If not forced (manual interaction) and not just "scrubbing" via arrows
        if (!force && !isPreview && (!answers[currentQ.id] || (answers[currentQ.id].isText && !answers[currentQ.id].value.trim()))) {
            alert("Please answer the question to proceed.");
            return;
        }

        // Force blur to remove focus from buttons on mobile
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
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
                {/* ... Header omitted ... */}

                {/* ... Bot / Closed checks ... */}

                {/* DEBUG OVERLAY */}
                {new URLSearchParams(window.location.search).get('debug') === 'true' && (
                    <div className="fixed top-0 left-0 bg-black/80 text-green-400 p-2 text-xs z-50 w-full overflow-auto max-h-32 font-mono pointer-events-none">
                        <div>Q: {question?.id} | QIdx: {currentQIndex}</div>
                        <div>OPT: {JSON.stringify(question?.options?.map(o => o.id))}</div>
                        <div>ANS: {JSON.stringify(answers)}</div>
                        <div>CUR: {JSON.stringify(currentAnswer)}</div>
                        <div>TRANS: {isTransitioning ? 'YES' : 'NO'}</div>
                    </div>
                )}

                {/* Question Card */}
                {question && (
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary text-left">
                        <h2 className="text-xl font-bold mb-6 text-gray-900 leading-tight">{question.text}</h2>

                        <div className={`space-y-3 transition-opacity duration-200 ${isTransitioning ? 'opacity-50 pointer-events-none' : 'opacity-100'}`} key={question.id}>
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
