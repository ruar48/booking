/** Who runs the venue (App\Support\BusinessIdentity), as the legal pages state it. */
export type BusinessIdentity = {
    name: string;
    legal_name: string | null;
    registration_number: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    dpo_name: string | null;
    /** Falls back to the venue's email when no DPO email is set. */
    dpo_email: string | null;
};

export type LegalDocumentMeta = {
    version: string;
    effectiveAt: string;
};

export type FaqLink = { label: string; href: string } | { label: string; action: 'cookie-settings' };

export type FaqQuestion = {
    id: string;
    question: string;
    /** Paragraphs separated by a blank line. */
    answer: string;
    bullets?: string[];
    link?: FaqLink;
};

export type FaqTopic = {
    id: string;
    title: string;
    description: string;
    questions: FaqQuestion[];
};
