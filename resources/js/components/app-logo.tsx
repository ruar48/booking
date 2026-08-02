import { BrandLogo } from '@/components/brand-logo';
import { brand } from '@/lib/brand';

export default function AppLogo() {
    return (
        <>
            <BrandLogo imageClassName="size-8" />
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold text-sidebar-foreground">
                    {brand.name}
                </span>
            </div>
        </>
    );
}
