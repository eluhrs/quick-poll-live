import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar, Treemap, LabelList } from 'recharts';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { PALETTES } from '../constants/palettes';

function PollPlayer({ poll, activePalette, enableTitlePage, isPreview = false, controlsBehavior = 'visible' }) {
    // Determine if title page should be shown
    const shouldShowTitle = enableTitlePage !== undefined ? enableTitlePage : poll.enable_title_page;

    // Construct flat list of "Slides" to simplify navigation logic
    // Slide Object: { type: 'title' | 'question', data: ... }
    const questions = poll.questions || [];

    // START REFACTOR: SLIDES ARRAY
    const slides = [];
    if (shouldShowTitle) {
        slides.push({ type: 'title', id: 'title-page' });
    }
    questions.forEach(q => {
        slides.push({ type: 'question', data: q, id: q.id });
    });

    // If no slides (no questions and no title), show waiting
    const hasSlides = slides.length > 0;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    // Reset index if slides config changes (e.g. toggling title page) or poll changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [poll.id, shouldShowTitle, questions.length]);

    const [isPlaying, setIsPlaying] = useState(true); // Auto-start
    const [timeLeft, setTimeLeft] = useState(poll.slide_duration || 3);
    const timerRef = useRef(null);

    // Auto-advance logic
    // Timer Logic
    useEffect(() => {
        if (!isPlaying || !hasSlides) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                // If time is up, we don't reset here, we let the effect trigger
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, hasSlides]);

    // Navigation Trigger
    useEffect(() => {
        if (timeLeft === 0 && isPlaying) {
            handleNext();
        }
    }, [timeLeft, isPlaying]);

    const handleNext = () => {
        if (!hasSlides) return;
        setCurrentIndex(prev => (prev + 1) % slides.length);
        setTimeLeft(poll.slide_duration || 3);
    };

    const handlePrev = () => {
        if (!hasSlides) return;
        setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
        setTimeLeft(poll.slide_duration || 3);
    };

    if (!hasSlides) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                {isPreview ? "Add questions or enable title page to preview." : "Waiting for questions..."}
            </div>
        );
    }

    const currentSlide = slides[currentIndex];
    const isTitlePage = currentSlide.type === 'title';
    const question = currentSlide.type === 'question' ? currentSlide.data : null;

    // --- Helpers & Render Logic ---

    // Total Votes calculation (for Title Page)
    const totalVotes = questions.reduce((sum, q) => {
        const qVotes = q.options ? q.options.reduce((acc, o) => acc + (o.votes ? o.votes.length : 0), 0) : 0;
        return sum + qVotes;
    }, 0);

    // Palette Colors
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

    // --- RENDERERS ---

    // 1. Unified Render Preparation

    // Controls Logic
    const controlsOpacity = controlsBehavior === 'autohide' && !isHovering ? 'opacity-0' : 'opacity-100';
    // Use absolute positioning for controls to overlay without taking up layout space in autohide mode?
    // User requested "remove controls ... if not ... hide them".
    // To prevent "jump", they should probably overlay or take up constant space.
    // If they take up constant space but are invisible, the space is still there (good for layout stability).
    // Let's keep them taking up space (h-16) but just fade opacity.
    const controlsClass = `h-16 flex justify-center items-center gap-6 text-gray-400 hover:text-gray-600 transition duration-300 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm w-full z-20 ${controlsOpacity}`;

    // 2. Question Data Prep
    const data = question ? question.options.map(opt => ({
        name: opt.text,
        votes: opt.votes ? opt.votes.length : 0
    })) : [];

    const renderVisualization = () => {
        const visType = question.visualization_type || 'bar';
        const heightClass = isPreview ? "h-[300px]" : "h-full min-h-[400px]";
        const fontSize = isPreview ? 12 : 18;
        const axisColor = "#374151";

        // ... Existing Visualization Logic (Wordcloud, Pie, Radar, etc) ...
        // Re-using the exact same logic blocks, just wrapped in this function

        if (visType === 'wordcloud') {
            // ... Wordcloud Logic ...
            let cloudData = [];
            if (question.question_type === 'open_ended') {
                const freqMap = {};
                if (question.votes) {
                    question.votes.forEach(v => {
                        const txt = v.text_answer;
                        if (txt) freqMap[txt] = (freqMap[txt] || 0) + 1;
                    });
                }
                cloudData = Object.keys(freqMap).map(txt => ({ text: txt, value: freqMap[txt] }));
            } else {
                cloudData = data.map(d => ({ text: d.name, value: d.votes }));
            }
            const options = { rotations: 2, rotationAngles: [-90, 0], fontSizes: [25, 75], enableTooltip: true, deterministic: true, fontFamily: 'impact' };

            // Dynamic Scaling
            const vals = cloudData.map(d => d.value);
            const minVal = Math.min(...vals);
            const maxVal = Math.max(...vals);
            const minSize = 25;
            const maxSize = 75;

            return (
                <div className={`${heightClass} w-full md:w-2/5 mx-auto flex flex-wrap content-center justify-center gap-6 p-4 overflow-y-auto`}>
                    {cloudData.length > 0 ? (
                        cloudData.map((w, i) => {
                            let size = minSize;
                            if (maxVal > minVal) {
                                size = minSize + ((w.value - minVal) / (maxVal - minVal)) * (maxSize - minSize);
                            } else {
                                size = (minSize + maxSize) / 2; // All same
                            }

                            return (
                                <span key={i} style={{ fontSize: `${size}px`, color: COLORS[i % COLORS.length], fontFamily: 'Impact, sans-serif' }} className="transition-all hover:scale-110 cursor-default leading-none" title={`${w.text}: ${w.value}`}>
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
                            <Pie data={data} cx="50%" cy="50%" labelLine={!isPreview} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={isPreview ? 80 : 200} fill="#8884d8" dataKey="votes" isAnimationActive={false}>
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
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
                        <RadarChart cx="50%" cy="45%" outerRadius="90%" data={data}>
                            <PolarGrid stroke="#9ca3af" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: axisColor, fontSize: fontSize, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke={axisColor} />
                            <Radar name="Votes" dataKey="votes" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'radial_bar') {
            return (
                <div className={`${heightClass} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="60%" innerRadius="10%" outerRadius="90%" barSize={20} data={data}>
                            <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff', fontWeight: 'bold' }} background clockWise dataKey="votes">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </RadialBar>
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, color: axisColor }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'donut') {
            return (
                <div className={`${heightClass} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={isPreview ? 40 : 100} outerRadius={isPreview ? 80 : 200} labelLine={!isPreview} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fill="#8884d8" dataKey="votes" isAnimationActive={false}>
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'horizontal_bar') {
            const renderCustomBarLabel = ({ x, y, width, height, value }) => {
                return <text x={x + width + 10} y={y + height / 2 + (fontSize / 3)} fill={axisColor} textAnchor="start" fontSize={fontSize} fontWeight="bold">{value}</text>;
            };
            return (
                <div className={`${heightClass} w-full`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data} margin={{ top: 20, right: 50, left: 20, bottom: 5 }}>
                            <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: fontSize }} allowDecimals={false} hide />
                            <YAxis type="category" dataKey="name" stroke={axisColor} tick={{ fill: axisColor, fontSize: fontSize, fontWeight: 500 }} width={150} />
                            <Bar dataKey="votes" radius={[0, 4, 4, 0]} label={renderCustomBarLabel} isAnimationActive={false}>
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'treemap') {
            // Custom Content for Treemap to show labels
            const CustomTreemapContent = (props) => {
                const { root, depth, x, y, width, height, index, payload, colors, rank, name, value } = props;
                const safeName = name || (payload && payload.name) || '';
                const safeWidth = width || 0;

                return (
                    <g>
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            style={{
                                fill: colors[index % colors.length],
                                stroke: '#fff',
                                strokeWidth: 2 / (depth + 1e-10),
                                strokeOpacity: 1 / (depth + 1e-10),
                            }}
                        />
                        {safeWidth > 40 && height > 40 && safeName && (
                            <foreignObject x={x} y={y} width={width} height={height}>
                                <div className="w-full h-full flex flex-col items-center justify-center text-white p-1 text-center overflow-hidden leading-tight">
                                    <span className="font-bold w-full break-normal" style={{ fontSize: Math.max(10, Math.min(16, (safeWidth * 1.8) / Math.max(safeName.length, 4))) }}>{safeName}</span>
                                    <span className="text-xs">{value}</span>
                                </div>
                            </foreignObject>
                        )}
                    </g>
                );
            };

            return (
                <div className={`${heightClass} w-4/5 mx-auto`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={data}
                            dataKey="votes"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomTreemapContent colors={COLORS} />}
                            isAnimationActive={false}
                        >
                        </Treemap>
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
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    // 3. Unified Renderer
    return (
        <div
            className="flex flex-col h-full w-full bg-white relative overflow-hidden group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Main Content Area: Flex Grow to Fill available space */}
            <div className="flex-grow flex flex-col justify-center items-center w-full relative z-10 overflow-hidden">
                {isTitlePage ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 w-full h-full">
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight leading-tight max-w-4xl" style={{ color: COLORS[0] }}>
                            {poll.title}
                        </h1>
                        <div className="grid grid-cols-3 gap-8 md:gap-12 text-center">
                            <div>
                                <div className="text-4xl font-bold mb-2 text-gray-800">{questions.length}</div>
                                <div className="text-gray-500 font-bold uppercase tracking-widest text-sm">Questions</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2 text-gray-800">{totalVotes}</div>
                                <div className="text-gray-500 font-bold uppercase tracking-widest text-sm">Responses</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold mb-2 text-gray-800">{poll.closes_at ? new Date(poll.closes_at).toLocaleDateString() : '∞'}</div>
                                <div className="text-gray-500 font-bold uppercase tracking-widest text-sm">Close Date</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col justify-center p-4">
                        <h2 className={`${isPreview ? 'text-2xl' : 'text-4xl'} font-serif font-bold mb-8 text-[#502d0e] leading-tight text-center`} style={{ color: COLORS[0] }}>{question.text}</h2>
                        <div className="flex-grow w-full relative flex flex-col justify-center">
                            {renderVisualization()}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={controlsClass}>
                <button onClick={handlePrev} className="p-3 hover:bg-white hover:shadow-md rounded-full transition"><ChevronLeft size={28} /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 hover:bg-white hover:shadow-md rounded-full transition text-primary">
                    {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>
                <button onClick={handleNext} className="p-3 hover:bg-white hover:shadow-md rounded-full transition"><ChevronRight size={28} /></button>
            </div>
        </div>
    );
}

export default PollPlayer;
