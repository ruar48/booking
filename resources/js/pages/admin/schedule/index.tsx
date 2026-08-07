import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { FormEvent, useState } from 'react';

import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { destroy as destroyBlock, store as storeBlock } from '@/routes/admin/schedule/blocks';
import { toggle as toggleRecurringLock } from '@/routes/admin/schedule/recurring-locks';
import { index as scheduleIndex, updateHours } from '@/routes/admin/schedule';
import type { RecurringScheduleLock, Resource, ScheduleBlock } from '@/types/booking';

type DayHours = {
    open: string | null;
    close: string | null;
    closed: boolean;
};

type OperatingHours = Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    DayHours
>;

const DAYS: { key: keyof OperatingHours; label: string; short: string }[] = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

// Matches JS Date#getDay() / PHP Carbon::dayOfWeek (0 = Sunday .. 6 = Saturday).
const DAY_OF_WEEK: Record<keyof OperatingHours, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

const DEFAULT_DAY: DayHours = { open: '07:00', close: '23:00', closed: false };

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return format(new Date().setHours(hours, minutes, 0, 0), 'h:mm a');
}

/**
 * Preview the exact hourly slots this day's open/close range produces on the
 * customer booking grid, so admin sees "7:30 - 8:30, 8:30 - 9:30, ..." rather
 * than guessing what an open/close time will turn into.
 */
function previewSlots(day: DayHours): { start: number; end: number }[] {
    if (day.closed || !day.open || !day.close) {
        return [];
    }

    const openMinutes = toMinutes(day.open);
    const closeMinutes = toMinutes(day.close);
    const slots: { start: number; end: number }[] = [];

    for (let start = openMinutes; start + 60 <= closeMinutes; start += 60) {
        slots.push({ start, end: start + 60 });
    }

    return slots;
}

function toTimeString(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function findRecurringLock(
    locks: RecurringScheduleLock[],
    resourceId: number,
    dayOfWeek: number,
    slot: { start: number; end: number },
): RecurringScheduleLock | undefined {
    const start = toTimeString(slot.start);
    const end = toTimeString(slot.end);

    return locks.find(
        (lock) =>
            (lock.resource_id === resourceId || lock.resource_id === null) &&
            lock.day_of_week === dayOfWeek &&
            lock.starts_at.slice(0, 5) === start &&
            lock.ends_at.slice(0, 5) === end,
    );
}

function defaultOperatingHours(existing?: Partial<OperatingHours> | null): OperatingHours {
    const hours = {} as OperatingHours;

    for (const { key } of DAYS) {
        const day = existing?.[key];
        hours[key] = {
            open: day?.open ?? DEFAULT_DAY.open,
            close: day?.close ?? DEFAULT_DAY.close,
            closed: day?.closed ?? false,
        };
    }

    return hours;
}

type Props = {
    operatingHours: Partial<OperatingHours> | null;
    resources: Resource[];
    scheduleBlocks: ScheduleBlock[];
    recurringLocks: RecurringScheduleLock[];
};

export default function AdminScheduleIndex({ operatingHours, resources, scheduleBlocks, recurringLocks }: Props) {
    const hoursForm = useForm({
        operating_hours: defaultOperatingHours(operatingHours),
    });

    const blockForm = useForm({
        resource_id: '' as string | number,
        date: '',
        starts_at: '',
        ends_at: '',
        reason: '',
    });

    const [selectedDay, setSelectedDay] = useState<keyof OperatingHours>('monday');
    const [blockDate, setBlockDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [blockErrors, setBlockErrors] = useState<Record<string, string>>({});
    const [blockProcessing, setBlockProcessing] = useState(false);
    const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

    const toggleLock = (resourceId: number, slot: { start: number; end: number }) => {
        const slotKey = `${resourceId}-${slot.start}-${slot.end}`;
        setTogglingSlot(slotKey);

        router.post(
            toggleRecurringLock().url,
            {
                resource_id: resourceId,
                day_of_week: DAY_OF_WEEK[selectedDay],
                starts_at: toTimeString(slot.start),
                ends_at: toTimeString(slot.end),
                reason: 'Reserved by owner',
            },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setTogglingSlot(null),
            },
        );
    };

    const submitHours = (event: FormEvent) => {
        event.preventDefault();
        hoursForm.put(updateHours().url, { preserveScroll: true });
    };

    const updateDay = (day: keyof OperatingHours, patch: Partial<DayHours>) => {
        hoursForm.setData('operating_hours', {
            ...hoursForm.data.operating_hours,
            [day]: { ...hoursForm.data.operating_hours[day], ...patch },
        });
    };

    const submitBlock = (event: FormEvent) => {
        event.preventDefault();

        if (!blockDate || !startTime || !endTime) {
            return;
        }

        setBlockProcessing(true);

        router.post(
            storeBlock().url,
            {
                resource_id: blockForm.data.resource_id || null,
                starts_at: `${blockDate}T${startTime}:00`,
                ends_at: `${blockDate}T${endTime}:00`,
                reason: blockForm.data.reason || null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    blockForm.reset();
                    setBlockDate('');
                    setStartTime('');
                    setEndTime('');
                    setBlockErrors({});
                },
                onError: (errors) => setBlockErrors(errors as Record<string, string>),
                onFinish: () => setBlockProcessing(false),
            },
        );
    };

    const removeBlock = (block: ScheduleBlock) => {
        router.delete(destroyBlock(block.id).url, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const formatRange = (block: ScheduleBlock) => {
        const start = new Date(block.starts_at);
        const end = new Date(block.ends_at);
        const dateFmt = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        const timeFmt = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });

        return `${dateFmt.format(start)} ${timeFmt.format(start)} - ${timeFmt.format(end)}`;
    };

    return (
        <>
            <Head title="Schedule Settings" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title="Schedule settings"
                    description="Set weekly operating hours and block off maintenance or private-event time"
                />

                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <form onSubmit={submitHours}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Operating hours</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs
                                    value={selectedDay}
                                    onValueChange={(value) =>
                                        setSelectedDay(value as keyof OperatingHours)
                                    }
                                >
                                    <TabsList className="grid w-full grid-cols-7">
                                        {DAYS.map(({ key, short }) => {
                                            const closed = hoursForm.data.operating_hours[key].closed;

                                            return (
                                                <TabsTrigger key={key} value={key} className="relative">
                                                    {short}
                                                    {closed && (
                                                        <span className="bg-destructive absolute top-1 right-1 size-1.5 rounded-full" />
                                                    )}
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>

                                    {DAYS.map(({ key, label }) => {
                                        const day = hoursForm.data.operating_hours[key];
                                        const slots = previewSlots(day);

                                        return (
                                            <TabsContent key={key} value={key} className="space-y-4 pt-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">{label}</h3>
                                                    <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                                                        <Checkbox
                                                            checked={day.closed}
                                                            onCheckedChange={(checked) =>
                                                                updateDay(key, {
                                                                    closed: checked === true,
                                                                })
                                                            }
                                                        />
                                                        Closed all day
                                                    </label>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="grid gap-1">
                                                        <Label htmlFor={`${key}-open`}>Opening time</Label>
                                                        <Input
                                                            id={`${key}-open`}
                                                            type="time"
                                                            value={day.open ?? ''}
                                                            disabled={day.closed}
                                                            onChange={(e) =>
                                                                updateDay(key, { open: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label htmlFor={`${key}-close`}>Closing time</Label>
                                                        <Input
                                                            id={`${key}-close`}
                                                            type="time"
                                                            value={day.close ?? ''}
                                                            disabled={day.closed}
                                                            onChange={(e) =>
                                                                updateDay(key, { close: e.target.value })
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border border-slate-200">
                                                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium">
                                                        Time slots customers will see
                                                    </div>
                                                    {day.closed ? (
                                                        <p className="text-muted-foreground p-4 text-sm">
                                                            Closed all day — no slots will be bookable on{' '}
                                                            {label}.
                                                        </p>
                                                    ) : slots.length === 0 ? (
                                                        <p className="text-muted-foreground p-4 text-sm">
                                                            Closing time must be at least an hour after opening
                                                            time to produce a bookable slot.
                                                        </p>
                                                    ) : resources.length === 0 ? (
                                                        <p className="text-muted-foreground p-4 text-sm">
                                                            Add courts/tables before you can lock specific
                                                            time slots.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <div className="max-h-96 overflow-auto">
                                                                <table className="w-full min-w-[28rem] border-collapse text-sm">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-200 bg-slate-50">
                                                                            <th className="px-3 py-3 text-left font-semibold text-slate-700">
                                                                                Time
                                                                            </th>
                                                                            {resources.map((resource) => (
                                                                                <th
                                                                                    key={resource.id}
                                                                                    className="px-3 py-3 text-center font-semibold text-slate-700"
                                                                                >
                                                                                    {resource.name}
                                                                                    <span className="mt-0.5 block text-xs font-normal text-slate-500 capitalize">
                                                                                        {resource.sport}
                                                                                    </span>
                                                                                </th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {slots.map((slot) => (
                                                                            <tr
                                                                                key={slot.start}
                                                                                className="border-b border-slate-100 last:border-0"
                                                                            >
                                                                                <td className="px-3 py-2 font-medium whitespace-nowrap text-slate-600">
                                                                                    {formatMinutes(slot.start)} –{' '}
                                                                                    {formatMinutes(slot.end)}
                                                                                </td>
                                                                                {resources.map((resource) => {
                                                                                    const lock = findRecurringLock(
                                                                                        recurringLocks,
                                                                                        resource.id,
                                                                                        DAY_OF_WEEK[key],
                                                                                        slot,
                                                                                    );
                                                                                    const cellKey = `${resource.id}-${slot.start}-${slot.end}`;

                                                                                    return (
                                                                                        <td
                                                                                            key={resource.id}
                                                                                            className="p-1"
                                                                                        >
                                                                                            <button
                                                                                                type="button"
                                                                                                disabled={
                                                                                                    togglingSlot ===
                                                                                                    cellKey
                                                                                                }
                                                                                                onClick={() =>
                                                                                                    toggleLock(
                                                                                                        resource.id,
                                                                                                        slot,
                                                                                                    )
                                                                                                }
                                                                                                className={cn(
                                                                                                    'w-full rounded px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm',
                                                                                                    lock
                                                                                                        ? 'bg-slate-200 text-slate-500'
                                                                                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                                                                                                )}
                                                                                            >
                                                                                                {lock
                                                                                                    ? 'Locked'
                                                                                                    : 'Open'}
                                                                                            </button>
                                                                                        </td>
                                                                                    );
                                                                                })}
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="flex flex-wrap gap-4 border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-600">
                                                                <span className="flex items-center gap-2">
                                                                    <span className="size-3 rounded border border-emerald-200 bg-emerald-50" />
                                                                    Open
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <span className="size-3 rounded border border-slate-300 bg-slate-200" />
                                                                    Locked
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    Click a slot to lock or unlock it for that
                                                                    court/table, every {label}.
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                                <InputError message={hoursForm.errors.operating_hours} />
                            </CardContent>
                        </Card>
                        <div className="mt-4 flex justify-end">
                            <Button type="submit" disabled={hoursForm.processing}>
                                Save hours
                            </Button>
                        </div>
                    </form>

                    <Card>
                        <CardHeader>
                            <CardTitle>Blocked slots</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form
                                onSubmit={submitBlock}
                                className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-5"
                            >
                                <div className="grid gap-1 lg:col-span-2">
                                    <Label>Resource</Label>
                                    <Select
                                        value={
                                            blockForm.data.resource_id === ''
                                                ? 'all'
                                                : String(blockForm.data.resource_id)
                                        }
                                        onValueChange={(v) =>
                                            blockForm.setData(
                                                'resource_id',
                                                v === 'all' ? '' : Number(v),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select resource" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All resources (close entire venue)
                                            </SelectItem>
                                            {resources.map((resource) => (
                                                <SelectItem
                                                    key={resource.id}
                                                    value={String(resource.id)}
                                                >
                                                    {resource.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="block-date">Date</Label>
                                    <Input
                                        id="block-date"
                                        type="date"
                                        value={blockDate}
                                        onChange={(e) => setBlockDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="block-start">Start</Label>
                                    <Input
                                        id="block-start"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label htmlFor="block-end">End</Label>
                                    <Input
                                        id="block-end"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-1 sm:col-span-2 lg:col-span-4">
                                    <Label htmlFor="block-reason">Reason</Label>
                                    <Input
                                        id="block-reason"
                                        value={blockForm.data.reason}
                                        onChange={(e) =>
                                            blockForm.setData('reason', e.target.value)
                                        }
                                        placeholder="Maintenance, private event, holiday, ..."
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={blockProcessing}>
                                        Add block
                                    </Button>
                                </div>
                                {(blockErrors.starts_at ||
                                    blockErrors.ends_at ||
                                    blockErrors.resource_id) && (
                                    <p className="text-destructive text-sm sm:col-span-2 lg:col-span-5">
                                        {blockErrors.starts_at ??
                                            blockErrors.ends_at ??
                                            blockErrors.resource_id}
                                    </p>
                                )}
                            </form>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Resource</TableHead>
                                        <TableHead>Range</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Added by</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scheduleBlocks.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-muted-foreground text-center"
                                            >
                                                No upcoming blocked slots.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        scheduleBlocks.map((block) => (
                                            <TableRow key={block.id}>
                                                <TableCell>
                                                    {block.resource_id === null
                                                        ? 'All courts/tables'
                                                        : (block.resource?.name ?? '—')}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatRange(block)}
                                                </TableCell>
                                                <TableCell>{block.reason ?? '—'}</TableCell>
                                                <TableCell>
                                                    {block.creator?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeBlock(block)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminScheduleIndex.layout = {
    breadcrumbs: [{ title: 'Schedule', href: scheduleIndex() }],
};
