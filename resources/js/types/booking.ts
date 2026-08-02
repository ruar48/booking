export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Club = {
    id: number;
    name: string;
    slug: string;
    logo?: string | null;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address_line_1?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    operating_hours?: Record<string, { open: string; close: string }> | null;
    amenities?: string[] | null;
    gallery?: string[] | null;
    is_active: boolean;
    courts_count?: number;
    players_count?: number;
    tournaments_count?: number;
    coaches_count?: number;
    created_at?: string;
    updated_at?: string;
};

export type ClubEvent = {
    id: number;
    club_id: number;
    title: string;
    description?: string | null;
    starts_at: string;
    ends_at?: string | null;
    location?: string | null;
    price_per_player?: number | null;
    max_players?: number | null;
    skill_level?: string;
};

export type BookedSlot = {
    id: number;
    court_id: number;
    starts_at: string;
    ends_at: string;
    court?: Pick<Court, 'id' | 'name'>;
};

export type Player = {
    id: number;
    user_id: number;
    club_id?: number | null;
    skill_rating: number;
    experience_level: string;
    playing_hand?: string | null;
    gender?: string | null;
    birthdate?: string | null;
    phone?: string | null;
    address?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    bio?: string | null;
    is_active: boolean;
    user?: { id: number; name: string; email: string };
    club?: Club | null;
    rankings?: Ranking[];
    achievements?: PlayerAchievement[];
    coaches?: Coach[];
    created_at?: string;
    updated_at?: string;
};

export type Court = {
    id: number;
    club_id: number;
    name: string;
    court_number: string;
    surface_type: string;
    location_type: string;
    has_lighting: boolean;
    hourly_rate: number;
    status: string;
    photos?: string[] | null;
    description?: string | null;
    club?: Club;
    bookings?: CourtBooking[];
    created_at?: string;
    updated_at?: string;
};

export type CourtBooking = {
    id: number;
    court_id: number;
    user_id: number;
    starts_at: string;
    ends_at: string;
    status: string;
    payment_status?: string;
    amount?: number;
    notes?: string | null;
    cancellation_reason?: string | null;
    approved_by?: number | null;
    court?: Court;
    user?: { id: number; name: string; email: string };
    approver?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
};

export type Tournament = {
    id: number;
    club_id: number;
    name: string;
    slug: string;
    description?: string | null;
    poster?: string | null;
    entry_fee: number;
    max_players: number;
    format: string;
    status: string;
    registration_opens_at?: string | null;
    registration_closes_at?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    created_by?: number;
    club?: Club;
    creator?: { id: number; name: string };
    categories?: TournamentCategory[];
    registrations?: TournamentRegistration[];
    created_at?: string;
    updated_at?: string;
};

export type TournamentCategory = {
    id: number;
    tournament_id: number;
    name: string;
    description?: string | null;
};

export type TournamentRegistration = {
    id: number;
    tournament_id: number;
    player_id: number;
    player?: Player;
    status?: string;
    created_at?: string;
};

export type GameMatch = {
    id: number;
    tournament_id?: number | null;
    court_id?: number | null;
    player1_id: number;
    player2_id: number;
    winner_id?: number | null;
    status: string;
    result_type?: string | null;
    round?: string | null;
    scheduled_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    tournament?: Tournament | null;
    court?: Court | null;
    player1?: Player;
    player2?: Player;
    winner?: Player | null;
    sets?: MatchSet[];
    referee?: { id: number; name: string } | null;
};

export type MatchSet = {
    id: number;
    set_number: number;
    player1_score: number;
    player2_score: number;
};

export type Ranking = {
    id: number;
    player_id: number;
    club_id: number;
    elo_rating: number;
    rank_position?: number;
    player?: Player;
    club?: Club;
};

export type Coach = {
    id: number;
    user_id: number;
    club_id: number;
    bio?: string | null;
    specialties?: string[] | null;
    is_active: boolean;
    user?: { id: number; name: string; email?: string };
    club?: Club;
    players?: Player[];
    training_sessions?: TrainingSession[];
};

export type TrainingSession = {
    id: number;
    coach_id: number;
    club_id: number;
    court_id?: number | null;
    title: string;
    description?: string | null;
    scheduled_at: string;
    duration_minutes: number;
    notes?: string | null;
    status: string;
    coach?: Coach;
    club?: Club;
    court?: Court | null;
    attendance?: TrainingAttendance[];
    drills?: TrainingDrill[];
};

export type TrainingAttendance = {
    id: number;
    player_id: number;
    status: string;
    player?: Player;
};

export type TrainingDrill = {
    id: number;
    name: string;
    description?: string | null;
    duration_minutes?: number;
};

export type Announcement = {
    id: number;
    club_id?: number | null;
    title: string;
    content: string;
    show_on_dashboard: boolean;
    show_on_home: boolean;
    show_on_player_portal: boolean;
    is_published: boolean;
    published_at?: string | null;
    club?: Club | null;
    created_at?: string;
    updated_at?: string;
};

export type Payment = {
    id: number;
    user_id: number;
    payable_type: string;
    payable_id: number;
    amount: number;
    status: string;
    payment_method?: string | null;
    paid_at?: string | null;
    notes?: string | null;
    user?: { id: number; name: string; email: string };
    payable?: CourtBooking | Tournament | Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
};

export type PlayerAchievement = {
    id: number;
    title: string;
    description?: string | null;
    achieved_at?: string | null;
};

export type AuditLog = {
    id: number;
    user_id?: number | null;
    action: string;
    auditable_type?: string | null;
    auditable_id?: number | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    ip_address?: string | null;
    user_agent?: string | null;
    user?: { id: number; name: string; email: string } | null;
    created_at: string;
};

export type Setting = {
    id: number;
    club_id?: number | null;
    group: string;
    key: string;
    value: unknown;
};

export type UserSession = {
    id: string;
    ip_address?: string | null;
    user_agent?: string | null;
    device: string;
    last_active_at: string;
    is_current_device: boolean;
};

export type DashboardStats = {
    players: number;
    active_players: number;
    courts: number;
    bookings_today: number;
    pending_bookings: number;
    upcoming_tournaments: number;
    matches_scheduled: number;
    revenue_this_month: number;
};

export type DashboardMatchStats = {
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    total: number;
};

export type RevenueChartPoint = {
    year: number;
    month: number;
    total: number;
};

export type DashboardData = {
    stats: DashboardStats;
    courtAvailability: Court[];
    revenueChart: RevenueChartPoint[];
    recentBookings?: CourtBooking[];
    openPlaySessions?: ClubEvent[];
    announcements?: Announcement[];
};

export type SearchResults = {
    clubs: Pick<Club, 'id' | 'name' | 'slug' | 'city'>[];
    players: Player[];
    courts: Court[];
    tournaments: Pick<Tournament, 'id' | 'name' | 'slug' | 'starts_at'>[];
    coaches: Coach[];
};
