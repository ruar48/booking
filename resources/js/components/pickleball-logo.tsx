export function PickleballLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden
        >
            <circle cx="16" cy="16" r="14" fill="currentColor" />
            <circle cx="10" cy="11" r="2" fill="white" fillOpacity="0.9" />
            <circle cx="16" cy="9" r="2" fill="white" fillOpacity="0.9" />
            <circle cx="22" cy="11" r="2" fill="white" fillOpacity="0.9" />
            <circle cx="9" cy="17" r="2" fill="white" fillOpacity="0.9" />
            <circle cx="23" cy="17" r="2" fill="white" fillOpacity="0.9" />
            <circle cx="12" cy="22" r="2" fill="white" fillOpacity="0.9" />
            <circle cx="20" cy="22" r="2" fill="white" fillOpacity="0.9" />
        </svg>
    );
}
