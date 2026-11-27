import 'package:flutter/material.dart';

import '../../../core/widgets/coming_soon.dart';

/// The calendar (owner: Niki). Replace this placeholder with the real page.
/// Pattern: calendar_repo.dart (interface) + fake_calendar_repo.dart + supabase_calendar_repo.dart,
/// add the repo to core/services.dart. See app/README.md.
class CalendarPage extends StatelessWidget {
  const CalendarPage({super.key});

  @override
  Widget build(BuildContext context) =>
      const ComingSoon(title: 'КАЛЕНДАР', owner: 'Ники');
}
