/// UI-only sample events for the calendar page.
///
/// TODO(Niki): replace with calendar_repo.dart + fake_/supabase_ versions and
/// read the events through ServicesScope.of(context).calendar. The page only
/// uses the fields below, so the real model can start from this shape.
class CalendarEvent {
  final DateTime start, end;
  final String title, field, location, description;

  /// False = a personal note only the student sees.
  final bool published;

  /// What the organiser looks for in candidates.
  final List<String> qualities;

  const CalendarEvent({
    required this.start,
    required this.end,
    required this.title,
    required this.field,
    required this.location,
    required this.description,
    this.published = true,
    this.qualities = const [],
  });
}

final kSampleEvents = [
  CalendarEvent(
    start: DateTime(2026, 12, 3, 10),
    end: DateTime(2026, 12, 3, 16),
    title: 'Hack the Coast — Burgas',
    field: 'Tech',
    location: 'Burgas Free University, Hall 2',
    description: '24 hours, teams of 3–5, mentors on site. Pizza included.',
    qualities: ['Teamwork', 'Python', 'Pitching'],
  ),
  CalendarEvent(
    start: DateTime(2026, 12, 9, 14),
    end: DateTime(2026, 12, 9, 15),
    title: 'Street Art Stipend — Q&A',
    field: 'Art',
    location: 'meet.example.org/loud-canvas',
    description: 'Ask the jury anything before the January deadline.',
  ),
  CalendarEvent(
    start: DateTime(2026, 12, 12, 9),
    end: DateTime(2026, 12, 12, 13),
    title: 'National Maths Olympiad — round 2',
    field: 'Education',
    location: 'Sofia, Mathematical High School',
    description: 'Bring a pen, a calculator and your student ID.',
    qualities: ['Logic', 'Persistence'],
  ),
  CalendarEvent(
    start: DateTime(2026, 12, 18, 17),
    end: DateTime(2026, 12, 18, 18),
    title: 'Finish motivation letter',
    field: 'Personal',
    location: '',
    description: 'For the Open Science Fellowship.',
    published: false,
  ),
];
