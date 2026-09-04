import { BrandLogo } from '@/components/brand-logo';
import { brand } from '@/lib/brand';

export default function AppLogo() {
    return (
        <>
            <BrandLogo imageClassName="size-9" />
            <div className="ml-1 grid flex-1 text-left">
                <span className="text-sidebar-foreground truncate text-sm leading-tight font-bold">
                    {brand.name}
                </span>
                <span className="text-muted-foreground truncate text-xs leading-tight">
                    {brand.tagline}
                </span>
            </div>
        </>
    );
}
