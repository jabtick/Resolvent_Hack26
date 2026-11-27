import 'package:flutter/material.dart';

import '../../../core/widgets/coming_soon.dart';

/// Achievements and badges (owner: Zahari). Replace this placeholder with the real page.
/// Pattern: achievements_repo.dart (interface) + fake_achievements_repo.dart + supabase_achievements_repo.dart,
/// add the repo to core/services.dart. See app/README.md.
class AchievementsPage extends StatelessWidget {
  const AchievementsPage({super.key});

  @override
  Widget build(BuildContext context) =>
      const ComingSoon(title: 'ПОСТИЖЕНИЯ', owner: 'Захари');
}
