import { Head, Link, useForm } from '@inertiajs/react';
import { Boxes, FileText, Package, Tag } from 'lucide-react';
import { FormEvent } from 'react';

import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { index as productsIndex, store } from '@/routes/products';

export default function InventoryCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sku: '',
        category: '',
        price: 0,
        cost: '',
        stock_quantity: 0,
        low_stock_threshold: 5,
        status: 'active' as 'active' | 'inactive' | 'discontinued',
        description: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url);
    };

    return (
        <>
            <Head title="New Product" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="New Product"
                    description="Add a product to your inventory"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-3xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="size-4" />
                                Product details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Pickleball paddle"
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
                                    placeholder="e.g. PB-PADDLE-001"
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
                                    placeholder="e.g. Equipment"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                />
                                <InputError message={errors.category} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
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
                                    <SelectTrigger className="w-full sm:w-56">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="size-4" />
                                Pricing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <div className="relative">
                                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">
                                        ₱
                                    </span>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-7"
                                        value={data.price}
                                        onChange={(e) =>
                                            setData('price', Number(e.target.value))
                                        }
                                        required
                                    />
                                </div>
                                <InputError message={errors.price} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cost">Cost</Label>
                                <div className="relative">
                                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm">
                                        ₱
                                    </span>
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="pl-7"
                                        value={data.cost}
                                        onChange={(e) => setData('cost', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.cost} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Boxes className="size-4" />
                                Stock
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="size-4" />
                                Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <Label htmlFor="description" className="sr-only">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Optional notes about this product..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href={productsIndex()}>Back</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create product
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

InventoryCreate.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: productsIndex() },
        { title: 'New', href: productsIndex() },
    ],
};
