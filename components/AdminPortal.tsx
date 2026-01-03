import React, { useState, useEffect, useRef } from 'react';
import { ClubData, Project, Meeting, Officer } from '../types';
import { LogOut, Plus, Trash2, ChevronLeft, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, RefreshCw, Github, FolderPlus, Send, Calendar, CloudSync, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ARCHIVE_REPO, ARCHIVE_GITHUB_API_BASE_URL, PROJECTS_BASE_PATH } from '../constants';

interface AdminPortalProps {
    data: ClubData;
    updateData: (newData: Partial<ClubData>) => void;
    isAdmin: boolean;
    setIsAdmin: (value: boolean) => void;
    isArchiveLoaded?: boolean;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ data, updateData, isAdmin, setIsAdmin, isArchiveLoaded }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'projects' | 'meetings' | 'team' | 'settings'>('projects');
    const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('gh_pat') || '');
    const [initStatus, setInitStatus] = useState<Record<string, 'loading' | 'success' | 'error' | 'none'>>({});
    const [isBulkSyncing, setIsBulkSyncing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'unsaved'>('idle');
    const [saveError, setSaveError] = useState('');
    const lastDataRef = useRef<string>(JSON.stringify(data));
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced Auto-Sync
    useEffect(() => {
        if (!isAdmin) return;

        const currentDataStr = JSON.stringify(data);
        if (currentDataStr !== lastDataRef.current) {
            setSaveStatus('unsaved');
            lastDataRef.current = currentDataStr;

            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

            syncTimeoutRef.current = setTimeout(() => {
                handleSaveToGitHub(true);
            }, 10000); // 10 seconds
        }

        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, [data, isAdmin]);

    // Recurring Scheduler State
    const [recurringType, setRecurringType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
    const [recurringCount, setRecurringCount] = useState(4);
    const [recurringTitle, setRecurringTitle] = useState('General Meeting');
    const [recurringLocation, setRecurringLocation] = useState('Room 702');
    const [recurringTime, setRecurringTime] = useState('15:30');
    const [recurringStartDate, setRecurringStartDate] = useState(new Date().toISOString().split('T')[0]);

    const slugify = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w-]+/g, '')  // Remove all non-word chars
            .replace(/--+/g, '-');    // Replace multiple - with single -
    };

    const handleTokenChange = (token: string) => {
        setGithubToken(token);
        localStorage.setItem('gh_pat', token);
    };

    async function hashPassword(password: string) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    const handleSaveToGitHub = async (isAutoSync = false) => {
        if (!githubToken) {
            if (!isAutoSync) {
                alert('Please add a GitHub Personal Access Token in the Settings tab first.');
                setActiveTab('settings');
            }
            return;
        }

        setSaveStatus('loading');
        setSaveError('');

        try {
            const headers = {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            };

            // 1. Get the current SHA of metadata.json from ARCHIVE
            const getRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/metadata.json`, { headers });
            if (!getRes.ok) throw new Error('Failed to fetch metadata.json from Archive Repository');
            const fileData = await getRes.json();
            const currentSha = fileData.sha;

            // Add timestamp to data for sync tracking
            const dataToSave = {
                ...data,
                lastUpdated: new Date().toISOString()
            };

            // 2. Prepare the new content
            let content: string;
            try {
                content = btoa(unescape(encodeURIComponent(JSON.stringify(dataToSave, null, 2))));
            } catch (encodingErr) {
                console.error('Encoding error:', encodingErr);
                throw new Error('Failed to encode data for GitHub. This might be due to unsupported special characters.');
            }

            // 3. Update the file in ARCHIVE
            const updateRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/metadata.json`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    message: `${isAutoSync ? 'Auto-sync' : 'Manual update'} metadata.json from Admin Portal [${new Date().toISOString()}]`,
                    content: content,
                    sha: currentSha
                })
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(errorData.message || 'Failed to update metadata.json');
            }

            setSaveStatus('success');
            lastDataRef.current = JSON.stringify(data); // Sync the ref to prevent immediate re-trigger
            setTimeout(() => setSaveStatus('idle'), 5000);

        } catch (err: any) {
            console.error('Save error:', err);
            setSaveStatus('error');
            setSaveError(err.message || 'An unknown error occurred while saving.');
        }
    };

    const initializeArchiveFolders = async (project: Project) => {
        if (!githubToken) {
            alert('Please add a GitHub Personal Access Token in the Settings tab first.');
            setActiveTab('settings');
            return;
        }

        const slug = slugify(project.title);
        const date = new Date().toISOString().split('T')[0];
        const initialFolderPath = `${PROJECTS_BASE_PATH}/${slug}/${date}-Project-Initialized`;

        setInitStatus(prev => ({ ...prev, [project.id]: 'loading' }));

        try {
            const headers = {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            };

            const filesToCreate = [
                { path: `${PROJECTS_BASE_PATH}/${slug}/.gitkeep`, content: '' },
                { path: `${initialFolderPath}/desc.txt`, content: 'Project initialized.' }
            ];

            for (const file of filesToCreate) {
                // Check if file exists in ARCHIVE
                const checkRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/${file.path}`, { headers });

                if (checkRes.status === 404) {
                    // Create placeholder file to "create" the folder in ARCHIVE
                    let content: string;
                    try {
                        content = btoa(unescape(encodeURIComponent(file.content)));
                    } catch (encodingErr) {
                        console.error('Encoding error:', encodingErr);
                        throw new Error(`Failed to encode content for ${file.path}. This might be due to unsupported special characters.`);
                    }

                    const createRes = await fetch(`${ARCHIVE_GITHUB_API_BASE_URL}/${file.path}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                            message: `Initialize project archive for ${slug}`,
                            content: content
                        })
                    });

                    if (!createRes.ok) throw new Error(`Failed to create ${file.path}`);
                }
            }

            setInitStatus(prev => ({ ...prev, [project.id]: 'success' }));
            return true;
        } catch (err) {
            console.error('Initialization error:', err);
            setInitStatus(prev => ({ ...prev, [project.id]: 'error' }));
            return false;
        }
    };

    const handleBulkSync = async () => {
        if (!githubToken) {
            alert('Please add a GitHub Personal Access Token in the Settings tab first.');
            setActiveTab('settings');
            return;
        }

        if (!confirm('This will ensure all project folders exist in the Archive repository. Proceed?')) {
            return;
        }

        setIsBulkSyncing(true);
        let successCount = 0;

        for (const project of data.projects) {
            const success = await initializeArchiveFolders(project);
            if (success) successCount++;
        }

        setIsBulkSyncing(false);
        alert(`Bulk sync complete. ${successCount}/${data.projects.length} projects ensured.`);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setIsLoading(true);
        setError('');

        const adminHash = import.meta.env.VITE_ADMIN_HASH;

        if (!adminHash) {
            console.error('VITE_ADMIN_HASH is not defined in the environment.');
            setError('System configuration error: Hash missing.');
            setIsLoading(false);
            return;
        }

        try {
            const hashedInput = await hashPassword(password);

            // Simulate network verification delay for UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (hashedInput === adminHash) {
                setIsSuccess(true);
                setTimeout(() => {
                    setIsAdmin(true);
                    // Reset login state for next time
                    setIsSuccess(false);
                    setPassword('');
                    setIsLoading(false);
                }, 1000);
            } else {
                setError('Incorrect password');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Hashing error:', err);
            setError('An error occurred during verification.');
            setIsLoading(false);
        }
    };

    const handleDeleteProject = (id: string) => {
        updateData({ projects: data.projects.filter(p => p.id !== id) });
    };

    const handleAddProject = () => {
        const newProject: Project = {
            id: Date.now().toString(),
            title: 'New Project',
            description: 'Project description goes here.',
            status: 'In Progress',
            operationalStatus: 'Active',
            imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=2070&auto=format&fit=crop',
            specs: [
                { label: 'Apogee', value: 'TBD' },
                { label: 'Motor', value: 'TBD' },
                { label: 'Recovery', value: 'TBD' }
            ]
        };
        updateData({ projects: [...data.projects, newProject] });
    };

    const handleDeleteMeeting = (id: string) => {
        updateData({ meetings: data.meetings.filter(m => m.id !== id) });
    };

    const handleAddMeeting = () => {
        const newMeeting: Meeting = {
            id: Date.now().toString(),
            title: 'New Meeting',
            date: new Date().toISOString().split('T')[0],
            time: '15:30',
            location: 'Room 702',
            description: 'Meeting details here.',
            status: 'Active'
        };
        updateData({ meetings: [...data.meetings, newMeeting] });
    };

    const handleAddOfficer = () => {
        const newOfficer: Officer = {
            id: Date.now().toString(),
            name: 'New Officer',
            role: 'Officer',
            email: 'email@example.com'
        };
        updateData({ officers: [...(data.officers || []), newOfficer] });
    };

    const handleDeleteOfficer = (id: string) => {
        updateData({ officers: data.officers.filter(o => o.id !== id) });
    };

    const handleMoveOfficer = (index: number, direction: 'up' | 'down') => {
        const newOfficers = [...data.officers];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newOfficers.length) return;

        [newOfficers[index], newOfficers[targetIndex]] = [newOfficers[targetIndex], newOfficers[index]];
        updateData({ officers: newOfficers });
    };

    const handleCreateRecurring = () => {
        const newMeetings: Meeting[] = [];
        let currentDate = new Date(recurringStartDate);

        // Adjust for timezone to ensure the date matches the input
        currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());

        for (let i = 0; i < recurringCount; i++) {
            newMeetings.push({
                id: `${Date.now()}-${i}`,
                title: recurringTitle,
                date: currentDate.toISOString().split('T')[0],
                time: recurringTime,
                location: recurringLocation,
                description: 'Recurring flight operation.',
                status: 'Active'
            });

            if (recurringType === 'Daily') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (recurringType === 'Weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (recurringType === 'Monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        updateData({ meetings: [...data.meetings, ...newMeetings] });
        alert(`Successfully scheduled ${recurringCount} meetings.`);
    };

    // Login Screen
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center p-4">
                <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-2xl shadow-soft">
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold text-contrast tracking-tight">Admin Access</h1>
                        <p className="text-sm text-secondary mt-2">Please enter the Admin passkey.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="admin-password" id="password-label" className="sr-only">Password</label>
                            <input
                                id="admin-password"
                                name="admin-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                aria-labelledby="password-label"
                                disabled={isLoading || isSuccess}
                                className={`w-full bg-surface border rounded-lg px-4 py-3 text-contrast placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-center ${error ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-primary/50'
                                    } ${isSuccess ? 'border-green-300 bg-green-50 text-green-700' : ''}`}
                            />
                        </div>

                        {/* Status Feedback Area */}
                        <div className="h-6 flex items-center justify-center">
                            {isLoading && !isSuccess && !error && (
                                <div className="flex items-center gap-2 text-secondary text-xs font-mono animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" /> VERIFYING CREDENTIALS...
                                </div>
                            )}
                            {isSuccess && (
                                <div className="flex items-center gap-2 text-green-600 text-xs font-mono font-bold animate-fade-in">
                                    <CheckCircle className="w-3 h-3" /> ACCESS GRANTED
                                </div>
                            )}
                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-medium">
                                    <AlertCircle className="w-3 h-3" /> {error}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isSuccess}
                            className={`w-full font-medium rounded-lg py-3 transition-all flex items-center justify-center gap-2 ${isSuccess
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                                : 'bg-contrast text-white hover:bg-black/90 shadow-lg shadow-gray-500/20'
                                } ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">Processing...</span>
                            ) : isSuccess ? (
                                <span className="flex items-center gap-2">Entering</span>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <Link to="/" className="text-secondary text-xs hover:text-primary transition-colors inline-flex items-center gap-1 group">
                                <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Back to Home
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Dashboard
    return (
        <div className="min-h-screen bg-surface pt-28 px-6 pb-12">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold text-contrast">Website Control</h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
                                <div className={`w-1.5 h-1.5 rounded-full ${isArchiveLoaded ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                    {isArchiveLoaded ? 'Archive Connected' : 'Local Mode'}
                                </span>
                            </div>

                            {/* Auto-Sync Status Pill */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-full shadow-sm transition-all duration-300 ${saveStatus === 'unsaved' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                saveStatus === 'loading' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                    saveStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                                        saveStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                                            'bg-gray-50 border-gray-100 text-gray-400'
                                }`}>
                                {saveStatus === 'unsaved' && (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Unsaved Changes</span>
                                    </>
                                )}
                                {saveStatus === 'loading' && (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Saving to GitHub...</span>
                                    </>
                                )}
                                {saveStatus === 'success' && (
                                    <>
                                        <CheckCircle className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Saved to GitHub</span>
                                    </>
                                )}
                                {saveStatus === 'error' && (
                                    <>
                                        <AlertCircle className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Save Failed</span>
                                    </>
                                )}
                                {saveStatus === 'idle' && (
                                    <>
                                        <CloudSync className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Sync Ready</span>
                                    </>
                                )}
                            </div>

                            <a
                                href={`https://github.com/${ARCHIVE_REPO}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-full shadow-sm text-secondary hover:text-primary transition-colors group"
                            >
                                <Github className="w-3 h-3 transition-transform group-hover:scale-110" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Repository</span>
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleSaveToGitHub(false)}
                            disabled={saveStatus === 'loading'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg ${saveStatus === 'success' ? 'bg-green-500 text-white shadow-green-500/20' :
                                saveStatus === 'error' ? 'bg-red-500 text-white shadow-red-500/20' :
                                    'bg-primary text-white hover:bg-blue-600 shadow-primary/20'
                                } ${saveStatus === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {saveStatus === 'loading' ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Transmitting...</>
                            ) : saveStatus === 'success' ? (
                                <><CheckCircle className="w-4 h-4" /> Changes Saved</>
                            ) : saveStatus === 'error' ? (
                                <><AlertCircle className="w-4 h-4" /> Transmission Failed</>
                            ) : (
                                <><Send className="w-4 h-4" /> Save to GitHub</>
                            )}
                        </button>
                        <button
                            onClick={() => setIsAdmin(false)}
                            className="text-sm text-secondary hover:text-contrast flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-primary flex flex-col gap-3">
                    <div className="flex gap-2 items-start">
                        <div className="font-bold shrink-0">Centralized Data:</div>
                        <div>
                            All site data (projects, events, and content) is now managed through the <strong>Archive Repository</strong>. The local <code>metadata.json</code> is only used as a fallback.
                        </div>
                    </div>
                    <div className="flex gap-2 items-start">
                        <div className="font-bold shrink-0">Info:</div>
                        <div>
                            To edit website text (Hero titles, mission statements), simply <strong>Right-Click</strong> on the text directly on the website while logged in.
                        </div>
                    </div>
                    {saveStatus === 'error' && (
                        <div className="flex gap-2 items-start p-2 bg-red-50 border border-red-100 rounded text-red-800 text-xs animate-shake">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <div>
                                <strong>Save Error:</strong> {saveError}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2 items-start p-2 bg-amber-50 border border-amber-100 rounded text-amber-800 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <div>
                            <strong>Critical Workflow:</strong> Changes made here are saved to your <strong>local session only</strong>. You must click the <strong>"Save to GitHub"</strong> button above to persist these changes permanently to the website.
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8 space-x-8 overflow-x-auto">
                    {(['projects', 'meetings', 'team', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap px-2 ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-contrast'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* CONTENT */}
                <div className="space-y-8 animate-fade-in">

                    {/* Projects */}
                    {activeTab === 'projects' && (
                        <div className="space-y-6">
                            <div className="flex justify-end items-center gap-3">
                                <button
                                    onClick={handleBulkSync}
                                    disabled={isBulkSyncing}
                                    className="bg-surface hover:bg-gray-100 text-secondary border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isBulkSyncing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
                                    ) : (
                                        <><RefreshCw className="w-4 h-4" /> Sync All Projects</>
                                    )}
                                </button>
                                <button onClick={handleAddProject} className="bg-white hover:bg-gray-50 text-contrast border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                                    <Plus className="w-4 h-4" /> Add Project
                                </button>
                            </div>
                            {data.projects.map((project, index) => (
                                <div key={project.id} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row gap-6 shadow-sm">
                                    <div className="w-full md:w-48 h-32 flex-shrink-0 relative group">
                                        <img src={project.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 bg-black/20 rounded-xl transition-opacity">
                                            <ImageIcon className="text-white w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex-grow space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="w-full">
                                                <label htmlFor={`project-title-${project.id}`} className="sr-only">Project Title</label>
                                                <textarea
                                                    id={`project-title-${project.id}`}
                                                    name={`project-title-${project.id}`}
                                                    className="w-full bg-transparent text-xl font-medium text-contrast placeholder-gray-300 focus:outline-none resize-none"
                                                    rows={1}
                                                    value={project.title}
                                                    onChange={(e) => {
                                                        const newProjects = [...data.projects];
                                                        newProjects[index].title = e.target.value;
                                                        updateData({ projects: newProjects });
                                                    }}
                                                    placeholder="Project Title"
                                                />
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                                                ID: {slugify(project.title)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor={`project-lead-${project.id}`} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lead Engineer</label>
                                                <input
                                                    id={`project-lead-${project.id}`}
                                                    name={`project-lead-${project.id}`}
                                                    className="w-full bg-transparent text-sm text-secondary focus:outline-none border-b border-gray-100 pb-1"
                                                    value={project.leadEngineer || ''}
                                                    onChange={(e) => {
                                                        const newProjects = [...data.projects];
                                                        newProjects[index].leadEngineer = e.target.value;
                                                        updateData({ projects: newProjects });
                                                    }}
                                                    placeholder="Name"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor={`project-completion-${project.id}`} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Est. Completion</label>
                                                <input
                                                    id={`project-completion-${project.id}`}
                                                    name={`project-completion-${project.id}`}
                                                    className="w-full bg-transparent text-sm text-secondary focus:outline-none border-b border-gray-100 pb-1"
                                                    value={project.estCompletion || ''}
                                                    onChange={(e) => {
                                                        const newProjects = [...data.projects];
                                                        newProjects[index].estCompletion = e.target.value;
                                                        updateData({ projects: newProjects });
                                                    }}
                                                    placeholder="TBD / Date"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 p-2 rounded-lg">
                                            <label htmlFor={`project-image-${project.id}`} className="sr-only">Image URL</label>
                                            <ImageIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                                            <input
                                                id={`project-image-${project.id}`}
                                                name={`project-image-${project.id}`}
                                                className="w-full bg-transparent text-xs text-secondary focus:outline-none"
                                                value={project.imageUrl || ''}
                                                onChange={(e) => {
                                                    const newProjects = [...data.projects];
                                                    newProjects[index].imageUrl = e.target.value;
                                                    updateData({ projects: newProjects });
                                                }}
                                                placeholder="Image URL (https://...)"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor={`project-desc-${project.id}`} className="sr-only">Description</label>
                                            <textarea
                                                id={`project-desc-${project.id}`}
                                                name={`project-desc-${project.id}`}
                                                className="w-full bg-transparent text-secondary text-sm focus:outline-none resize-y min-h-[5rem]"
                                                value={project.description}
                                                onChange={(e) => {
                                                    const newProjects = [...data.projects];
                                                    newProjects[index].description = e.target.value;
                                                    updateData({ projects: newProjects });
                                                }}
                                                placeholder="Description"
                                            />
                                        </div>
                                        <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                                            <p className="text-[10px] text-blue-700 font-medium flex items-center gap-1">
                                                <Github className="w-3 h-3" /> PROJECT ARCHIVE PATH:
                                            </p>
                                            <code className="text-[10px] text-blue-800 break-all">
                                                /{PROJECTS_BASE_PATH}/{slugify(project.title)}/
                                            </code>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2 border-t border-gray-100">
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor={`project-status-${project.id}`} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lifecycle Stage</label>
                                                <select
                                                    id={`project-status-${project.id}`}
                                                    name={`project-status-${project.id}`}
                                                    className="bg-transparent text-xs text-secondary focus:outline-none cursor-pointer font-medium"
                                                    value={project.status}
                                                    onChange={(e) => {
                                                        const newProjects = [...data.projects];
                                                        newProjects[index].status = e.target.value as any;
                                                        updateData({ projects: newProjects });
                                                    }}
                                                >
                                                    <option value="Concept">Concept</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor={`project-op-status-${project.id}`} className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Operational Status</label>
                                                <select
                                                    id={`project-op-status-${project.id}`}
                                                    name={`project-op-status-${project.id}`}
                                                    className="bg-transparent text-xs text-secondary focus:outline-none cursor-pointer font-medium"
                                                    value={project.operationalStatus}
                                                    onChange={(e) => {
                                                        const newProjects = [...data.projects];
                                                        newProjects[index].operationalStatus = e.target.value as any;
                                                        updateData({ projects: newProjects });
                                                    }}
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="On Hold">On Hold</option>
                                                    <option value="Abandoned">Abandoned</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Technical Specs</label>
                                                <button
                                                    onClick={() => {
                                                        const newProjects = [...data.projects];
                                                        newProjects[index].specs = [...(newProjects[index].specs || []), { label: '', value: '' }];
                                                        updateData({ projects: newProjects });
                                                    }}
                                                    className="text-[10px] text-primary hover:text-blue-700 font-bold uppercase flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Add Spec
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {(project.specs || []).map((spec, sIdx) => (
                                                    <div key={sIdx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg group/spec">
                                                        <label htmlFor={`project-${project.id}-spec-label-${sIdx}`} className="sr-only">Spec Label</label>
                                                        <input
                                                            id={`project-${project.id}-spec-label-${sIdx}`}
                                                            name={`project-${project.id}-spec-label-${sIdx}`}
                                                            className="w-1/3 bg-transparent text-[11px] font-bold text-contrast focus:outline-none"
                                                            value={spec.label}
                                                            onChange={(e) => {
                                                                const newProjects = [...data.projects];
                                                                newProjects[index].specs[sIdx].label = e.target.value;
                                                                updateData({ projects: newProjects });
                                                            }}
                                                            placeholder="Label"
                                                        />
                                                        <div className="w-[1px] h-3 bg-gray-200" />
                                                        <label htmlFor={`project-${project.id}-spec-value-${sIdx}`} className="sr-only">Spec Value</label>
                                                        <input
                                                            id={`project-${project.id}-spec-value-${sIdx}`}
                                                            name={`project-${project.id}-spec-value-${sIdx}`}
                                                            className="flex-grow bg-transparent text-[11px] text-secondary focus:outline-none"
                                                            value={spec.value}
                                                            onChange={(e) => {
                                                                const newProjects = [...data.projects];
                                                                newProjects[index].specs[sIdx].value = e.target.value;
                                                                updateData({ projects: newProjects });
                                                            }}
                                                            placeholder="Value"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newProjects = [...data.projects];
                                                                newProjects[index].specs = newProjects[index].specs.filter((_, i) => i !== sIdx);
                                                                updateData({ projects: newProjects });
                                                            }}
                                                            className="opacity-0 group-hover/spec:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button onClick={() => handleDeleteProject(project.id)} className="text-red-500 hover:text-red-700 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${initStatus[project.id] === 'success' ? 'bg-green-500' :
                                                    initStatus[project.id] === 'error' ? 'bg-red-500' :
                                                        initStatus[project.id] === 'loading' ? 'bg-yellow-500 animate-pulse' :
                                                            'bg-gray-300'
                                                    }`} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                                    {initStatus[project.id] === 'success' ? 'Archive Synced' :
                                                        initStatus[project.id] === 'error' ? 'Sync Failed' :
                                                            initStatus[project.id] === 'loading' ? 'Initializing...' :
                                                                'Archive Status Unknown'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => initializeArchiveFolders(project)}
                                                disabled={initStatus[project.id] === 'loading'}
                                                className="text-[10px] font-bold uppercase tracking-wider bg-surface hover:bg-gray-100 text-contrast px-3 py-1.5 rounded-md border border-gray-200 transition-colors flex items-center gap-1.5"
                                            >
                                                {initStatus[project.id] === 'loading' ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <FolderPlus className="w-3 h-3" />
                                                )}
                                                Initialize Archive
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Meetings */}
                    {activeTab === 'meetings' && (
                        <div className="space-y-12">
                            {/* Recurring Scheduler */}
                            <div className="bg-white border-2 border-primary/20 p-8 rounded-3xl shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <Calendar className="w-6 h-6 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-bold text-contrast">Recurring Scheduler</h2>
                                        <p className="text-xs text-secondary">Bulk generate meeting entries</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Meeting Title</label>
                                        <input
                                            className="w-full bg-surface border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={recurringTitle}
                                            onChange={(e) => setRecurringTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Frequency</label>
                                        <select
                                            className="w-full bg-surface border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                            value={recurringType}
                                            onChange={(e) => setRecurringType(e.target.value as any)}
                                        >
                                            <option value="Daily">Daily</option>
                                            <option value="Weekly">Weekly</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Occurrences</label>
                                        <input
                                            type="number"
                                            className="w-full bg-surface border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                            value={recurringCount}
                                            onChange={(e) => setRecurringCount(parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full bg-surface border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                            value={recurringStartDate}
                                            onChange={(e) => setRecurringStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</label>
                                        <input
                                            type="time"
                                            className="w-full bg-surface border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                            value={recurringTime}
                                            onChange={(e) => setRecurringTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</label>
                                        <input
                                            className="w-full bg-surface border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none"
                                            value={recurringLocation}
                                            onChange={(e) => setRecurringLocation(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateRecurring}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Generate {recurringCount} {recurringType} Meetings
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">Individual Meetings</h3>
                                    <button onClick={handleAddMeeting} className="bg-white hover:bg-gray-50 text-contrast border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                                        <Plus className="w-4 h-4" /> Add Meeting
                                    </button>
                                </div>
                                {data.meetings.map((meeting, index) => (
                                    <div key={meeting.id} className={`bg-white border border-gray-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm transition-all ${meeting.status === 'Cancelled' ? 'border-red-200 bg-red-50/10' : ''}`}>
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="w-full">
                                                <label htmlFor={`meeting-title-${meeting.id}`} className="sr-only">Meeting Title</label>
                                                <textarea
                                                    id={`meeting-title-${meeting.id}`}
                                                    name={`meeting-title-${meeting.id}`}
                                                    className="bg-transparent text-lg font-medium text-contrast placeholder-gray-300 focus:outline-none w-full resize-none"
                                                    rows={1}
                                                    value={meeting.title}
                                                    onChange={(e) => {
                                                        const newMeetings = [...data.meetings];
                                                        newMeetings[index].title = e.target.value;
                                                        updateData({ meetings: newMeetings });
                                                    }}
                                                    placeholder="Meeting Title"
                                                />
                                            </div>
                                            <button onClick={() => handleDeleteMeeting(meeting.id)} className="text-red-500 hover:text-red-700 transition-colors shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</label>
                                                <input
                                                    type="date"
                                                    className="bg-gray-50 rounded px-3 py-2 text-sm text-secondary focus:outline-none"
                                                    value={meeting.date}
                                                    onChange={(e) => {
                                                        const newMeetings = [...data.meetings];
                                                        newMeetings[index].date = e.target.value;
                                                        updateData({ meetings: newMeetings });
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</label>
                                                <input
                                                    type="time"
                                                    className="bg-gray-50 rounded px-3 py-2 text-sm text-secondary focus:outline-none"
                                                    value={meeting.time}
                                                    onChange={(e) => {
                                                        const newMeetings = [...data.meetings];
                                                        newMeetings[index].time = e.target.value;
                                                        updateData({ meetings: newMeetings });
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</label>
                                                <select
                                                    className={`rounded px-3 py-2 text-sm font-bold focus:outline-none ${meeting.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                                    value={meeting.status}
                                                    onChange={(e) => {
                                                        const newMeetings = [...data.meetings];
                                                        newMeetings[index].status = e.target.value as any;
                                                        updateData({ meetings: newMeetings });
                                                    }}
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Location</label>
                                            <input
                                                className="bg-transparent text-sm text-secondary focus:outline-none border-b border-gray-100 pb-2"
                                                value={meeting.location}
                                                onChange={(e) => {
                                                    const newMeetings = [...data.meetings];
                                                    newMeetings[index].location = e.target.value;
                                                    updateData({ meetings: newMeetings });
                                                }}
                                                placeholder="Location"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</label>
                                            <textarea
                                                className="bg-transparent text-sm text-secondary focus:outline-none resize-y min-h-[3rem]"
                                                value={meeting.description}
                                                onChange={(e) => {
                                                    const newMeetings = [...data.meetings];
                                                    newMeetings[index].description = e.target.value;
                                                    updateData({ meetings: newMeetings });
                                                }}
                                                placeholder="Brief Description"
                                            />
                                        </div>

                                        {meeting.status === 'Cancelled' && (
                                            <div className="flex flex-col gap-1 p-3 bg-red-50 rounded-lg border border-red-100">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-red-600">Cancellation Reason</label>
                                                <input
                                                    className="bg-transparent text-sm text-red-800 focus:outline-none placeholder-red-300"
                                                    value={meeting.cancellationReason || ''}
                                                    onChange={(e) => {
                                                        const newMeetings = [...data.meetings];
                                                        newMeetings[index].cancellationReason = e.target.value;
                                                        updateData({ meetings: newMeetings });
                                                    }}
                                                    placeholder="e.g. Inclement weather, school closure..."
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 p-2 rounded-lg">
                                            <ImageIcon className="w-4 h-4 shrink-0" />
                                            <input
                                                className="w-full bg-transparent text-xs text-secondary focus:outline-none"
                                                value={meeting.imageUrl || ''}
                                                onChange={(e) => {
                                                    const newMeetings = [...data.meetings];
                                                    newMeetings[index].imageUrl = e.target.value;
                                                    updateData({ meetings: newMeetings });
                                                }}
                                                placeholder="Image URL (optional)"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team */}
                    {activeTab === 'team' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-secondary uppercase tracking-widest">Team Members / Officers</h3>
                                <button onClick={handleAddOfficer} className="bg-white hover:bg-gray-50 text-contrast border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                                    <Plus className="w-4 h-4" /> Add Officer
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {(data.officers || []).map((officer, index) => (
                                    <div key={officer.id} className="bg-white border border-gray-200 p-6 rounded-2xl flex items-center gap-6 shadow-sm group">
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleMoveOfficer(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                                                title="Move Up"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveOfficer(index, 'down')}
                                                disabled={index === (data.officers?.length || 0) - 1}
                                                className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                                                title="Move Down"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center text-secondary shrink-0 overflow-hidden border border-gray-100">
                                            {officer.imageUrl ? (
                                                <img src={officer.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-6 h-6" />
                                            )}
                                        </div>

                                        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Name</label>
                                                <input
                                                    className="bg-transparent text-sm font-bold text-contrast focus:outline-none border-b border-transparent focus:border-gray-100 pb-1"
                                                    value={officer.name}
                                                    onChange={(e) => {
                                                        const newOfficers = [...data.officers];
                                                        newOfficers[index].name = e.target.value;
                                                        updateData({ officers: newOfficers });
                                                    }}
                                                    placeholder="Officer Name"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Role</label>
                                                <input
                                                    className="bg-transparent text-sm text-secondary focus:outline-none border-b border-transparent focus:border-gray-100 pb-1"
                                                    value={officer.role}
                                                    onChange={(e) => {
                                                        const newOfficers = [...data.officers];
                                                        newOfficers[index].role = e.target.value;
                                                        updateData({ officers: newOfficers });
                                                    }}
                                                    placeholder="e.g. President"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</label>
                                                <input
                                                    className="bg-transparent text-sm text-secondary focus:outline-none border-b border-transparent focus:border-gray-100 pb-1"
                                                    value={officer.email}
                                                    onChange={(e) => {
                                                        const newOfficers = [...data.officers];
                                                        newOfficers[index].email = e.target.value;
                                                        updateData({ officers: newOfficers });
                                                    }}
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                        </div>

                                        <button onClick={() => handleDeleteOfficer(officer.id)} className="text-red-400 hover:text-red-600 transition-colors p-2">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {(!data.officers || data.officers.length === 0) && (
                                <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-3xl">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-contrast">No officers listed</h3>
                                    <p className="text-secondary mt-2">Click "Add Officer" to begin building the team directory.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings */}
                    {activeTab === 'settings' && (
                        <div className="max-w-xl space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="settings-calendar-url" className="text-xs font-medium text-secondary uppercase tracking-wide">Google Calendar URL</label>
                                <input
                                    id="settings-calendar-url"
                                    name="settings-calendar-url"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-contrast focus:outline-none focus:border-primary transition-colors shadow-sm"
                                    value={data.googleCalendarUrl}
                                    onChange={(e) => updateData({ googleCalendarUrl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="settings-discord-url" className="text-xs font-medium text-secondary uppercase tracking-wide">Discord Invite URL</label>
                                <input
                                    id="settings-discord-url"
                                    name="settings-discord-url"
                                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-contrast focus:outline-none focus:border-primary transition-colors shadow-sm"
                                    value={data.discordUrl}
                                    onChange={(e) => updateData({ discordUrl: e.target.value })}
                                />
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-contrast mb-4 flex items-center gap-2">
                                    <CloudSync className="w-4 h-4 text-primary" /> Data Persistence & Sync Help
                                </h3>
                                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 space-y-4">
                                    <p className="text-sm font-medium text-blue-900">How saving works:</p>
                                    <ul className="text-xs text-blue-800 space-y-3">
                                        <li className="flex gap-2">
                                            <span className="font-bold">1. Local Buffer:</span>
                                            Any change you make (editing text, adding projects) is immediately stored in your browser's local storage. This is your "draft" state.
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="font-bold">2. Auto-Sync:</span>
                                            While in the Admin Portal, the system will attempt to automatically push your changes to the GitHub Archive repository every 10 seconds after your last edit.
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="font-bold">3. Manual Push:</span>
                                            Use the <strong>"Save to GitHub"</strong> button at the top right to force an immediate update. This is the only way to ensure the public website sees your changes.
                                        </li>
                                        <li className="flex gap-2">
                                            <span className="font-bold">4. Right-Click Editing:</span>
                                            You don't need to be in this portal to edit text. When logged in, navigate to any page and <strong>Right-Click</strong> on headlines or descriptions to edit them in-place.
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-contrast mb-4 flex items-center gap-2">
                                    <Github className="w-4 h-4" /> External Content Strategy
                                </h3>
                                <div className="bg-surface rounded-xl p-6 border border-gray-100 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-contrast">Archive Repository (Single Source of Truth)</p>
                                            <p className="text-xs text-secondary mt-1">Currently linked to: <code className="bg-gray-100 px-1 rounded">{ARCHIVE_REPO}</code></p>
                                        </div>
                                        <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Active</div>
                                    </div>

                                    <div className="text-xs text-secondary leading-relaxed bg-white p-4 rounded-lg border border-gray-50">
                                        <p className="font-bold mb-2 flex items-center gap-1 text-primary">
                                            <RefreshCw className="w-3 h-3" /> Sync Instructions:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-2">
                                            <li>Create a folder for each update: <code className="text-primary">/projects/[project-slug]/YYYY-MM-DD-Title/</code></li>
                                            <li>Inside each update folder, add a <code className="text-primary">desc.txt</code> for the log text.</li>
                                            <li>Add images/videos to the same update folder for the gallery.</li>
                                        </ol>
                                    </div>

                                    <p className="text-[10px] text-gray-400 italic">
                                        Note: To change the repository, update the <code>ARCHIVE_REPO</code> constant in <code>constants.ts</code>.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                <h3 className="text-sm font-bold text-contrast mb-4 flex items-center gap-2">
                                    <Github className="w-4 h-4" /> Personal Access Token
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-xs text-secondary">
                                        Enter a GitHub Personal Access Token (PAT) with <code>repo</code> permissions to enable "Self-Healing" folder creation. This token is stored only in your browser's <code>localStorage</code>.
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="settings-github-token" className="sr-only">GitHub PAT</label>
                                        <div className="flex gap-2">
                                            <input
                                                id="settings-github-token"
                                                name="settings-github-token"
                                                type="password"
                                                className="flex-grow bg-white border border-gray-200 rounded-lg p-3 text-sm text-contrast focus:outline-none focus:border-primary transition-colors shadow-sm"
                                                value={githubToken}
                                                onChange={(e) => handleTokenChange(e.target.value)}
                                                placeholder="ghp_xxxxxxxxxxxx"
                                            />
                                            {githubToken && (
                                                <button
                                                    onClick={() => handleTokenChange('')}
                                                    className="px-4 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminPortal;