import 'package:flutter/material.dart';

import '../../../core/ui.dart';
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
                  border: Border(
                    bottom: BorderSide(color: p.ink, width: ZineSize.border),
                  ),
                ),
                child: const SizedBox(height: 140),
              ),
              Positioned(
                left: 24,
                bottom: -48,
                child: InitialsAvatar(
                  initialsOf(displayName),
                  size: 96,
                  shadow: true,
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

/// A ransom heading with a paragraph under it; says "not added yet" when
/// [text] is empty.
class ProfileSection extends StatelessWidget {
  final String title;
  final String? text;
  const ProfileSection({super.key, required this.title, this.text});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final empty = (text ?? '').trim().isEmpty;
    return Padding(
      padding: const EdgeInsets.only(top: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RansomText(title),
          const SizedBox(height: 12),
          Text(
            empty ? context.tr('Not added yet', 'Още няма нищо тук.') : text!,
            style: TextStyle(color: empty ? p.mutedFg : p.ink, height: 1.5),
          ),
        ],
      ),
    );
  }
}
