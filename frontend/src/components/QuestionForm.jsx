import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Save } from 'lucide-react';

function QuestionForm({ initialData, onSubmit, onCancel, confirmLabel = "Add Question", isEditing = false }) {
    const defaultQuestion = {
        text: '',
        type: 'multiple_choice',
        options: ['', ''],
        visualization_type: 'bar'
    };

    const [question, setQuestion] = useState(initialData || defaultQuestion);

    // Update local state if initialData changes (e.g. switching questions)
    useEffect(() => {
        if (initialData) {
            setQuestion({
                ...initialData,
                options: initialData.options && initialData.options.length > 0 ? initialData.options : ['', '']
            });
        }
    }, [initialData]);

    const handleOptionChange = (idx, val) => {
        const newOpts = [...question.options];
        newOpts[idx] = val;
        setQuestion({ ...question, options: newOpts });
    };

    const addOptionField = () => {
        setQuestion({ ...question, options: [...question.options, ''] });
    };

    const removeOptionField = (idx) => {
        const newOpts = question.options.filter((_, i) => i !== idx);
        setQuestion({ ...question, options: newOpts });
    };

    const handleSubmit = () => {
        if (!question.text) return;
        onSubmit(question);
    };

    return (
        <div className={`bg-white p-6 rounded-xl shadow-md border ${isEditing ? 'border-blue-300 ring-2 ring-blue-50 my-4' : 'border-gray-200'}`}>
            <h2 className="text-lg font-bold mb-4 flex justify-between items-center">
                {isEditing ? 'Edit Question' : 'Add Question'}
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                )}
            </h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <input
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={question.text}
                    onChange={e => setQuestion({ ...question, text: e.target.value })}
                    placeholder="Enter your question here..."
                    autoFocus={isEditing}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Answer Type</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={question.type}
                        onChange={e => {
                            const newType = e.target.value;
                            let newVis = 'bar';
                            if (newType === 'open_ended') newVis = 'wordcloud';
                            setQuestion({ ...question, type: newType, visualization_type: newVis });
                        }}
                    >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="open_ended">Open Ended</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visualization</label>
                    <select
                        value={question.visualization_type}
                        onChange={(e) => setQuestion({ ...question, visualization_type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {question.type === 'multiple_choice' ? (
                            <>
                                <option value="bar">Bar Chart</option>
                                <option value="horizontal_bar">Horizontal Bar Chart</option>
                                <option value="pie">Pie Chart</option>
                                <option value="donut">Donut Chart</option>
                                <option value="treemap">Treemap</option>
                                <option value="radar">Radar Chart</option>
                                <option value="radial_bar">Radial Bar Chart</option>
                                <option value="wordcloud">Word Cloud</option>
                            </>
                        ) : (
                            <>
                                <option value="wordcloud">Word Cloud</option>
                                <option value="list">List View</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {question.type === 'multiple_choice' && (
                <div className="mb-6 space-y-2">
                    <label className="block text-sm font-medium text-gray-700 text-sm">Options</label>
                    {question.options.map((opt, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                className="flex-grow px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={e => handleOptionChange(idx, e.target.value)}
                            />
                            {question.options.length > 2 && (
                                <button onClick={() => removeOptionField(idx)} className="text-gray-400 hover:text-red-500 p-2">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={addOptionField} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1 mt-2">
                        <Plus size={16} /> Add Option
                    </button>
                </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg bg-secondary text-secondary-text border border-primary font-bold hover:bg-secondary-hover transition"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!question.text}
                    className={`px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover shadow-sm transition flex items-center gap-2 ${!question.text ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Save size={18} />
                    {confirmLabel}
                </button>
            </div>
        </div>
    );
}

export default QuestionForm;
