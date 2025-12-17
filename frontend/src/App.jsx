import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import CreatePoll from './components/CreatePoll';
import EditPoll from './components/EditPoll';
import LandingPage from './components/LandingPage';
import PollDisplay from './components/PollDisplay';
import VotingView from './components/VotingView';

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
            </Routes>
        </Router>
    );
}

export default App;
