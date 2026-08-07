import { Head } from '@inertiajs/react';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import { checkout as posCheckout } from '@/routes/pos';
import type { SalesReport } from '@/types/pos';

type Props = {
    report: SalesReport;
    filters: {
        start: string;
        end: string;
    };
};

export default function PosReports({ report, filters }: Props) {
    const maxRevenue = Math.max(1, ...report.revenue_by_day.map((point) => point.revenue));

    return (
        <>
            <Head title="Sales Report" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Sales Report"
                    description={`${formatDate(filters.start)} – ${formatDate(filters.end)}`}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">
                                Total revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold">
                                {formatCurrency(report.total_revenue)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">
                                Completed sales
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold">
                                {report.total_sales_count}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {report.revenue_by_day.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No sales in this period.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {report.revenue_by_day.map((point) => (
                                    <div key={point.date} className="flex items-center gap-3">
                                        <span className="w-24 shrink-0 text-xs text-muted-foreground">
                                            {formatDate(point.date)}
                                        </span>
                                        <div className="h-4 flex-1 rounded bg-muted">
                                            <div
                                                className="h-4 rounded bg-primary"
                                                style={{
                                                    width: `${(point.revenue / maxRevenue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-20 shrink-0 text-right text-xs font-medium">
                                            {formatCurrency(point.revenue)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {report.top_products.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No product sales in this period.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Units sold</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.top_products.map((product) => (
                                        <TableRow key={product.product_id}>
                                            <TableCell>{product.product_name}</TableCell>
                                            <TableCell className="text-right">
                                                {product.quantity_sold}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(product.revenue)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PosReports.layout = {
    breadcrumbs: [{ title: 'Sales Report', href: posCheckout() }],
};
