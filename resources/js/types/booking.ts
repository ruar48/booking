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

export type OpenPlaySession = {
    id: number;
    title: string;
    description?: string | null;
    starts_at: string;
    ends_at?: string | null;
    registration_closes_at?: string | null;
    is_registration_closed?: boolean;
    location?: string | null;
    price_per_player?: number | null;
    max_players?: number | null;
    target_score: number;
    bracket_format: 'single_elimination' | 'double_elimination' | 'round_robin' | null;
    bracket_generation: 'automatic' | 'random' | 'manual';
    bracket_visible: boolean;
    team_size: 'singles' | 'doubles';
    skill_level?: string;
    registrations_count?: number;
    registrations?: OpenPlayRegistration[];
    matches?: OpenPlayMatch[];
};

export type OpenPlayRegistration = {
    id: number;
    open_play_session_id: number;
    player_id: number;
    partner_player_id: number | null;
    payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';
    amount?: number | string | null;
    player?: Player;
    partner?: Player | null;
    creator?: { id: number; name: string } | null;
    created_at?: string;
};

export type OpenPlayMatch = {
    id: number;
    open_play_session_id: number;
    entry1_id: number | null;
    entry2_id: number | null;
    entry1_score: number | null;
    entry2_score: number | null;
    winner_registration_id: number | null;
    round: number;
    bracket_position: number | null;
    bracket_side: 'winners' | 'losers' | 'final' | null;
    status: 'scheduled' | 'in_progress' | 'completed' | 'walkover' | 'forfeit' | 'cancelled';
    entry1?: OpenPlayRegistration | null;
    entry2?: OpenPlayRegistration | null;
    winner?: OpenPlayRegistration | null;
};

export type BookedSlot = {
    id: number;
    resource_id: number;
    starts_at: string;
    ends_at: string;
    resource?: Pick<Resource, 'id' | 'name'>;
};

export type DateOverride = {
    id: number;
    date: string;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
    reason?: string | null;
};

export type Player = {
    id: number;
    user_id: number;
    skill_rating: number;
    experience_level: string;
    playing_hand?: string | null;
    gender?: string | null;
    birthdate?: string | null;
    age?: number | null;
    phone?: string | null;
    address?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    bio?: string | null;
    is_active: boolean;
    user?: { id: number; name: string; email: string };
    rankings?: Ranking[];
    achievements?: PlayerAchievement[];
    coaches?: Coach[];
    created_at?: string;
    updated_at?: string;
};

export type Resource = {
    id: number;
    sport: 'pickleball' | 'billiards';
    name: string;
    resource_number: string;
    surface_type: string;
    location_type: string;
    has_lighting: boolean;
    hourly_rate: number;
    status: string;
    photos?: string[] | null;
    description?: string | null;
    metadata: Record<string, unknown> | null;
    bookings?: ResourceBooking[];
    created_at?: string;
    updated_at?: string;
};

export type ResourceBooking = {
    id: number;
    booking_group_id?: string | null;
    resource_id: number;
    user_id: number;
    starts_at: string;
    ends_at: string;
    status: string;
    payment_status?: string;
    amount?: number;
    notes?: string | null;
    cancellation_reason?: string | null;
    approved_by?: number | null;
    created_by?: number | null;
    resource?: Resource;
    user?: { id: number; name: string; email: string };
    approver?: { id: number; name: string } | null;
    creator?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
};

export type BookingStats = {
    upcoming: number;
    total: number;
    unpaid: number;
    paid: number;
};

export type Tournament = {
    id: number;
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
    court?: Resource | null;
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
    elo_rating: number;
    rank_position?: number;
    player?: Player;
};

export type Coach = {
    id: number;
    user_id: number;
    bio?: string | null;
    specialties?: string[] | null;
    is_active: boolean;
    user?: { id: number; name: string; email?: string };
    players?: Player[];
    training_sessions?: TrainingSession[];
};

export type TrainingSession = {
    id: number;
    coach_id: number;
    court_id?: number | null;
    title: string;
    description?: string | null;
    scheduled_at: string;
    duration_minutes: number;
    notes?: string | null;
    status: string;
    coach?: Coach;
    court?: Resource | null;
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
    title: string;
    content: string;
    type: 'general' | 'open_play' | 'discount' | 'maintenance';
    open_play_session_id?: number | null;
    image_path?: string | null;
    image_source?: 'upload' | 'auto_qr' | null;
    image_url?: string | null;
    show_on_dashboard: boolean;
    show_on_home: boolean;
    show_on_player_portal: boolean;
    is_published: boolean;
    published_at?: string | null;
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
    payable?: ResourceBooking | Tournament | Record<string, unknown>;
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
    group: string;
    key: string;
    value: unknown;
};

export type Policy = {
    id: number;
    title: string;
    slug: string;
    placement: 'checkout' | 'general';
    body: string;
    is_active: boolean;
    version: number;
    sort_order: number;
    updated_by?: number | null;
    updatedBy?: { id: number; name: string } | null;
    created_at?: string;
    updated_at?: string;
};

export type VenueProfile = {
    description?: string | null;
    phone?: string | null;
    email?: string | null;
    address_line_1?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    amenities?: string[] | null;
    gallery?: string[] | null;
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
    revenue_last_month: number;
    bookings_yesterday: number;
    bookings_this_month: number;
    members_new_this_week: number;
    courts_available: number;
};

export type BookingStatusBreakdownPoint = {
    status: string;
    count: number;
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
    resourceAvailability: Resource[];
    revenueChart: RevenueChartPoint[];
    bookingStatusBreakdown: BookingStatusBreakdownPoint[];
    recentBookings?: ResourceBooking[];
    openPlaySessions?: OpenPlaySession[];
    announcements?: Announcement[];
};

export type SearchResults = {
    players: Player[];
    courts: Resource[];
    tournaments: Pick<Tournament, 'id' | 'name' | 'slug' | 'starts_at'>[];
    coaches: Coach[];
};
