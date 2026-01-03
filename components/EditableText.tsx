import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Save, X } from 'lucide-react';

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => void;
    isAdmin: boolean;
    className?: string;
    multiline?: boolean;
    label?: string; // For the modal header
    children?: React.ReactNode;
    inputType?: 'text' | 'date' | 'time' | 'textarea';
}

const EditableText: React.FC<EditableTextProps> = ({
    value,
    onSave,
    isAdmin,
    className = "",
    multiline = false,
    label = "Edit Content",
    children,
    inputType
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isEditing]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (isAdmin) {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(true);
        }
    };

    const handleSave = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onSave(tempValue);
        setIsEditing(false);
    };

    const handleCancel = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setTempValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            handleSave(e);
        } else if (e.key === 'Escape') {
            handleCancel(e);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Don't auto-save on backdrop click to prevent accidental saves/closes
        // The user should explicitly click Save or Cancel/X
    };

    // Determine input type
    const effectiveInputType = inputType || (multiline ? 'textarea' : 'text');

    // Render the Modal Portal if editing
    const renderModal = () => {
        if (!isEditing) return null;

        const modalContent = (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={handleBackdropClick}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 border border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-primary font-mono text-sm uppercase tracking-widest">
                            <Pencil className="w-4 h-4" /> {label}
                        </div>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-contrast transition-colors p-1"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-6">
                        {effectiveInputType === 'textarea' ? (
                            <textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-contrast resize-none"
                                autoFocus
                            />
                        ) : (
                            <input
                                type={effectiveInputType}
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-contrast"
                                autoFocus
                            />
                        )}
                        <p className="mt-2 text-xs text-secondary">
                            {inputType === 'date' ? 'Format: YYYY-MM-DD' : 'Press Enter to save, Esc to cancel.'}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-secondary font-medium hover:text-contrast transition-colors"
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                            type="button"
                        >
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        );

        return createPortal(modalContent, document.body);
    };

    return (
        <>
            <span
                onDoubleClick={handleDoubleClick}
                className={`${className} pointer-events-auto ${isAdmin ? 'cursor-edit hover:outline-dashed hover:outline-2 hover:outline-primary/50 hover:bg-primary/5 rounded px-1 -mx-1 transition-all relative inline-block min-w-[1em] min-h-[1em]' : ''}`}
                style={isAdmin ? { color: 'inherit', WebkitTextFillColor: 'currentcolor' } : {}}
                title={isAdmin ? "Double-Click to edit" : undefined}
            >
                {(children || value) || (isAdmin && (
                    <span className="opacity-50 italic text-sm text-inherit" style={{ WebkitTextFillColor: 'currentcolor' }}>Double-Click to Edit</span>
                ))}
            </span>
            {renderModal()}
        </>
    );
};

export default EditableText;