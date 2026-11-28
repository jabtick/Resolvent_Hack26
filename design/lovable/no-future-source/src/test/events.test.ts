import { describe, it, expect } from 'vitest';
import { canPublish, canEditEvent, validEventRange, recommendedQualities } from '@/lib/events';
describe('Calendar rules', () => {
  it('only organisers publish events', () => { expect(canPublish('organiser')).toBe(true); expect(canPublish('candidate')).toBe(false); expect(canPublish(null)).toBe(false); });
  it('users edit only their own events', () => { expect(canEditEvent('hristo', 'hristo')).toBe(true); expect(canEditEvent('other', 'hristo')).toBe(false); expect(canEditEvent(undefined, 'hristo')).toBe(false); });
  it('end follows start', () => { expect(validEventRange('2026-11-26T10:00', '2026-11-26T11:00')).toBe(true); expect(validEventRange('2026-11-26T10:00', '2026-11-26T09:00')).toBe(false); });
  it('recommends job-relevant qualities', () => { expect(recommendedQualities('Tech')).toContain('Programming fundamentals'); expect(recommendedQualities('Art')).toContain('Creative portfolio'); });
});