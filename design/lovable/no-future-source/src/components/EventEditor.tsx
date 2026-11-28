import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAccount } from '@/components/AccountProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { canPublish, recommendedQualities, validEventRange } from '@/lib/events';
import { format } from 'date-fns';
export type CalendarEvent = Database['public']['Tables']['events']['Row'];
export function EventEditor({ event, date, onClose }: { event: CalendarEvent | null; date: Date; onClose: () => void }) {
  const { user, role } = useAccount();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [field, setField] = useState(event?.field ?? 'General');
  const [qualities, setQualities] = useState(event?.qualities ?? []);
  const [custom, setCustom] = useState('');
  const [published, setPublished] = useState(event?.published ?? false);
  const input = 'w-full border-[3px] border-ink bg-background p-2 outline-none focus:ring-2 focus:ring-primary';
  async function save(form: HTMLFormElement) {
    if (!user) return;
    const data = new FormData(form);
    const start = String(data.get('start')); const end = String(data.get('end'));
    if (!validEventRange(start, end)) { toast.error('End time must be after start time.'); return; }
    setBusy(true);
    const values = { owner_id: user.id, title: String(data.get('title')).trim(), description: String(data.get('description')), location: String(data.get('location')), starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(), field, qualities, published: canPublish(role) && published };
    const result = event ? await supabase.from('events').update(values).eq('id', event.id).select().single() : await supabase.from('events').insert(values).select().single();
    setBusy(false);
    if (result.error) { toast.error(result.error.message); return; }
    await cache.invalidateQueries({ queryKey: ['events'] }); toast.success(event ? 'Event updated' : 'Event added'); onClose();
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto border-[3px] border-ink bg-card sm:max-w-xl"><DialogHeader><DialogTitle className="font-heavy text-4xl">{event ? 'EDIT EVENT' : 'ADD EVENT'}</DialogTitle><DialogDescription>{canPublish(role) ? 'Organiser event / personal schedule' : 'Personal schedule'}</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void save(e.currentTarget); }}>
      <label className="block text-sm font-bold">Event name<input name="title" required maxLength={160} defaultValue={event?.title} className={input} /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Starts<input name="start" type="datetime-local" required defaultValue={event ? format(new Date(event.starts_at), "yyyy-MM-dd'T'HH:mm") : `${format(date, 'yyyy-MM-dd')}T10:00`} className={input} /></label><label className="text-sm font-bold">Ends<input name="end" type="datetime-local" required defaultValue={event ? format(new Date(event.ends_at), "yyyy-MM-dd'T'HH:mm") : `${format(date, 'yyyy-MM-dd')}T11:00`} className={input} /></label></div>
      <label className="block text-sm font-bold">Location / meeting link<input name="location" defaultValue={event?.location} className={input} /></label>
      <label className="block text-sm font-bold">Details<textarea aria-label="Details" name="description" rows={3} defaultValue={event?.description} className={input} /></label>
      {canPublish(role) && <><label className="block text-sm font-bold">Field<select aria-label="Field" value={field} onChange={(e) => setField(e.target.value)} className={input}>{['General','Tech','Art','Music','Education','Environment'].map(f => <option key={f}>{f}</option>)}</select></label>
      <fieldset className="space-y-3 border-t-2 border-dashed border-ink pt-3"><legend className="flex items-center gap-2 font-heavy text-2xl"><Sparkles />CANDIDATE QUALITIES</legend>
      <p className="text-xs text-muted-foreground">Suggested for {field.toLowerCase()}</p><div className="flex flex-wrap gap-2">{Array.from(new Set([...recommendedQualities(field), ...qualities])).map(q => <Button key={q} type="button" variant={qualities.includes(q) ? 'secondary' : 'outline'} aria-pressed={qualities.includes(q)} className="h-auto whitespace-normal text-left" onClick={() => setQualities(qualities.includes(q) ? qualities.filter(x => x !== q) : [...qualities,q])}>{q}</Button>)}</div>
      <div className="flex gap-2"><input aria-label="Custom candidate quality" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Your own quality" className={`${input} min-w-0`} /><Button type="button" variant="outline" size="icon" aria-label="Add candidate quality" onClick={() => { const q = custom.trim(); if (q && !qualities.includes(q)) setQualities([...qualities,q]); setCustom(''); }}><Plus /></Button></div></fieldset>
      <label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />Publish to candidates</label></>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button disabled={busy} type="submit">{busy ? 'Saving…' : 'Save event'}</Button></div>
    </form></DialogContent></Dialog>;
}
