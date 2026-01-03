import React, { useState } from 'react';
import { Image as ImageIcon, Save, X } from 'lucide-react';

interface EditableImageProps {
    src?: string;
    alt: string;
    onSave: (newUrl: string) => void;
    isAdmin: boolean;
    className?: string;
}

const EditableImage: React.FC<EditableImageProps> = ({
    src,
    alt,
    onSave,
    isAdmin,
    className = ""
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempUrl, setTempUrl] = useState(src || '');

    const transformGoogleDriveUrl = (url: string) => {
        if (!url) return url;
        const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)/;
        const match = url.match(driveRegex);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
        return url;
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (isAdmin) {
            e.preventDefault();
            e.stopPropagation();
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        onSave(transformGoogleDriveUrl(tempUrl));
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempUrl(src || '');
        setIsEditing(false);
    };

    // If no src is provided but we are admin, render a placeholder
    const displaySrc = transformGoogleDriveUrl(src) || (isAdmin ? 'https://via.placeholder.com/400x300?text=Double+Click+To+Add+Image' : null);

    if (!displaySrc) return null;

    return (
        <>
            <div
                onDoubleClick={handleDoubleClick}
                className={`relative ${className} ${isAdmin ? 'cursor-edit group transition-all' : ''}`}
                title={isAdmin ? "Double-click to edit image" : undefined}
            >
                <img src={displaySrc} alt={alt} className="w-full h-full object-cover" />
                {isAdmin && (
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <ImageIcon className="text-white w-8 h-8 drop-shadow-md" />
                    </div>
                )}
            </div>

            {isEditing && (
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >

                        <div className="mb-6 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-secondary mb-1 block">Image URL</label>
                                <input
                                    type="text"
                                    value={tempUrl}
                                    onChange={(e) => setTempUrl(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-contrast text-sm"
                                    autoFocus
                                    placeholder="https://..."
                                />
                            </div>
                            {tempUrl && (
                                <div className="rounded-lg overflow-hidden h-32 w-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <img src={tempUrl} alt="Preview" className="h-full w-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-secondary font-medium hover:text-contrast transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EditableImage;
