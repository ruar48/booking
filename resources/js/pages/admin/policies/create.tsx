import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { index as policiesIndex, store } from '@/routes/admin/policies';

export default function AdminPoliciesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        placement: 'checkout' as 'checkout' | 'general',
        body: '',
        is_active: true,
        sort_order: 0,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(store().url);
    };

    return (
        <>
            <Head title="New policy" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="New policy"
                    description="Add a booking rule, payment term, or agreement players must accept"
                />
                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
                    <Card>
                        <CardContent className="grid gap-4 pt-6">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Payment & Refund Policy"
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Shown at</Label>
                                <Select
                                    value={data.placement}
                                    onValueChange={(v) => setData('placement', v as 'checkout' | 'general')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="checkout">Booking checkout (payment step)</SelectItem>
                                        <SelectItem value="general">Not shown yet</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">
                                    "Booking checkout" policies appear while players choose a payment method, for both
                                    court bookings and open play.
                                </p>
                                <InputError message={errors.placement} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="body">Policy text</Label>
                                <Textarea
                                    id="body"
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    rows={8}
                                    placeholder={'One point per line, e.g.\nConfirmed only once payment is received in full.\nNon-refundable once confirmed.'}
                                    required
                                />
                                <p className="text-muted-foreground text-xs">
                                    Each line is shown as its own bullet point to players.
                                </p>
                                <InputError message={errors.body} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Display order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    className="max-w-[140px]"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', Number(e.target.value))}
                                />
                                <p className="text-muted-foreground text-xs">
                                    Lower numbers are shown first when multiple policies share a placement.
                                </p>
                                <InputError message={errors.sort_order} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Active (visible to players)</Label>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <Link href={policiesIndex()}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create policy
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminPoliciesCreate.layout = {
    breadcrumbs: [
        { title: 'Policies', href: policiesIndex() },
        { title: 'New', href: policiesIndex() },
    ],
};
