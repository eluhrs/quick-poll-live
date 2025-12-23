import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar, Treemap, LabelList } from 'recharts';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { PALETTES } from '../constants/palettes';

// --- SUB-COMPONENTS ---

const getSmartAxisWidth = (data, key = 'name') => {
    if (!data || data.length === 0) return 40;
    const maxLen = Math.max(...data.map(d => (d[key] || '').toString().length));
    return Math.min(Math.max(maxLen * 7, 40), 300);
};

// Memoized Helper Components
const SmartLegend = React.memo(({ data, colors }) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4 p-2 bg-white/50 rounded-lg border border-gray-100">
        {data.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="text-sm font-bold text-gray-700">{entry.name}</span>
                <span className="text-xs text-gray-400">({entry.votes})</span>
            </div>
        ))}
    </div>
));

const ChartWrapper = React.memo(({ children, withLegend = false, data, colors }) => (
    <div className="flex flex-col h-full w-full">
        <div className="flex-grow min-h-0">
            {/* Added debounce to prevent layout thrashing/flicker on resize */}
            <ResponsiveContainer width="100%" height="100%" debounce={30}>
                {children}
            </ResponsiveContainer>
        </div>
        {withLegend && <SmartLegend data={data} colors={colors} />}
    </div>
));

// --- VISUALIZER COMPONENT ---
// (Not memoized itself, but we will memoize the CALL to it in the parent)
const PollVisualizer = ({ question, colors, isPreview }) => {
    // Determine Type
    let visType = question.visualization_type || 'bar';
    const heightClass = "h-full min-h-[400px]";
    const fontSize = isPreview ? 12 : 14;
    const axisColor = "#374151";

    // Prepare Data
    // We use useMemo here just to be safe, but the parent useMemo controls the re-render mostly
    const data = useMemo(() => {
        return question.options.map(opt => ({
            name: opt.text,
            votes: opt.votes ? opt.votes.length : 0
        }));
    }, [question.options]);

    // Smart Switching
    if (visType === 'bar' && data.some(d => d.name.length > 15)) {
        visType = 'horizontal_bar';
    }

    // --- RENDER LOGIC ---
    if (visType === 'wordcloud') {
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
                            size = (minSize + maxSize) / 2;
                        }
                        return (
                            <span key={i} style={{ fontSize: `${size}px`, color: colors[i % colors.length], fontFamily: 'Impact, sans-serif' }} className="transition-all hover:scale-110 cursor-default leading-none" title={`${w.text}: ${w.value}`}>
                                {w.text}
                            </span>
                        );
                    })
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">Waiting for responses...</div>
                )}
            </div>
        );
    }

    if (visType === 'pie' || visType === 'donut') {
        const innerRadius = visType === 'donut' ? (isPreview ? '40%' : '50%') : 0;
        const outerRadius = isPreview ? '80%' : '80%';
        return (
            <div className={heightClass}>
                <ChartWrapper withLegend={true} data={data} colors={colors}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            labelLine={!isPreview}
                            label={!isPreview ? ({ name, percent }) => `${(percent * 100).toFixed(0)}%` : null}
                            fill="#8884d8"
                            dataKey="votes"
                            isAnimationActive={true}
                        >
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                        </Pie>
                    </PieChart>
                </ChartWrapper>
            </div>
        );
    }

    if (visType === 'list') {
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
    }

    if (visType === 'radar') {
        return (
            <div className={heightClass}>
                <ChartWrapper withLegend={true} data={data} colors={colors}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#9ca3af" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: axisColor, fontSize: fontSize, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke={axisColor} />
                        <Radar name="Votes" dataKey="votes" stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} isAnimationActive={true} />
                    </RadarChart>
                </ChartWrapper>
            </div>
        );
    }

    if (visType === 'radial_bar') {
        return (
            <div className={heightClass}>
                <ChartWrapper withLegend={true} data={data} colors={colors}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" barSize={20} data={data}>
                        <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff', fontWeight: 'bold' }} background clockWise dataKey="votes">
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                        </RadialBar>
                    </RadialBarChart>
                </ChartWrapper>
            </div>
        );
    }

    if (visType === 'horizontal_bar') {
        const yAxisWidth = getSmartAxisWidth(data, 'name');
        const renderCustomBarLabel = ({ x, y, width, height, value }) => {
            const isWide = width > 30;
            return <text
                x={isWide ? x + width - 10 : x + width + 5}
                y={y + height / 2 + (fontSize / 3)}
                fill={isWide ? '#fff' : axisColor}
                textAnchor={isWide ? "end" : "start"}
                fontSize={fontSize}
                fontWeight="bold"
            >{value}</text>;
        };

        return (
            <div className={heightClass}>
                <ChartWrapper data={data} colors={colors}>
                    <BarChart layout="vertical" data={data} margin={{ top: 20, right: 50, left: 10, bottom: 5 }}>
                        <XAxis type="number" stroke={axisColor} tick={{ fill: axisColor, fontSize: fontSize }} allowDecimals={false} hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: fontSize, fontWeight: 500 }}
                            width={yAxisWidth}
                            interval={0}
                        />
                        <Bar dataKey="votes" radius={[0, 4, 4, 0]} label={renderCustomBarLabel} isAnimationActive={true}>
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                        </Bar>
                    </BarChart>
                </ChartWrapper>
            </div>
        );
    }

    if (visType === 'treemap') {
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
                        content={<CustomTreemapContent colors={colors} />}
                        isAnimationActive={true}
                    />
                </ResponsiveContainer>
            </div>
        );
    }

    // Default Bar (Vertical)
    const renderCustomBarLabel = ({ x, y, width, value }) => {
        return <text x={x + width / 2} y={y} fill={axisColor} textAnchor="middle" dy={-6} fontSize={fontSize} fontWeight="bold">{value}</text>;
    };

    return (
        <div className={heightClass}>
            <ChartWrapper data={data} colors={colors}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <XAxis
                        dataKey="name"
                        stroke={axisColor}
                        tick={{ fill: axisColor, fontSize: fontSize, fontWeight: 500 }}
                        interval={0}
                    />
                    <YAxis stroke={axisColor} tick={{ fill: axisColor, fontSize: fontSize }} allowDecimals={false} />
                    <Bar dataKey="votes" radius={[4, 4, 0, 0]} label={renderCustomBarLabel} isAnimationActive={true}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />)}
                    </Bar>
                </BarChart>
            </ChartWrapper>
        </div>
    );
};


// 5. MAIN COMPONENT (State Container)
function PollPlayer({ poll, activePalette, enableTitlePage, isPreview = false, controlsBehavior = 'visible' }) {
    // Determine if title page should be shown
    const shouldShowTitle = enableTitlePage !== undefined ? enableTitlePage : poll.enable_title_page;
    const questions = poll.questions || [];

    // SLIDES ARRAY (Memoized)
    const slides = useMemo(() => {
        const s = [];
        if (shouldShowTitle) {
            s.push({ type: 'title', id: 'title-page' });
        }
        questions.forEach(q => {
            s.push({ type: 'question', data: q, id: q.id });
        });
        return s;
    }, [shouldShowTitle, questions]);

    const hasSlides = slides.length > 0;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovering, setIsHovering] = useState(false);

    // Reset index safe
    useEffect(() => {
        setCurrentIndex(0);
    }, [poll.id, shouldShowTitle, questions.length]);

    // TIMER STATE (The frequent updater)
    const [isPlaying, setIsPlaying] = useState(true);
    const [timeLeft, setTimeLeft] = useState(poll.slide_duration || 3);
    const timerRef = useRef(null);

    // Timer Logic
    useEffect(() => {
        if (!isPlaying || !hasSlides) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying, hasSlides]);

    // Auto Advance
    const handleNext = useCallback(() => {
        if (!hasSlides) return;
        setCurrentIndex(prev => (prev + 1) % slides.length);
        setTimeLeft(poll.slide_duration || 3);
    }, [hasSlides, slides.length, poll.slide_duration]);

    useEffect(() => {
        if (timeLeft === 0 && isPlaying) {
            handleNext();
        }
    }, [timeLeft, isPlaying, handleNext]);

    const handlePrev = useCallback(() => {
        if (!hasSlides) return;
        setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
        setTimeLeft(poll.slide_duration || 3);
    }, [hasSlides, slides.length, poll.slide_duration]);

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

    // Palette Colors (Memoized)
    const COLORS = useMemo(() => {
        const paletteId = activePalette || poll.color_palette || 'lehigh_soft';
        let cols = [];
        const preset = PALETTES.find(p => p.id === paletteId);
        if (preset) {
            cols = preset.colors;
        } else {
            try {
                cols = JSON.parse(paletteId);
            } catch (e) {
                cols = PALETTES[0].colors;
            }
        }
        return cols;
    }, [activePalette, poll.color_palette]);

    // Derived Values
    const totalVotes = questions.reduce((sum, q) => {
        const qVotes = q.options ? q.options.reduce((acc, o) => acc + (o.votes ? o.votes.length : 0), 0) : 0;
        return sum + qVotes;
    }, 0);

    // Generate Signature for Updates (Prevent re-rendering on Timer Tick)
    // We only want to re-render visualization if this signature changes.
    const visSignature = useMemo(() => {
        if (!question) return 'none';
        const voteSig = question.options.map(o => o.votes ? o.votes.length : 0).join(',');
        const textSig = question.text + question.options.map(o => o.text).join('');
        return `${question.id}-${voteSig}-${textSig}-${isPreview}`;
    }, [question, isPreview]);

    // MEMOIZED VISUALIZER ELEMENT
    // This element will persist even when parent re-renders due to `timeLeft` or `isHovering`
    // because `visSignature` and `COLORS` won't change on those events.
    const memoizedVisualizer = useMemo(() => {
        if (!question) return null;
        return (
            <PollVisualizer
                key={question.id}
                question={question}
                colors={COLORS}
                isPreview={isPreview}
            />
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visSignature, COLORS]); // CRITICAL: REMOVED 'question' REFS. Only signature matters.


    const controlsOpacity = controlsBehavior === 'autohide' && !isHovering ? 'opacity-0' : 'opacity-100';
    const controlsClass = `h-16 flex justify-center items-center gap-6 text-gray-400 hover:text-gray-600 transition duration-300 border-t border-gray-100 bg-gray-50/50 backdrop-blur-sm w-full z-20 ${controlsOpacity}`;

    return (
        <div
            className="flex flex-col h-full w-full bg-white relative overflow-hidden group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
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
                            {/* RENDER MEMOIZED ELEMENT */}
                            {memoizedVisualizer}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={controlsClass} style={{ willChange: 'opacity' }}>
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
