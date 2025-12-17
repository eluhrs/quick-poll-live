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
        <div className="min-h-screen flex flex-col p-8 font-sans">
            {singleViewMode && renderCloseButton()}

            <div className="flex-grow flex gap-8">
                {/* Left: Player */}
                <div className="flex-grow flex flex-col justify-center border border-gray-100 rounded-xl p-8 bg-white/50 shadow-sm">
                    <PollPlayer poll={poll} />
                </div>

                {/* Right: QR Box */}
                <div className="w-1/4 min-w-[300px] flex flex-col justify-center items-center">
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
                </div>
            </div>
        </div>
    );
}

export default PollDisplay;
