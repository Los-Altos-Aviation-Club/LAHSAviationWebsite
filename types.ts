
export interface Spec {
    label: string;
    value: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    status: 'In Progress' | 'Completed' | 'Concept';
    operationalStatus: 'Active' | 'On Hold' | 'Abandoned' | 'Completed';
    imageUrl?: string;
    specs: Spec[];
    leadEngineer?: string;
    estCompletion?: string;
    completionDate?: string; // Add this to match AdminPortal.tsx usage
}

export interface Officer {
    id: string;
    name: string;
    role: string;
    email: string;
}

export interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    imageUrl?: string;
}

export interface SiteContent {
    homeHeroTitle: string;
    homeHeroSubtitle: string;
    missionStatement: string;
    contactTitle: string;
    contactSubtitle: string;
}

export interface Pillar {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
}

export interface TickerItem {
    id: string;
    label: string;
    value: string;
    type: 'wind' | 'zap' | 'users';
}

export interface ClubData {
    projects: Project[];
    officers: Officer[];
    events: Event[];
    siteContent: SiteContent;
    pillars: Pillar[];
    tickerItems: TickerItem[];
    googleCalendarUrl: string;
    discordUrl: string;
}
