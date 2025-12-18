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
                <div className="p-8 text-red-600 bg-red-50 h-full overflow-auto text-left">
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

    // Auto-refresh timer reference
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

            // DYNAMIC PROTOCOL & HOST (Critical for Mixed Content Fix)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Use window.location.host to respect the Proxy Port (443 or whatever URL calls it)
            const wsUrl = `${protocol}//${window.location.host}/ws/${slug}`;

            console.log(`[WS] Connecting to ${wsUrl}...`);
            ws = new WebSocket(wsUrl);

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
                ws.close();
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
        try {
            // Timestamp to prevent caching
            const res = await api.get(`/polls/${slug}?t=${Date.now()}`);
            console.log("Poll Data:", res.data);

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

    // URL Construction for QR
    const joinUrl = `${window.location.protocol}//${window.location.host}`;

    // Helper: Close Button Logic
    const renderCloseButton = () => (
        <button
            onClick={() => setSingleViewMode(false)}
            className="fixed top-4 left-4 z-50 bg-white/90 p-2 rounded-full shadow hover:bg-white text-gray-800 transition"
            title="Back to Overview"
        >
            <ChevronLeft size={32} />
        </button>
    );

    // 1. Loading State
    if (!poll && !poll?.error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="text-2xl font-bold text-gray-400 animate-pulse">Loading Poll...</div>
            </div>
        );
    }

    // 2. Error State
    if (poll?.error) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-50 text-red-600 p-8">
                <h1 className="text-3xl font-bold mb-4">Error Loading Poll</h1>
                <p className="text-xl">{poll.error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    // 3. Success State (Full Layout)
    return (
        <div className="h-screen flex flex-col bg-gray-50 font-sans overflow-hidden">

            {/* Conditional Close Button */}
            {singleViewMode && renderCloseButton()}

            {/* Main Content Area - Full Screen Player */}
            <div className="flex-grow w-full relative overflow-hidden">
                <ErrorBoundary>
                    <PollPlayer poll={poll} controlsBehavior="autohide" />
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
                        <div className="font-mono text-xl font-bold text-[#502d0e]">{poll?.slug || '...'}</div>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                        <QRCodeSVG value={`${joinUrl}/${poll?.slug || 'loading'}/vote`} size={64} fgColor="#502d0e" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PollDisplay;
