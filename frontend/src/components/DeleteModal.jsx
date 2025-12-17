import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

function DeleteModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item?",
    message = "Are you sure you want to proceed? This action cannot be undone.",
    confirmText = "Delete",
    isDanger = true
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-3 ${isDanger ? 'text-red-600' : 'text-amber-600'}`}>
                            <div className={`${isDanger ? 'bg-red-100' : 'bg-amber-100'} p-2 rounded-full`}>
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                            <X size={24} />
                        </button>
                    </div>

                    <p className="text-gray-600 mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-white rounded-lg font-medium transition shadow-sm ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeleteModal;
