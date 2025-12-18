import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';
import PollPlayer from './PollPlayer';
import { ChevronLeft } from 'lucide-react';

function PollDisplay() {
    const { slug } = useParams();
    const [poll, setPoll] = useState(null);
    const [singleViewMode, setSingleViewMode] = useState(false);
    const [qrExpanded, setQrExpanded] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const qId = params.get('q');
        if (qId && poll) {
            // PollPlayer currently handles index internally, but for singleViewMode linking we might need to pass initial index.
            // For now, let's just let PollPlayer play starting from 0 or we add initialIndex prop.
            // Given the complexity of moving state down, I'll pass poll, but initial index logic requires Player update.
            // Ignoring deep linking for specific question in Player for this iteration unless critical.
            setSingleViewMode(true);
        }
    }, [poll]);

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
            const sortedQuestions = res.data.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
            setPoll({ ...res.data, questions: sortedQuestions });
        } catch (err) {
            console.error(err);
        }
    };

    if (!poll) return <div className="min-h-screen flex items-center justify-center text-2xl text-[#502d0e]">Loading Poll...</div>;

    // URL Construction
    const joinUrl = `${window.location.protocol}//${window.location.host}`;

    // Close button for single view
    const renderCloseButton = () => (
        <div className="fixed top-8 left-8 z-50">
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
            {singleViewMode && renderCloseButton()}

            {/* Main Content Area - Full Screen Player */}
            <div className="flex-grow w-full relative overflow-hidden">
                <PollPlayer poll={poll} controlsBehavior="autohide" />
            </div>

            {/* Footer Bar - Always Visible, High Contrast */}
            <div className="bg-[#502d0e] text-white h-24 flex items-center justify-between px-8 md:px-12 shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-30 flex-shrink-0">

                {/* Left: Join URL & QR */}
                <div className="flex items-center gap-6 md:gap-8">
                    <div className="bg-white p-1.5 rounded-lg shadow-lg flex-shrink-0">
                        <QRCodeSVG value={`${joinUrl}/${slug}/vote`} size={70} />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-white/80 uppercase tracking-widest text-xs md:text-sm font-bold mb-0.5">Vote here:</span>
                        <div className="text-2xl md:text-4xl font-black tracking-tight leading-none text-white">
                            {window.location.host}
                            <span className="text-white/60 font-normal ml-1">/{slug}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Code Display */}
                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <div className="text-white/80 uppercase tracking-widest text-xs font-bold">Poll Code</div>
                        <div className="text-sm text-white/60">Enter if asked</div>
                    </div>
                    <div className="font-mono text-4xl md:text-5xl font-black bg-black/20 px-6 py-2 rounded-xl border border-white/10 tracking-widest shadow-inner text-white">
                        {poll.slug}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PollDisplay;
