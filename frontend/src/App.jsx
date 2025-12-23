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

// ... RedirectToVote ...
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
                    {/* PRIORITY 1: Administrative Routes (Must come before /:slug) */}
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

                    {/* Explicit Login Route to prevent generic catch-all "login" slug */}
                    <Route path="/login" element={<Navigate to="/" replace />} />

                    {/* PRIORITY 2: Specific Functional Routes */}
                    <Route path="/scratchpad" element={<Scratchpad />} />
                    <Route path="/scratchpad/buttons" element={<ScratchpadButtons />} />
                    <Route path="/scratchpad/tabset" element={<ScratchpadTabset />} />
                    <Route path="/scratchpad/landing-options" element={<LandingOptions />} />

                    {/* PRIORITY 3: Poll Interaction Routes (Specific patterns) */}
                    <Route path="/:slug/edit" element={
                        <PrivateRoute>
                            <EditPoll />
                        </PrivateRoute>
                    } />
                    <Route path="/:slug/results" element={<PollDisplay />} />
                    <Route path="/:slug/vote" element={<VotingView />} />

                    {/* PRIORITY 4: Redirects & Legacy paths */}
                    <Route path="/poll/:slug" element={<RedirectToVote />} />

                    {/* PRIORITY 5: Landing & Default */}
                    <Route path="/" element={<LandingPage />} />

                    {/* PRIORITY 6: Catch-All (The "Magic" Link) */}
                    {/* CAUTION: This matches EVERYTHING else. Must be last. */}
                    {/* If it matches 'dashboard', RedirectToVote handles it above recursively or we fail safely */}
                    <Route path="/:slug" element={<RedirectToVote />} />

                    {/* Absolute 404 Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </GlobalErrorBoundary>
        </Router>
    );
}

export default App;
