import { brand } from '@/lib/brand';

type BrandLogoProps = {
    className?: string;
    imageClassName?: string;
    showName?: boolean;
    nameClassName?: string;
};

export function BrandLogo({
    className = '',
    imageClassName = 'size-10',
    showName = false,
    nameClassName = '',
}: BrandLogoProps) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <img
                src={brand.logo}
                alt={brand.name}
                className={`object-contain ${imageClassName}`}
            />
            {showName && (
                <span className={`font-bold tracking-tight ${nameClassName}`}>
                    {brand.name}
                </span>
            )}
        </div>
    );
}
