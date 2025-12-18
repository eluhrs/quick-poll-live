import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';
import PollPlayer from './PollPlayer';
import { ChevronLeft } from 'lucide-react';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("PollPlayer Crash:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-red-600 bg-red-50 h-full overflow-auto">
                    <h1 className="text-xl font-bold mb-4">Display Error</h1>
                    <p className="font-bold">{this.state.error?.toString()}</p>
                    <pre className="text-xs mt-2">{this.state.errorInfo?.componentStack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

function PollDisplay() {
    const { slug } = useParams();
    const [poll, setPoll] = useState(null);
    const [singleViewMode, setSingleViewMode] = useState(false);
    const [qrExpanded, setQrExpanded] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qId = params.get('q');
        if (qId && poll) {
            setSingleViewMode(true);
        }
    }, [poll]);

    useEffect(() => {
        if (poll) {
            document.title = 'Quick Poll Live: Results';
        }
    }, [poll]);

    useEffect(() => {
        let ws;
        let retryCount = 0;
        let isAlive = true;

        const connect = () => {
            if (!isAlive) return;

            console.log(`[WS] Connecting to ${slug}...`);
            ws = new WebSocket(`ws://${location.hostname}:8000/ws/${slug}`);

            ws.onopen = () => {
                console.log("[WS] Connected");
                retryCount = 0;
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("[WS] Message:", data);
                if (data.event === "update") {
                    console.log("[WS] Update received! Fetching poll...");
                    fetchPoll();
                }
            };

            ws.onclose = () => {
                console.log("[WS] Disconnected");
                if (isAlive) {
                    const timeout = Math.min(5000, 1000 * Math.pow(2, retryCount));
                    retryCount++;
                    console.log(`[WS] Reconnecting in ${timeout}ms...`);
                    setTimeout(connect, timeout);
                }
            };

            ws.onerror = (err) => {
                console.error("[WS] Error:", err);
                ws.close(); // Trigger onclose
            };
        };

        fetchPoll();
        connect();

        return () => {
            isAlive = false;
            if (ws) ws.close();
        };
    }, [slug]);

    const fetchPoll = async () => {
        // Add timestamp to prevent caching
        console.log(`Fetching poll: /polls/${slug}`);
        try {
            // Add timestamp to prevent caching
            console.log(`Fetching poll: /polls/${slug}`);
            const res = await api.get(`/polls/${slug}?t=${Date.now()}`);
            console.log("Poll Data:", res.data);

            // Validate Data
            if (!res.data || typeof res.data !== 'object') {
                throw new Error("Invalid Data Received");
            }

            const sortedQuestions = res.data.questions ? res.data.questions.sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
            setPoll({ ...res.data, questions: sortedQuestions });
        } catch (err) {
            console.error(err);
            setPoll({ error: err.message, raw: err.response?.data });
        }
    };

    if (poll?.error) return (
        <div className="p-8 text-red-600 bg-red-50">
            <h1 className="text-xl font-bold">Error Loading Poll</h1>
            <pre>{JSON.stringify(poll, null, 2)}</pre>
        </div>
    );

    if (!poll) return <div className="min-h-screen flex items-center justify-center text-2xl text-[#502d0e]">Loading Poll...</div>;

    // URL Construction
    const joinUrl = `${window.location.protocol}//${window.location.host}`;

    return (
        <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
            <h1 className="bg-yellow-400 text-black p-2 text-center text-xl font-bold z-[9999]">DEBUG VERSION LOADING...</h1>
            {/* DEBUG OVERLAY */}
            <button
                onClick={() => window.close()}
                className="bg-white/80 p-2 rounded-full shadow hover:bg-white text-gray-600 transition"
                title="Close View"
            >
                <ChevronLeft size={32} />
            </button>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
            {/* DEBUG OVERLAY */}
            <div className="absolute top-2 right-2 bg-black/80 text-white p-2 text-xs font-mono z-50 pointer-events-none max-w-sm overflow-auto max-h-48 opacity-50 hover:opacity-100">
                <p>Poll Loaded: {poll ? 'Yes' : 'No'}</p>
                <p>Questions: {poll?.questions?.length}</p>
                <p>Title: {poll?.title}</p>
                <p>Slug: {poll?.slug}</p>

                {/* Check PollPlayer Container Height */}
            </div>

            {singleViewMode && renderCloseButton()}

            {/* Main Content Area - Full Screen Player */}
            <div className="flex-grow w-full relative overflow-hidden border-4 border-red-500">
                <ErrorBoundary>
                    <div className="h-full w-full border-4 border-blue-500">
                        <PollPlayer poll={poll} controlsBehavior="autohide" />
                    </div>
                </ErrorBoundary>
            </div>

            {/* Footer Bar - Rebranded & Reorganized */}
            <div className="bg-white text-[#502d0e] h-24 flex items-center justify-between px-8 md:px-12 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30 flex-shrink-0 border-t-8 border-[#502d0e]">

                {/* Left: LTS Logo */}
                <div className="flex items-center gap-4">
                    <img
                        src="/lts_logo.png"
                        alt="Lehigh LTS"
                        className="h-16 w-auto"
                    />
                </div>

                {/* Center: URL Display */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <span className="text-[#502d0e]/60 uppercase tracking-widest text-xs font-bold mb-0.5">Vote here:</span>
                    <div className="text-3xl md:text-5xl font-black tracking-tight leading-none text-[#502d0e]">
                        {window.location.host}
                        <span className="text-[#502d0e]/40 font-normal ml-1">/{slug}</span>
                    </div>
                </div>

                {/* Right: QR & Code */}
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-[#502d0e]/60 uppercase tracking-widest text-xs font-bold">Poll Code</div>
                        <div className="font-mono text-xl font-bold text-[#502d0e]">{poll.slug}</div>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                        <QRCodeSVG value={`${joinUrl}/${slug}/vote`} size={64} fgColor="#502d0e" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PollDisplay;
