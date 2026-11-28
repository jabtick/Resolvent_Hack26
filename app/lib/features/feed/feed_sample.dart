import 'package:flutter/widgets.dart';

import '../../core/i18n/language.dart';
import '../../core/widgets/zine.dart';

/// UI-only sample data copied from the Lovable prototype
/// (design/lovable/no-future-source/src/data/opps.ts).
///
/// TODO(Gosho): replace with feed_repo.dart + fake_/supabase_ versions and
/// read the list through ServicesScope.of(context).feed. The pages only use
/// the fields below, so the real model can start from this shape.
class Opp {
  final int id;
  final String org, title, type, field, location, deadline, amount, desc;
  final bool remote;
  final int likes;
  final ZineTone tone;

  const Opp({
    required this.id,
    required this.org,
    required this.title,
    required this.type,
    required this.field,
    required this.location,
    required this.remote,
    required this.deadline,
    required this.amount,
    required this.desc,
    required this.likes,
    required this.tone,
  });
}

const kOppTypes = ['Internship', 'Stipend', 'Grant', 'Fellowship', 'Volunteer'];
const kOppFields = ['Tech', 'Art', 'Music', 'Science', 'Activism', 'Media'];

/// Types and fields are the site's own categories, so they are translated;
/// the organiser's title and description are not.
const _typeBg = {
  'Internship': 'Стаж',
  'Stipend': 'Стипендия',
  'Grant': 'Грант',
  'Fellowship': 'Програма',
  'Volunteer': 'Доброволчество',
};
const _fieldBg = {
  'Tech': 'Технологии',
  'Art': 'Изкуство',
  'Music': 'Музика',
  'Science': 'Наука',
  'Activism': 'Активизъм',
  'Media': 'Медии',
};

String oppTypeLabel(BuildContext context, String type) =>
    context.tr(type, _typeBg[type] ?? type);

String oppFieldLabel(BuildContext context, String field) =>
    context.tr(field, _fieldBg[field] ?? field);

const _raw = [
  (
    'Riot Code Collective',
    'Backend Rebel Intern',
    'Internship',
    'Tech',
    'Berlin',
    true,
    'Dec 20',
    '€1,200/mo',
    'Break things, then fix them. Open-source infra for grassroots orgs.',
  ),
  (
    'Loud Canvas Fund',
    'Street Art Stipend',
    'Stipend',
    'Art',
    'Sofia',
    false,
    'Jan 05',
    '€800/mo',
    'Paint the city. Six months of funding for public murals.',
  ),
  (
    'Basement Records',
    'Sound Engineer Apprentice',
    'Internship',
    'Music',
    'London',
    false,
    'Dec 30',
    '£1,000/mo',
    'Mix demos for DIY bands in a sweaty basement studio.',
  ),
  (
    'Mutant Lab',
    'Open Science Fellowship',
    'Fellowship',
    'Science',
    'Remote',
    true,
    'Feb 01',
    '\$15k',
    'Research without the ivory tower. Publish everything open.',
  ),
  (
    'Zine Machine',
    'Indie Press Grant',
    'Grant',
    'Media',
    'Remote',
    true,
    'Jan 15',
    '\$5k',
    'Print your zine. Distribute it. Make noise.',
  ),
  (
    'Climate Mosh Pit',
    'Field Organizer',
    'Volunteer',
    'Activism',
    'Amsterdam',
    false,
    'Rolling',
    'Expenses',
    'Organize direct action and community workshops.',
  ),
  (
    'Static Pixel',
    'Game Dev Internship',
    'Internship',
    'Tech',
    'Warsaw',
    true,
    'Jan 10',
    '€1,000/mo',
    'Build weird little games for weird little people.',
  ),
  (
    'Anarchy Arts Council',
    'Young Artist Stipend',
    'Stipend',
    'Art',
    'Lisbon',
    false,
    'Feb 14',
    '€700/mo',
    'No portfolio rules. Just send us what you make.',
  ),
  (
    'Feedback Loop Radio',
    'Podcast Fellowship',
    'Fellowship',
    'Media',
    'Remote',
    true,
    'Jan 25',
    '\$8k',
    'Produce a 10-episode series on underground culture.',
  ),
  (
    'Garage Science Club',
    'Citizen Research Grant',
    'Grant',
    'Science',
    'Plovdiv',
    false,
    'Mar 01',
    '€3k',
    'Fund your DIY experiment. Bio, electronics, whatever.',
  ),
  (
    'Power Chord Academy',
    'Music Education Volunteer',
    'Volunteer',
    'Music',
    'Prague',
    false,
    'Rolling',
    'Housing',
    'Teach kids three chords and the truth.',
  ),
  (
    'Black Flag Data',
    'Data Activism Intern',
    'Internship',
    'Activism',
    'Remote',
    true,
    'Dec 28',
    '\$900/mo',
    'Use data to expose injustice. Python + rage welcome.',
  ),
];

final List<Opp> kSampleOpps = [
  for (final (i, r) in _raw.indexed)
    Opp(
      id: i + 1,
      org: r.$1,
      title: r.$2,
      type: r.$3,
      field: r.$4,
      location: r.$5,
      remote: r.$6,
      deadline: r.$7,
      amount: r.$8,
      desc: r.$9,
      likes: 40 + (i * 37) % 300,
      tone: ZineTone.cycle(i),
    ),
];

Opp? sampleOppById(String id) {
  for (final o in kSampleOpps) {
    if ('${o.id}' == id) return o;
  }
  return null;
}
