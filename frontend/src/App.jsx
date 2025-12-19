import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import CreatePoll from './components/CreatePoll';
import EditPoll from './components/EditPoll';
import LandingPage from './components/LandingPage';
import PollDisplay from './components/PollDisplay';
import VotingView from './components/VotingView';
import Scratchpad from './components/Scratchpad';
import ScratchpadButtons from './components/ScratchpadButtons';
import ScratchpadTabset from './components/ScratchpadTabset';
import LandingOptions from './components/ScratchpadLandingOptions';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
}

function RedirectToVote() {
    const { slug } = useParams();
    return <Navigate to={`/${slug}/vote`} replace />;
}

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-[#502d0e] bg-gray-50 min-h-screen flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
                    <p className="mb-4">We encountered an unexpected error.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-[#502d0e] text-white rounded hover:bg-[#502d0e]/90 transition"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    return (
        <Router>
            <GlobalErrorBoundary>
                <Routes>
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <AdminDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/dashboard/create" element={
                        <PrivateRoute>
                            <CreatePoll />
                        </PrivateRoute>
                    } />

                    <Route path="/:slug/edit" element={
                        <PrivateRoute>
                            <EditPoll />
                        </PrivateRoute>
                    } />

                    {/* Public Routes */}
                    <Route path="/:slug/results" element={<PollDisplay />} />
                    <Route path="/:slug/vote" element={<VotingView />} />
                    <Route path="/poll/:slug" element={<RedirectToVote />} />
                    <Route path="/:slug" element={<RedirectToVote />} />
                    <Route path="/" element={<LandingPage />} />

                    {/* Dev Tools */}
                    <Route path="/scratchpad" element={<Scratchpad />} />
                    <Route path="/scratchpad/buttons" element={<ScratchpadButtons />} />
                    <Route path="/scratchpad/tabset" element={<ScratchpadTabset />} />
                    <Route path="/scratchpad/landing-options" element={<LandingOptions />} />

                    {/* 404 - Redirect to Home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </GlobalErrorBoundary>
        </Router>
    );
}

export default App;
