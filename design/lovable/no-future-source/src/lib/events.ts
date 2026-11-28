export type AccountRole = 'candidate' | 'organiser';
export function canPublish(role: AccountRole | null) { return role === 'organiser'; }
export function canEditEvent(userId: string | undefined, ownerId: string) { return Boolean(userId && userId === ownerId); }
export function validEventRange(start: string, end: string) { return Number.isFinite(Date.parse(start)) && Date.parse(end) > Date.parse(start); }
const qualities: Record<string, string[]> = {
  Tech: ['Problem solving', 'Programming fundamentals', 'Team collaboration', 'Willingness to learn'],
  Art: ['Creative portfolio', 'Visual storytelling', 'Attention to detail', 'Openness to feedback'],
  Music: ['Musical practice', 'Collaboration', 'Reliability', 'Creative expression'],
  General: ['Curiosity', 'Clear communication', 'Reliability', 'Teamwork'],
  Education: ['Patient communication', 'Facilitation', 'Empathy', 'Subject knowledge'],
  Environment: ['Community engagement', 'Research skills', 'Environmental interest', 'Initiative'],
};
export function recommendedQualities(field: string) { return qualities[field] ?? qualities['General'] ?? []; }