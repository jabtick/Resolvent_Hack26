/// UI-only sample badges for the achievements page.
///
/// TODO(Zahari): replace with achievements_repo.dart + fake_/supabase_
/// versions (badges issued from the organisers' uploaded results) and read
/// them through ServicesScope.of(context).achievements.
class EarnedBadge {
  final String event, org, date;

  /// 1, 2, 3 for a podium place; null for participation.
  final int? place;

  const EarnedBadge(this.event, this.org, this.date, [this.place]);
}

const kSampleBadges = [
  EarnedBadge(
    'National Maths Olympiad',
    'Ministry of Education',
    'Apr 2026',
    1,
  ),
  EarnedBadge('Robotics Cup Varna', 'TechSchool Varna', 'Mar 2026', 3),
  EarnedBadge('Young Writers Contest', 'Loud Canvas Fund', 'Feb 2026'),
  EarnedBadge('Informatics Open', 'Riot Code Collective', 'Jan 2026', 2),
  EarnedBadge('Climate Ideas Sprint', 'Climate Mosh Pit', 'Nov 2025'),
  EarnedBadge('Physics Tournament', 'Garage Science Club', 'Oct 2025'),
];
