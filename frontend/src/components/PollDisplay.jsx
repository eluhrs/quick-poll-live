import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar } from 'recharts';
import api from '../api';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import ReactWordcloud from 'react-wordcloud';

const COLORS = ['#502d0e', '#D0B797', '#000000', '#768692', '#565A5C'];

function PollDisplay() {
    const { slug } = useParams();
    const [poll, setPoll] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [singleViewMode, setSingleViewMode] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qId = params.get('q');
        if (qId && poll) {
            const idx = poll.questions.findIndex(q => q.id.toString() === qId);
            if (idx !== -1) {
                setCurrentQIndex(idx);
                setIsPlaying(false);
                setSingleViewMode(true);
            }
        }
    }, [poll]); // Run when poll loads

    useEffect(() => {
        fetchPoll();
        const ws = new WebSocket(`ws://${location.hostname}:8000/ws/${slug}`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === "update") {
                fetchPoll();
            }
        };
        return () => ws.close();
    }, [slug]);

    const fetchPoll = async () => {
        try {
            const res = await api.get(`/polls/${slug}`);
            // Sort to ensure index matches admin view
            const sortedQuestions = res.data.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
            setPoll({ ...res.data, questions: sortedQuestions });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let interval;
        if (isPlaying && poll && poll.questions.length > 1 && !singleViewMode) {
            interval = setInterval(() => {
                setCurrentQIndex((prev) => (prev + 1) % poll.questions.length);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, poll, singleViewMode]);

    if (!poll) return <div className="min-h-screen flex items-center justify-center text-2xl text-[#502d0e]">Loading Poll...</div>;
    if (!poll.questions || poll.questions.length === 0) return <div className="min-h-screen flex items-center justify-center text-2xl text-[#502d0e]">Waiting for questions...</div>;

    const question = poll.questions[currentQIndex];
    const data = question.options.map(opt => ({
        name: opt.text,
        votes: opt.votes ? opt.votes.length : 0
    }));



    const renderVisualization = () => {
        const visType = question.visualization_type || 'bar';

        if (visType === 'wordcloud') {
            // Prepare data for word cloud
            let cloudData = [];

            if (question.question_type === 'open_ended') {
                // For open ended, we aggregate text_answers
                const freqMap = {};
                question.votes.forEach(v => {
                    const txt = v.text_answer;
                    if (txt) {
                        freqMap[txt] = (freqMap[txt] || 0) + 1;
                    }
                });
                cloudData = Object.keys(freqMap).map(txt => ({
                    text: txt,
                    value: freqMap[txt]
                }));
            } else {
                // For multiple choice, we use options data
                cloudData = data.map(d => ({
                    text: d.name,
                    value: d.votes
                }));
            }

            // Find max value for scaling
            const maxVal = Math.max(...cloudData.map(d => d.value), 1);

            return (
                <div className="h-[500px] w-full flex items-center justify-center p-8 bg-white/50 rounded-xl overflow-hidden">
                    <div className="flex flex-wrap justify-center items-center content-center gap-x-8 gap-y-4 h-full w-full overflow-y-auto">
                        {cloudData.length > 0 ? (
                            cloudData.map((word, idx) => {
                                // Scale font size between 24px and 96px
                                const size = Math.max(24, Math.min(24 + ((word.value / maxVal) * 72), 96));
                                return (
                                    <span
                                        key={idx}
                                        style={{
                                            fontSize: `${size}px`,
                                            color: COLORS[idx % COLORS.length],
                                            transform: `rotate(${idx % 2 === 0 ? 0 : 0}deg)` // Keep horizontal for readability or add random rotation if desired
                                        }}
                                        className="font-black leading-none transition-all duration-500 hover:scale-110 cursor-default drop-shadow-sm"
                                        title={`${word.text}: ${word.value} votes`}
                                    >
                                        {word.text}
                                    </span>
                                );
                            })
                        ) : (
                            <div className="text-xl text-gray-400">Waiting for responses...</div>
                        )}
                    </div>
                </div>
            );
        } else if (visType === 'pie') {
            // ... (rest of the code remains same)
            return (
                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent, value }) => `${name} (${value}) ${(percent * 100).toFixed(0)}%`}
                                outerRadius={200}
                                fill="#8884d8"
                                dataKey="votes"
                                isAnimationActive={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend iconSize={20} wrapperStyle={{ fontSize: '1.2rem' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'list') {
            return (
                <div className="h-[500px] w-full overflow-y-auto p-4">
                    <ul className="space-y-4">
                        {data.map((d, i) => (
                            <li key={i} className="p-4 bg-white rounded shadow-sm flex justify-between items-center text-xl">
                                <span>{d.name}</span>
                                <span className="font-bold bg-gray-100 px-4 py-2 rounded text-[#502d0e]">{d.votes}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );
        } else if (visType === 'radar') {
            return (
                <div className="h-[500px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: '#502d0e', fontSize: 14, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#9ca3af" />
                            <Radar
                                name="Votes"
                                dataKey="votes"
                                stroke="#502d0e"
                                fill="#502d0e"
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            );
        } else if (visType === 'radial_bar') {
            return (
                <div className="h-[500px] w-full">
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
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        // Default to Bar
        // Custom label render for Bar
        const renderCustomBarLabel = ({ x, y, width, value }) => {
            return <text x={x + width / 2} y={y} fill="#502d0e" textAnchor="middle" dy={-6} fontSize={18} fontWeight="bold">{value}</text>;
        };

        return (
            <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#502d0e" tick={{ fill: '#502d0e', fontSize: 18, fontWeight: 500 }} />
                        <YAxis stroke="#502d0e" tick={{ fill: '#502d0e', fontSize: 16 }} allowDecimals={false} />
                        {/* No Tooltip */}
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

    // URL Construction
    const joinUrl = `${window.location.protocol}//${window.location.host}`;

    return (
        <div className="min-h-screen flex flex-col p-8 font-sans" >

            {/* Main Content Area */}
            < div className="flex-grow flex gap-8" >

                {/* Left: Visualization */}
                < div className="flex-grow flex flex-col justify-center" >
                    <h2 className="text-4xl font-serif font-bold mb-12 text-[#502d0e] leading-tight text-center">{question.text}</h2>
                    {renderVisualization()
                    }
                </div >

                {/* Right: QR Box */}
                < div className="w-1/4 min-w-[300px] flex flex-col justify-center items-center" >
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
                        <div className="mb-4">
                            <QRCodeSVG value={`${joinUrl}/poll/${slug}`} size={200} className="mx-auto" />
                        </div>
                        <div className="space-y-2 text-[#502d0e]">
                            <p className="font-bold text-lg">Use the QR code to join this poll.</p>
                            <div className="border-t border-gray-200 my-4"></div>
                            <p className="text-sm">Or visit <span className="font-mono bg-amber-50 px-1">{joinUrl}</span></p>
                            <p className="text-sm">and enter this code:</p>
                            <p className="text-4xl font-mono font-bold tracking-widest mt-2 bg-[#502d0e] text-white py-2 rounded-lg">{poll.slug}</p>
                        </div>
                    </div>
                </div >
            </div >

            {/* Controls */}
            {
                singleViewMode ? (
                    <div className="fixed top-8 left-8">
                        <button
                            onClick={() => window.close()} // Or navigate back if preferred, window.close works for target=_blank
                            className="bg-white/80 p-2 rounded-full shadow hover:bg-white text-gray-600 transition"
                            title="Close View"
                        >
                            <ChevronLeft size={32} />
                        </button>
                    </div>
                ) : (
                    <div className="h-10 flex justify-center items-center gap-4 text-gray-400 opacity-20 hover:opacity-100 transition">
                        <button onClick={() => setCurrentQIndex(prev => (prev - 1 + poll.questions.length) % poll.questions.length)}><ChevronLeft /></button>
                        <button onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <Pause /> : <Play />}
                        </button>
                        <button onClick={() => setCurrentQIndex(prev => (prev + 1) % poll.questions.length)}><ChevronRight /></button>
                    </div>
                )
            }

        </div >
    );
}

export default PollDisplay;
