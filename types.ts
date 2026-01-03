
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
    imageUrl?: string;
}

export interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    status: 'Active' | 'Cancelled';
    cancellationReason?: string;
    imageUrl?: string;
}

export interface SiteContent {
    homeHeroTitle: string;
    homeHeroSubtitle: string;
    missionTitle: string;
    missionStatement: string;
    missionTeamTitle: string;
    missionTeamSubtitle: string;
    meetingsTitle: string;
    meetingsSubtitle: string;
    projectsTitle: string;
    projectsSubtitle: string;
    projectsMarquee: string;
    contactTitle: string;
    contactSubtitle: string;
    navbarTitle: string;
    navbarSubtitle: string;
    marqueeText: string;
    meetingsMarquee: string;
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

export interface MissionPillar {
    id: string;
    icon: string;
    title: string;
    description: string;
    imageUrl?: string;
}

export interface ClubData {
    projects: Project[];
    officers: Officer[];
    meetings: Meeting[];
    siteContent: SiteContent;
    pillars: Pillar[];
    tickerItems: TickerItem[];
    missionPillars: MissionPillar[];
    googleCalendarUrl: string;
    discordUrl: string;
}
