import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import CreatePoll from './components/CreatePoll';
import EditPoll from './components/EditPoll';
import LandingPage from './components/LandingPage';
import PollDisplay from './components/PollDisplay';
import VotingView from './components/VotingView';
import Scratchpad from './components/Scratchpad';
import ScratchpadButtons from './components/ScratchpadButtons';
import ScratchpadTabset from './components/ScratchpadTabset';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
}

function App() {
    return (
        <Router>
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
                <Route path="/:slug/view" element={<PollDisplay />} />
                <Route path="/poll/:slug" element={<VotingView />} />
                <Route path="/" element={<LandingPage />} />

                {/* Dev Tools */}
                <Route path="/scratchpad" element={<Scratchpad />} />
                <Route path="/scratchpad/buttons" element={<ScratchpadButtons />} />
                <Route path="/scratchpad/tabset" element={<ScratchpadTabset />} />

                {/* 404 - Redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
