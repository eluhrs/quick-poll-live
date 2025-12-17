import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar } from 'recharts';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { PALETTES } from '../constants/palettes';

function PollPlayer({ poll, activePalette, isPreview = false }) {
    // Logic for Title Page: If enabled, it is index -1.
    // If poll has no questions, index is 0 (waiting).
    const startIdx = (poll.enable_title_page && !isPreview) ? -1 : 0;
    // Note: For Preview in Settings tab, user might want to see Title Page? 
    // "This optional page should be displayed as the first slide in view and preview modes."
    // So if isPreview is true, we should also respect enable_title_page.
    // But in Questions tab preview? Just preview.
    // In Settings tab preview? Just preview.
    // Let's rely on standard logic: if enable_title_page, start at -1.

    const [currentQIndex, setCurrentQIndex] = useState(0);
    // We need to set initial state based on props.
    useEffect(() => {
        if (poll.enable_title_page && !isPreview) { // Only show title page if enabled and not in a specific preview mode that might override it
            setCurrentQIndex(-1);
        } else {
            setCurrentQIndex(0);
        }
    }, [poll.id, poll.enable_title_page, isPreview]);
    // Note: this reset might be annoying if polling updates, but okay for now.

    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(poll.slide_duration || 3);
    const timerRef = useRef(null);

    const questions = poll.questions || [];
    const totalSlides = questions.length;
    // If title page enabled, it's virtually "before" index 0.

    const isTitlePage = currentQIndex === -1;
    const currentQuestion = !isTitlePage ? questions[currentQIndex] : null;

    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleNext();
                        return poll.slide_duration || 3;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, currentQIndex, poll.slide_duration, questions.length, poll.enable_title_page]);

    const handleNext = () => {
        setCurrentQIndex(prev => {
            if (prev === -1) return 0; // Title -> Q1
            if (prev >= questions.length - 1) {
                // End of slides
                if (poll.enable_title_page) return -1; // Loop back to title? or Stop? Standard is Loop.
                return 0;
            }
            return prev + 1;
        });
        setTimeLeft(poll.slide_duration || 3);
    };

    const handlePrev = () => {
        setCurrentQIndex(prev => {
            if (prev === 0) {
                return poll.enable_title_page ? -1 : questions.length - 1;
            }
            if (prev === -1) {
                return questions.length - 1;
            }
            return prev - 1;
        });
        setTimeLeft(poll.slide_duration || 3);
    };

    // totalVotes calculation for Title Page
    const totalVotes = questions.reduce((sum, q) => {
        const qVotes = q.options ? q.options.reduce((acc, o) => acc + (o.vote_count || 0), 0) : 0;
        return sum + qVotes;
    }, 0);
    // Use activePalette prop if provided (for live preview in settings), otherwise use poll's saved palette
    const paletteId = activePalette || poll.color_palette || 'lehigh_soft';
    let COLORS = [];
    const preset = PALETTES.find(p => p.id === paletteId);
    if (preset) {
        COLORS = preset.colors;
    } else {
        try {
            COLORS = JSON.parse(paletteId);
        } catch (e) {
            COLORS = PALETTES[0].colors; // Fallback
        }
    }

    // Use slide duration from poll, default to 3s if missing
    const slideDuration = (poll.slide_duration || 3) * 1000;

    if (!poll || !poll.questions || poll.questions.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                {isPreview ? "Add questions to see visual preview." : "Waiting for questions..."}
            </div>
        );
    }

    const question = poll.questions[currentQIndex];
    // Map options to data format. If strictly preview (no votes), show dummy data? 
    // User didn't request dummy data, so let's show actual votes. If 0 votes, charts might be empty.
    // Ideally for "settings preview" we might want dummy data. 
    // But "Preview Tab" usually implies previewing the *content*. 
    // Let's stick to real data for now. If user wants to see colors they might need votes. 
    // ACTUALLY: A "Preview" of the poll slide show with 0 votes is boring.
    // However, the prompt says "Show the slide show within it".
    // I won't mock data unless requested, but I'll handle empty states gracefully.

    const data = question.options.map(opt => ({
        name: opt.text,
        votes: opt.votes ? opt.votes.length : 0
    }));

    const renderVisualization = () => {
        const visType = question.visualization_type || 'bar';
        const heightClass = isPreview ? "h-[300px]" : "h-[500px]";
        const fontSize = isPreview ? 12 : 18;
        const axisColor = "#374151"; // Darker axis color for contrast

        if (visType === 'wordcloud') {
            // Prepare data for word cloud
            let cloudData = [];
            if (question.question_type === 'open_ended') {
                const freqMap = {};
                if (question.votes) {
                    question.votes.forEach(v => {
                        const txt = v.text_answer;
                        if (txt) {
                            freqMap[txt] = (freqMap[txt] || 0) + 1;
                        }
                    });
                }
                cloudData = Object.keys(freqMap).map(txt => ({
                    text: txt,
                    value: freqMap[txt]
                }));
            } else {
                cloudData = data.map(d => ({
                    text: d.name,
                    value: d.votes
                }));
            }

            // Basic options for wordcloud
            const options = {
                rotations: 2,
                rotationAngles: [-90, 0],
                fontSizes: [20, 60],
                enableTooltip: true,
                deterministic: true,
                fontFamily: 'impact',
            };
            // Callback to color words based on palette
            const callbacks = {
                getWordColor: (word) => COLORS[Math.floor(Math.random() * COLORS.length)],
            }

            return (
                <div className={`${heightClass} w-full flex flex-wrap content-center justify-center gap-4 p-4 overflow-y-auto`}>
                    {cloudData.length > 0 ? (
                        cloudData.map((w, i) => {
                            const size = Math.max(12, Math.min(60, 12 + (w.value * 5))); // Basic sizing
                            return (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: `${size}px`,
                                        color: COLORS[i % COLORS.length],
                                        fontFamily: 'Impact, sans-serif'
                                    }}
                                    className="transition-all hover:scale-110 cursor-default"
                                    title={`${w.text}: ${w.value}`}
                                >
                                    {w.text}
                                </span>
                            );
                        })
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Waiting for responses...</div>
                    )}
                </div>
            );

        } else if (visType === 'pie') {
            return (
                <div className={`${heightClass} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={!isPreview}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={isPreview ? 80 : 200}
                                fill="#8884d8"
                                dataKey="votes"
                                isAnimationActive={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend iconSize={isPreview ? 10 : 20} wrapperStyle={{ fontSize: isPreview ? '0.8rem' : '1.2rem', color: axisColor }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'list') {
            return (
                <div className={`${heightClass} w-full overflow-y-auto p-4`}>
                    <ul className="space-y-2">
                        {data.map((d, i) => (
                            <li key={i} className={`p-3 bg-white rounded shadow-sm flex justify-between items-center ${isPreview ? 'text-sm' : 'text-xl'}`}>
                                <span style={{ color: axisColor }}>{d.name}</span>
                                <span className={`font-bold bg-gray-100 px-3 py-1 rounded text-gray-900 border border-gray-200`}>{d.votes}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        } else if (visType === 'radar') {
            return (
                <div className={`${heightClass} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#9ca3af" /> {/* Darker grid */}
                            <PolarAngleAxis dataKey="name" tick={{ fill: axisColor, fontSize: fontSize, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke={axisColor} />
                            <Radar
                                name="Votes"
                                dataKey="votes"
                                stroke={COLORS[0]}
                                fill={COLORS[0]}
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'radial_bar') {
            return (
                <div className={`${heightClass} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={20} data={data}>
                            <RadialBar
                                minAngle={15}
                                label={{ position: 'insideStart', fill: '#fff', fontWeight: 'bold' }}
                                background
                                clockWise
                                dataKey="votes"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </RadialBar>
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, color: axisColor }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        // Default Bar
        const renderCustomBarLabel = ({ x, y, width, value }) => {
            return <text x={x + width / 2} y={y} fill={axisColor} textAnchor="middle" dy={-6} fontSize={fontSize} fontWeight="bold">{value}</text>;
        };

        return (
            <div className={`${heightClass} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke={axisColor} tick={{ fill: axisColor, fontSize: fontSize, fontWeight: 500 }} />
                        <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: fontSize }} allowDecimals={false} />
                        <Bar dataKey="votes" radius={[4, 4, 0, 0]} label={renderCustomBarLabel} isAnimationActive={false}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-grow flex flex-col justify-center items-center p-4">
                <h2 className={`${isPreview ? 'text-2xl' : 'text-4xl'} font-serif font-bold mb-8 text-[#502d0e] leading-tight text-center`} style={{ color: COLORS[0] }}>{question.text}</h2>
                {renderVisualization()}
            </div>

            {/* Controls */}
            <div className="h-12 flex justify-center items-center gap-6 text-gray-400 hover:text-gray-600 transition border-t border-gray-100 mt-4">
                <button
                    onClick={() => setCurrentQIndex(prev => (prev - 1 + poll.questions.length) % poll.questions.length)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 hover:bg-gray-100 rounded-full transition text-primary"
                >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                    onClick={() => setCurrentQIndex(prev => (prev + 1) % poll.questions.length)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
}

export default PollPlayer;
