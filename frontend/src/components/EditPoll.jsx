import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, ChevronLeft, Edit, Trash2, GripVertical, Eye, PlusCircle, Plus, Calendar, Save, X, Settings, Check } from 'lucide-react';
import QuestionForm from './QuestionForm';
import DeleteModal from './DeleteModal';
import Header from './Header';
import { PALETTES } from '../constants/palettes';
import PollPlayer from './PollPlayer';
import ColorGeneratorModal from './ColorGeneratorModal';

function EditPoll() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [poll, setPoll] = useState(null);
    const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'settings' | 'preview'

    // Question State
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [deleteQuestionId, setDeleteQuestionId] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);

    // Settings State
    const [settingsForm, setSettingsForm] = useState({ title: '', closes_at: '', color_palette: '', slide_duration: 3, enable_title_page: false });
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [customColors, setCustomColors] = useState(null);
    const settingsDateRef = useRef(null);

    useEffect(() => {
        fetchPoll();
    }, [slug]);

    const fetchPoll = async () => {
        try {
            const res = await api.get(`/polls/${slug}`);
            const sortedQuestions = res.data.questions.sort((a, b) => (a.order || 0) - (b.order || 0));
            setPoll({ ...res.data, questions: sortedQuestions });

            // Determine if palette is a preset or custom
            let initialPalette = res.data.color_palette || 'lehigh_soft';
            let initialCustom = null;
            const isPreset = PALETTES.some(p => p.id === initialPalette);

            if (!isPreset && initialPalette.startsWith('[')) {
                try {
                    initialCustom = JSON.parse(initialPalette);
                } catch (e) { console.error("Failed to parse custom palette", e); }
            }

            setSettingsForm({
                title: res.data.title,
                closes_at: res.data.closes_at ? res.data.closes_at.slice(0, 16) : '',
                color_palette: initialPalette,
                slide_duration: res.data.slide_duration || 3,
                enable_title_page: res.data.enable_title_page || false
            });
            if (initialCustom) {
                setCustomColors(initialCustom);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleApplyCustomColors = (colors) => {
        const jsonColors = JSON.stringify(colors);
        setCustomColors(colors);
        setSettingsForm({ ...settingsForm, color_palette: jsonColors });
        setShowColorModal(false);
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const payload = {
                title: settingsForm.title,
                color_palette: settingsForm.color_palette,
                closes_at: settingsForm.closes_at ? new Date(settingsForm.closes_at).toISOString() : null,
                slide_duration: settingsForm.slide_duration,
                enable_title_page: settingsForm.enable_title_page
            };
            await api.put(`/polls/${slug}`, payload);
            fetchPoll(); // Refresh to get updated data
            // Show success toast? For now just button state or alert
        } catch (err) {
            console.error(err);
            alert("Failed to update settings");
        } finally {
            setIsSavingSettings(false);
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
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === undefined) return;
        if (draggedIndex === dropIndex) return;

        const newQuestions = [...poll.questions];
        const [movedItem] = newQuestions.splice(draggedIndex, 1);
        newQuestions.splice(dropIndex, 0, movedItem);

        const updatedQuestions = newQuestions.map((q, idx) => ({ ...q, order: idx }));
        setPoll({ ...poll, questions: updatedQuestions });
        setDraggedIndex(null);

        try {
            const orderedIds = updatedQuestions.map(q => q.id);
            await api.put(`/polls/${slug}/questions/reorder`, orderedIds);
        } catch (err) {
            console.error("Failed to save order", err);
            fetchPoll();
        }
    };

    const isCustomSelected = customColors && settingsForm.color_palette === JSON.stringify(customColors);

    if (!poll) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold text-xl">Loading Poll Data...</div>;

    return (
        <div className="min-h-screen p-8 pb-32 bg-gray-50">
            <DeleteModal
                isOpen={!!deleteQuestionId}
                onClose={() => setDeleteQuestionId(null)}
                onConfirm={confirmDelete}
                title="Delete Question?"
                message="Are you sure you want to delete this question? This action cannot be undone and all associated votes will be lost."
                confirmText="Delete Question"
            />

            <div className="max-w-7xl mx-auto">
                {showColorModal && (
                    <ColorGeneratorModal
                        onClose={() => setShowColorModal(false)}
                        onApply={handleApplyCustomColors}
                        initialColors={customColors}
                    />
                )}
                <Header />

                {/* Poll Title & Preview Action */}
                <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{poll.title}</h1>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-8 mb-6 border-b border-gray-300">
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'questions' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Questions
                        {activeTab === 'questions' && <span className="absolute bottom-[-1px] left-0 w-full h-1 bg-primary rounded-t-md"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'settings' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Settings
                        {activeTab === 'settings' && <span className="absolute bottom-[-1px] left-0 w-full h-1 bg-primary rounded-t-md"></span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'preview' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Preview
                        {activeTab === 'preview' && <span className="absolute bottom-[-1px] left-0 w-full h-1 bg-primary rounded-t-md"></span>}
                    </button>
                </div>

                {activeTab === 'questions' ? (
                    <>
                        <div className="mb-0 bg-white rounded-xl shadow-sm border border-gray-400 overflow-hidden">
                            <div className="bg-secondary border-b border-gray-300 grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-secondary-text uppercase tracking-wider items-center">
                                <div className="col-span-1 text-center"></div>
                                <div className="col-span-5">Question</div>
                                <div className="col-span-2">Type</div>
                                <div className="col-span-2">Visualization</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {poll.questions && poll.questions.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {poll.questions.map((q, i) => (
                                        <div key={q.id} className={`border-b border-gray-200 last:border-0 transition-all duration-200 ${editingQuestionId === q.id
                                            ? 'bg-gray-50 border-l-4 border-l-primary shadow-md my-4 rounded-lg border border-gray-300 transform scale-[1.01]'
                                            : 'bg-white hover:bg-gray-50'
                                            }`}>
                                            <div
                                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary-hover transition-colors"
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, i)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, i)}
                                            >
                                                <div className="col-span-1 text-gray-300 cursor-move hover:text-gray-500 flex justify-center">
                                                    <GripVertical size={20} />
                                                </div>
                                                <div className="col-span-5">
                                                    <h3 className="font-bold text-gray-800 text-base break-words leading-tight">{q.text}</h3>
                                                    <div className="text-xs text-gray-400 mt-0.5">{q.options.length} Options</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded text-xs font-medium capitalize block w-fit truncate max-w-full">
                                                        {q.question_type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded text-xs font-medium capitalize block w-fit truncate max-w-full">
                                                        {q.visualization_type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => setEditingQuestionId(editingQuestionId === q.id ? null : q.id)}
                                                        className={`p-1.5 rounded-lg transition ${editingQuestionId === q.id ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                                                        title={editingQuestionId === q.id ? "Close Edit" : "Edit"}
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <Link
                                                        to={`/${slug}/view?q=${q.id}`}
                                                        target="_blank"
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Question"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteQuestionId(q.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {editingQuestionId === q.id && (
                                                <div className="pb-6 px-16 border-t border-gray-100">
                                                    <div className="pt-4">
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
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    No questions yet. Add one below!
                                </div>
                            )}
                        </div>

                        <div>
                            {!isAddingQuestion ? (
                                <button
                                    onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                                    className="w-1/3 mx-auto mt-4 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors group bg-gray-50 hover:bg-secondary-hover"
                                >
                                    <Plus className="group-hover:scale-110 transition-transform" />
                                    <span className="font-bold">Add New Question</span>
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
                    </>
                ) : activeTab === 'settings' ? (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="bg-secondary px-8 py-6 border-b border-gray-300">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Settings className="text-primary" /> Poll Settings
                                </h2>
                            </div>

                            <form onSubmit={handleSaveSettings} className="p-8 space-y-8">
                                {/* Title Input */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Poll Title</label>
                                    <input
                                        type="text"
                                        value={settingsForm.title}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                                        className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors"
                                    />
                                </div>

                                {/* Date & Duration */}
                                <div className="flex gap-4">
                                    {/* Date Input */}
                                    <div className="flex-grow">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Auto-Close Date</label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => settingsDateRef.current.showPicker()}
                                                className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all font-bold w-full ${settingsForm.closes_at ? 'border-primary text-primary bg-secondary/30' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                <Calendar size={20} />
                                                <span>{settingsForm.closes_at ? new Date(settingsForm.closes_at).toLocaleString() : 'Schedule Close Date'}</span>
                                            </button>
                                            {settingsForm.closes_at && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSettingsForm({ ...settingsForm, closes_at: '' })}
                                                    className="text-gray-400 hover:text-gray-600 p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                    title="Clear Date"
                                                >
                                                    <X size={20} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="datetime-local"
                                            ref={settingsDateRef}
                                            value={settingsForm.closes_at}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, closes_at: e.target.value })}
                                            className="sr-only"
                                        />
                                    </div>

                                    {/* Duration Input */}
                                    <div className="w-1/4 min-w-[120px]">
                                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Slide Duration (s)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={settingsForm.slide_duration}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, slide_duration: parseInt(e.target.value) || 3 })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none transition-colors text-lg font-bold text-center"
                                        />
                                    </div>

                                    {/* Title Page Checkbox */}
                                    <div className="flex items-center">
                                        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${settingsForm.enable_title_page ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                                {settingsForm.enable_title_page && <Check size={16} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={settingsForm.enable_title_page}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, enable_title_page: e.target.checked })}
                                            />
                                            <span className="font-bold text-gray-700 select-none">Enable Title Page</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Color Palette */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Chart Color Theme</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {/* Presets */}
                                        {PALETTES.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    setSettingsForm({ ...settingsForm, color_palette: p.id });
                                                    setCustomColors(null); // Deselect custom visual state if switching to preset
                                                }}
                                                className={`relative p-3 rounded-xl border-2 text-left transition-all ${settingsForm.color_palette === p.id ? 'border-primary bg-secondary/30 ring-1 ring-primary' : 'border-gray-100 hover:border-gray-300'}`}
                                            >
                                                <div className="flex gap-1 mb-2 h-6">
                                                    {p.colors.map(c => (
                                                        <div key={c} className="flex-1 h-full rounded-sm" style={{ backgroundColor: c }}></div>
                                                    ))}
                                                </div>
                                                <span className={`text-sm font-bold ${settingsForm.color_palette === p.id ? 'text-primary' : 'text-gray-500'}`}>{p.name}</span>
                                            </button>
                                        ))}

                                        {/* Custom Card */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!customColors) {
                                                    setShowColorModal(true);
                                                } else {
                                                    // Allow editing if already selected, or just selecting it
                                                    if (!isCustomSelected) {
                                                        setSettingsForm({ ...settingsForm, color_palette: JSON.stringify(customColors) });
                                                    } else {
                                                        setShowColorModal(true);
                                                    }
                                                }
                                            }}
                                            className={`relative p-3 rounded-xl border-2 text-left transition-all group ${isCustomSelected ? 'border-primary bg-secondary/30 ring-1 ring-primary' : 'border-gray-100 hover:border-gray-300 border-dashed'}`}
                                        >
                                            <div className="flex gap-1 mb-2 h-6 items-center justify-center bg-gray-50 rounded-sm overflow-hidden">
                                                {customColors ? (
                                                    customColors.map((c, i) => (
                                                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }}></div>
                                                    ))
                                                ) : (
                                                    <Plus className="text-gray-400 group-hover:text-primary transition" />
                                                )}
                                            </div>
                                            <span className={`text-sm font-bold ${isCustomSelected ? 'text-primary' : 'text-gray-500'}`}>
                                                {customColors ? 'Custom Colors' : 'Select Custom Colors'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={isSavingSettings}
                                        className="px-8 py-3 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:bg-primary-hover hover:shadow-xl transition transform active:scale-95 flex items-center gap-2"
                                    >
                                        {isSavingSettings ? 'Saving...' : 'Save Changes'} <Check size={20} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-900 border-opacity-10 overflow-hidden">
                            {/* Preview Container: 1px border is handled by border-opacity-10 combined with standard border width or specific class. User asked for 1px rectangle. standard border is 1px. */}
                            <div className="border border-gray-200 rounded-lg p-2 m-4 bg-gray-50/50">
                                <PollPlayer poll={poll} activePalette={settingsForm.color_palette} isPreview={true} />
                            </div>
                            <div className="p-4 bg-gray-50 text-center text-sm text-gray-400">
                                This is a preview of how your poll will appear to participants.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EditPoll;
