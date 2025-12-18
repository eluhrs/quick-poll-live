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

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
}

function RedirectToVote() {
    const { slug } = useParams();
    return <Navigate to={`/${slug}/vote`} replace />;
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
                <Route path="/:slug/results" element={<PollDisplay />} />
                <Route path="/:slug/vote" element={<VotingView />} />
                <Route path="/poll/:slug" element={<RedirectToVote />} />
                <Route path="/:slug" element={<RedirectToVote />} />
                <Route path="/" element={<LandingPage />} />

                {/* Dev Tools */}
                <Route path="/scratchpad" element={<Scratchpad />} />
                <Route path="/scratchpad/buttons" element={<ScratchpadButtons />} />
                <Route path="/scratchpad/tabset" element={<ScratchpadTabset />} />

                {/* 404 - Debug */}
                <Route path="*" element={
                    <div className="p-8 text-red-600">
                        <h1 className="text-xl font-bold">404 - Route Not Found</h1>
                        <p>Current Path: {window.location.pathname}</p>
                        <p>Params: {window.location.search}</p>
                    </div>
                } />
            </Routes>
        </Router>
    );
}

export default App;
