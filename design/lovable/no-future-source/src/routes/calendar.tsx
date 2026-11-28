import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Plus, Pencil, Trash2, Clock, MapPin, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { Nav } from '@/components/Nav';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { EventEditor, type CalendarEvent } from '@/components/EventEditor';
import { AccountNotice } from '@/components/AccountNotice';
import { useAccount } from '@/components/AccountProvider';
import { supabase } from '@/integrations/supabase/client';
import { canEditEvent, canPublish } from '@/lib/events';
export const Route = createFileRoute('/calendar')({ head: () => ({ meta: [
  { title: 'Calendar — NO FUTURE?' }, { name: 'description', content: 'Scheduled opportunities and your personal events.' }, { property: 'og:title', content: 'Calendar — NO FUTURE?' }, { property: 'og:description', content: 'Your next workshop, interview or opportunity.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
]}), component: CalendarPage });
function CalendarPage() {
  const { user, role, loading } = useAccount();
  const cache = useQueryClient();
  const [date, setDate] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const [view, setView] = useState<'day' | 'all'>('all');
  const [editor, setEditor] = useState<{ event: CalendarEvent | null } | null>(null);
  const { data: events = [], isPending, error } = useQuery({ queryKey: ['events', user?.id], queryFn: async () => { const { data, error } = await supabase.from('events').select('*').order('starts_at').limit(1000); if (error) throw error; return data; }});
  const visible = view === 'day' ? events.filter(e => new Date(e.starts_at) <= endOfDay(date) && new Date(e.ends_at) >= startOfDay(date)) : events;
  async function remove(event: CalendarEvent) { if (!window.confirm(`Delete “${event.title}”?`)) return; const { error } = await supabase.from('events').delete().eq('id',event.id); if (error) { toast.error(error.message); return; } await cache.invalidateQueries({ queryKey: ['events'] }); toast.success('Event deleted'); }
  return <div className="min-h-screen"><Nav /><main className="mx-auto max-w-6xl px-4 py-8"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="font-hand text-primary">make time for something good</p><h1 className="font-heavy text-6xl">YOUR <span className="ransom">CALENDAR</span></h1></div>{user && <Button className="zine h-12 bg-secondary font-heavy text-2xl text-secondary-foreground" onClick={() => setEditor({ event: null })}><Plus />{canPublish(role) ? 'ADD EVENT' : 'ADD TO SCHEDULE'}</Button>}</div>
    {!user && !loading && <AccountNotice action="edit your calendar" />}
    {user && !role && <p className="mb-4 bg-accent p-3 text-sm"><Link className="font-bold underline" to="/join">Choose your account type</Link> to publish organiser events.</p>}
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[340px_1fr]"><aside className="space-y-5"><div className="zine bg-card p-3"><Calendar mode="single" required selected={date} onSelect={d => { setDate(d); setView('day'); }} month={month} onMonthChange={setMonth} className="w-full bg-card [--cell-size:2.5rem]" modifiers={{ scheduled: events.map(e => new Date(e.starts_at)) }} modifiersClassNames={{ scheduled: 'border-b-[3px] border-primary font-bold' }} /></div><div className="border-l-[6px] border-primary pl-4"><p className="font-heavy text-3xl">{events.length} SCHEDULED</p><p className="text-sm text-muted-foreground">{events.filter(e => e.published).length} public · {events.filter(e => !e.published).length} personal</p></div><Button variant="outline" onClick={() => { const now = new Date(); setDate(now); setMonth(now); setView('day'); }}>Today</Button></aside>
    <section className="min-w-0"><div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink pb-3"><h2 className="font-heavy text-3xl">{view === 'day' ? format(date, 'EEEE, d MMM') : 'ALL EVENTS'}</h2><div className="flex gap-2"><Button variant={view === 'all' ? 'secondary' : 'outline'} onClick={() => setView('all')}>All events</Button><Button variant={view === 'day' ? 'secondary' : 'outline'} onClick={() => setView('day')}>Selected day</Button></div></div>
    {isPending ? <p>Loading schedule…</p> : error ? <p role="alert">Could not load events. <Button variant="link" onClick={() => void cache.invalidateQueries({ queryKey: ['events'] })}>Retry</Button></p> : !visible.length ? <div className="py-12 text-center"><CalendarDays className="mx-auto mb-4 h-10 w-10 text-primary" /><h3 className="font-heavy text-3xl">NO PLANS. YET.</h3>{user && <Button variant="link" onClick={() => setEditor({ event: null })}>Add an event</Button>}</div> : <div className="space-y-5">{visible.map(e => <article key={e.id} className="zine bg-card p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mb-2 font-heavy text-xl text-primary">{format(new Date(e.starts_at), 'dd MMM yyyy')} · {e.published ? e.field : 'PERSONAL'}</p><h3 className="break-words font-heavy text-3xl">{e.title}</h3></div>{canEditEvent(user?.id,e.owner_id) && <div className="flex shrink-0 gap-1"><Button size="icon" variant="outline" title="Edit event" aria-label={`Edit ${e.title}`} onClick={() => setEditor({ event: e })}><Pencil /></Button><Button size="icon" variant="outline" title="Delete event" aria-label={`Delete ${e.title}`} onClick={() => void remove(e)}><Trash2 /></Button></div>}</div><p className="mt-3 flex items-center gap-2 text-sm"><Clock className="h-4 w-4" />{format(new Date(e.starts_at),'HH:mm')} – {format(new Date(e.ends_at),'dd MMM HH:mm')}</p>{e.location && <p className="mt-2 flex items-center gap-2 break-all text-sm"><MapPin className="h-4 w-4 shrink-0" />{e.location}</p>}<p className="mt-3 whitespace-pre-wrap break-words text-sm">{e.description}</p>{e.qualities.length > 0 && <div className="mt-4 border-t-2 border-dashed border-ink pt-3"><p className="mb-2 font-heavy text-xl">CANDIDATES WITH</p><div className="flex flex-wrap gap-2">{e.qualities.map(q => <span key={q} className="border-2 border-ink bg-accent px-2 py-1 text-xs text-accent-foreground">{q}</span>)}</div></div>}</article>)}</div>}</section></div>
    {editor && <EventEditor event={editor.event} date={date} onClose={() => setEditor(null)} />}</main></div>;
}
