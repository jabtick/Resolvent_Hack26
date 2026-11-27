import 'package:flutter/material.dart';

import '../../../core/widgets/coming_soon.dart';

/// The feed (owner: Gosho). Replace this placeholder with the real page.
/// Pattern: feed_repo.dart (interface) + fake_feed_repo.dart + supabase_feed_repo.dart,
/// add the repo to core/services.dart. See app/README.md.
class FeedPage extends StatelessWidget {
  const FeedPage({super.key});

  @override
  Widget build(BuildContext context) =>
      const ComingSoon(title: 'ФИЙД', owner: 'Гошо');
}
