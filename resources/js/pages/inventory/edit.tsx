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
import { index as productsIndex, update } from '@/routes/products';
import type { Product } from '@/types/inventory';

type Props = {
    product: Product;
};

export default function InventoryEdit({ product }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        club_id: product.club_id,
        name: product.name,
        sku: product.sku,
        category: product.category ?? '',
        price: product.price,
        cost: product.cost ?? '',
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        status: product.status,
        description: product.description ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(update(product).url);
    };

    return (
        <>
            <Head title={`Edit ${product.name}`} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={`Edit ${product.name}`}
                    description="Update pricing, stock, and status"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
                    <Card>
                        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
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
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                    required
                                />
                                <InputError message={errors.sku} />
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
                                        setData(
                                            'status',
                                            v as 'active' | 'inactive' | 'discontinued',
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="discontinued">
                                            Discontinued
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.price}
                                    onChange={(e) => setData('price', Number(e.target.value))}
                                    required
                                />
                                <InputError message={errors.price} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cost">Cost</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.cost}
                                    onChange={(e) => setData('cost', e.target.value)}
                                />
                                <InputError message={errors.cost} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="stock_quantity">Stock quantity</Label>
                                <Input
                                    id="stock_quantity"
                                    type="number"
                                    min="0"
                                    value={data.stock_quantity}
                                    onChange={(e) =>
                                        setData('stock_quantity', Number(e.target.value))
                                    }
                                    required
                                />
                                <InputError message={errors.stock_quantity} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="low_stock_threshold">Low stock threshold</Label>
                                <Input
                                    id="low_stock_threshold"
                                    type="number"
                                    min="0"
                                    value={data.low_stock_threshold}
                                    onChange={(e) =>
                                        setData('low_stock_threshold', Number(e.target.value))
                                    }
                                    required
                                />
                                <InputError message={errors.low_stock_threshold} />
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
                            <Link href={productsIndex()}>Back</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

InventoryEdit.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: productsIndex() },
        { title: 'Edit', href: productsIndex() },
    ],
};
