import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, ChevronLeft, Edit, Trash2, GripVertical, Eye, PlusCircle } from 'lucide-react';
import QuestionForm from './QuestionForm';
import DeleteModal from './DeleteModal';
import Header from './Header';

function EditPoll() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [poll, setPoll] = useState(null);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [deleteQuestionId, setDeleteQuestionId] = useState(null); // ID of question to delete
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);

    useEffect(() => {
        fetchPoll();
    }, [slug]);

    const fetchPoll = async () => {
        try {
            const res = await api.get(`/polls/${slug}`);
            // Sort by order if available, otherwise by id or existing order
            const sortedQuestions = res.data.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
            setPoll({ ...res.data, questions: sortedQuestions });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveQuestion = async (questionData, isUpdate = false) => {
        const validOptions = questionData.options.filter(o => o && o.trim() !== '').map(text => ({ text }));
        const payload = {
            text: questionData.text,
            question_type: questionData.type,
            visualization_type: questionData.visualization_type,
            order: isUpdate ? poll.questions.find(q => q.id === editingQuestionId)?.order || 0 : poll.questions.length,
            options: validOptions
        };

        try {
            if (isUpdate && editingQuestionId) {
                await api.put(`/polls/${slug}/questions/${editingQuestionId}`, payload);
                setEditingQuestionId(null);
            } else {
                await api.post(`/polls/${slug}/questions`, payload);
                setIsAddingQuestion(false);
            }
            fetchPoll();
        } catch (err) {
            console.error(err);
            alert('Failed to save question');
        }
    };

    const confirmDelete = async () => {
        if (!deleteQuestionId) return;
        try {
            await api.delete(`/polls/${slug}/questions/${deleteQuestionId}`);
            setDeleteQuestionId(null);
            fetchPoll();
        } catch (err) {
            console.error(err);
            alert('Failed to delete question');
        }
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image usually handled by browser
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (e, dropIndex) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === undefined) return;
        if (draggedIndex === dropIndex) return;

        const newQuestions = [...poll.questions];
        const [movedItem] = newQuestions.splice(draggedIndex, 1);
        newQuestions.splice(dropIndex, 0, movedItem);

        // Update local state immediately with new order values
        const updatedQuestions = newQuestions.map((q, idx) => ({ ...q, order: idx }));
        setPoll({ ...poll, questions: updatedQuestions });
        setDraggedIndex(null);

        // Save order to backend
        try {
            const orderedIds = updatedQuestions.map(q => q.id);
            await api.put(`/polls/${slug}/questions/reorder`, orderedIds);
        } catch (err) {
            console.error("Failed to save order", err);
            // Ideally revert here, but fetchPoll normally fixes it on next load or you can call it now
            fetchPoll();
        }
    };

    if (!poll) return <div className="p-8 text-center text-gray-500">Loading poll data...</div>;

    return (
        <div className="min-h-screen p-8 pb-32">
            {/* Delete Modal */}
            <DeleteModal
                isOpen={!!deleteQuestionId}
                onClose={() => setDeleteQuestionId(null)}
                onConfirm={confirmDelete}
                title="Delete Question?"
                message="Are you sure you want to delete this question? This action cannot be undone and all associated votes will be lost."
                confirmText="Delete Question"
            />

            <div className="max-w-7xl mx-auto">
                <Header />

                <div className="flex items-center gap-4 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
                    <Link
                        to={`/${slug}/view`}
                        target="_blank"
                        className="text-sm border border-[#6b4e31] text-[#6b4e31] px-3 py-1 rounded hover:bg-[#6b4e31] hover:text-white transition flex items-center gap-1 bg-transparent font-medium"
                    >
                        Preview Display &rarr;
                    </Link>
                </div>

                {/* Questions List */}
                <div className="mb-12 bg-white rounded-xl shadow-sm border border-gray-400 overflow-hidden">
                    {poll.questions && poll.questions.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {poll.questions.map((q, i) => (
                                <React.Fragment key={q.id}>
                                    {editingQuestionId === q.id ? (
                                        <div className="p-4 bg-gray-50">
                                            <QuestionForm
                                                initialData={{
                                                    text: q.text,
                                                    type: q.question_type,
                                                    visualization_type: q.visualization_type,
                                                    options: q.options.map(o => o.text)
                                                }}
                                                onSubmit={(data) => handleSaveQuestion(data, true)}
                                                onCancel={() => setEditingQuestionId(null)}
                                                confirmLabel="Update Question"
                                                isEditing={true}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="p-4 flex gap-4 items-center group hover:bg-gray-50 transition"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, i)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, i)}
                                        >
                                            {/* Drag Handle */}
                                            <div className="text-gray-300 cursor-move hover:text-gray-500">
                                                <GripVertical size={20} />
                                            </div>

                                            <div className="flex-grow">
                                                <h3 className="font-bold text-gray-800 text-lg">{q.text}</h3>
                                                <div className="flex gap-3 text-sm text-gray-500 mt-1">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{q.question_type.replace('_', ' ')}</span>
                                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded capitalize">{q.visualization_type}</span>
                                                    <span>{q.options.length} Options</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingQuestionId(q.id)}
                                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={20} />
                                                </button>
                                                <Link
                                                    to={`/${slug}/view?q=${q.id}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="View Question"
                                                >
                                                    <Eye size={20} />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteQuestionId(q.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            No questions yet. Add one below!
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    {!isAddingQuestion ? (
                        <button
                            onClick={() => setIsAddingQuestion(true)}
                            className="w-1/3 mx-auto block bg-[#502d0e] text-white font-bold py-4 rounded-lg hover:bg-[#3d220b] transition transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                        >
                            <PlusCircle size={24} />
                            Add New Question
                        </button>
                    ) : (
                        <div className="transform scale-[1.01] transition-transform duration-200">
                            <QuestionForm
                                initialData={null}
                                onSubmit={(data) => handleSaveQuestion(data, false)}
                                onCancel={() => setIsAddingQuestion(false)}
                                confirmLabel="Add Question"
                                isEditing={false}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default EditPoll;
