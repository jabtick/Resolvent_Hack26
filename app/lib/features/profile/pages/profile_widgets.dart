import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/zine.dart';
import '../profile_models.dart';

/// Pink cover strip with the round initials avatar overlapping it
/// (design/lovable, routes/profile.tsx).
class ProfileHeader extends StatelessWidget {
  final String displayName;
  final String subtitle;
  final Widget? action;
  final List<Widget> below;

  const ProfileHeader({
    super.key,
    required this.displayName,
    required this.subtitle,
    this.action,
    this.below = const [],
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return ZineBox(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: p.primary,
                  border: Border(bottom: BorderSide(color: p.ink, width: 3)),
                ),
                child: const SizedBox(height: 140),
              ),
              Positioned(
                left: 24,
                bottom: -48,
                child: Container(
                  width: 96,
                  height: 96,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: p.secondary,
                    border: Border.all(color: p.ink, width: 4),
                    boxShadow: [
                      BoxShadow(
                        color: p.ink,
                        offset: const Offset(6, 6),
                        blurRadius: 0,
                      ),
                    ],
                  ),
                  child: Text(
                    initialsOf(displayName),
                    style: ZineText.heavy(36, color: const Color(0xFF070707)),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 64, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  alignment: WrapAlignment.spaceBetween,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          displayName,
                          style: ZineText.heavy(44, color: p.ink),
                        ),
                        const SizedBox(height: 6),
                        Text(subtitle, style: TextStyle(color: p.mutedFg)),
                      ],
                    ),
                    ?action,
                  ],
                ),
                ...below,
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A section with a ransom heading and dashed-ink feel.
class ProfileSection extends StatelessWidget {
  final String title;
  final String? text;
  const ProfileSection({super.key, required this.title, this.text});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Padding(
      padding: const EdgeInsets.only(top: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RansomText(title),
          const SizedBox(height: 12),
          Text(
            (text ?? '').trim().isEmpty ? 'Още няма нищо тук.' : text!,
            style: TextStyle(
              color: (text ?? '').trim().isEmpty ? p.mutedFg : p.ink,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
