import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'zine.dart';

/// Placeholder for a section someone else is building.
class ComingSoon extends StatelessWidget {
  final String title;
  final String owner;
  const ComingSoon({super.key, required this.title, required this.owner});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: ZineText.heavy(64, color: p.ink)),
        const SizedBox(height: 24),
        ZineBox(
          tilt: -1.5,
          padding: const EdgeInsets.all(32),
          child: Text(
            'скоро — прави го $owner',
            style: ZineText.hand(32, color: p.ink),
          ),
        ),
      ],
    );
  }
}
