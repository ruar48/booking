import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { index as rentalItemsIndex, store } from '@/routes/rental-items';

export default function RentalsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sku: '',
        category: '',
        rate: 0,
        hourly_rate: '',
        total_quantity: 0,
        status: 'active' as 'active' | 'inactive',
        description: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url);
    };

    return (
        <>
            <Head title="New Rental Item" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="New Rental Item"
                    description="Add equipment to the rental catalog"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
                    <Card>
                        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    required
                                />
                                <InputError message={errors.sku} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                />
                                <InputError message={errors.category} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v) =>
                                        setData('status', v as 'active' | 'inactive')
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rate">Rate (per rental)</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.rate}
                                    onChange={(e) => setData('rate', Number(e.target.value))}
                                    required
                                />
                                <InputError message={errors.rate} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hourly_rate">Hourly rate (optional)</Label>
                                <Input
                                    id="hourly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.hourly_rate}
                                    onChange={(e) => setData('hourly_rate', e.target.value)}
                                    placeholder="Leave blank to disable hourly rentals"
                                />
                                <InputError message={errors.hourly_rate} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="total_quantity">Total quantity</Label>
                                <Input
                                    id="total_quantity"
                                    type="number"
                                    min="0"
                                    value={data.total_quantity}
                                    onChange={(e) =>
                                        setData('total_quantity', Number(e.target.value))
                                    }
                                    required
                                />
                                <InputError message={errors.total_quantity} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={rentalItemsIndex()}>Back</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create rental item
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

RentalsCreate.layout = {
    breadcrumbs: [
        { title: 'Rentals', href: rentalItemsIndex() },
        { title: 'New', href: rentalItemsIndex() },
    ],
};
