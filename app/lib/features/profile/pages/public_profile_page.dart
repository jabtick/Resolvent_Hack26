import 'package:flutter/material.dart';

import '../../../core/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/zine.dart';
import '../profile_models.dart';
import 'profile_widgets.dart';

/// `/u/<username>`: what anyone may see, signed in or not.
class PublicProfilePage extends StatefulWidget {
  final String username;
  const PublicProfilePage({super.key, required this.username});

  @override
  State<PublicProfilePage> createState() => _PublicProfilePageState();
}

class _PublicProfilePageState extends State<PublicProfilePage> {
  Future<PublicProfile?>? _profile;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _profile ??= ServicesScope.of(context).profiles.loadPublic(widget.username);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return FutureBuilder<PublicProfile?>(
      future: _profile,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        final pr = snap.data;
        if (pr == null) {
          return Center(
            child: ZineBox(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Няма такъв профил',
                    style: ZineText.display(36, color: p.ink),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'или профилът е скрит.',
                    style: ZineText.hand(24, color: p.ink),
                  ),
                ],
              ),
            ),
          );
        }
        return Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 768),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ProfileHeader(
                  displayName: pr.displayName,
                  subtitle: '@${pr.username}',
                ),
                ProfileSection(title: 'ЗА МЕН', text: pr.bio),
                if ((pr.school ?? '').isNotEmpty)
                  ProfileSection(title: 'УЧИЛИЩЕ', text: pr.school),
                if (pr.interests.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: RansomText('ИНТЕРЕСИ'),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final (i, t) in pr.interests.indexed)
                        ZineBox(
                          color: i.isEven ? p.accent : p.secondary,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          child: Text(
                            t,
                            style: ZineText.heavy(
                              20,
                              color: const Color(0xFF070707),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
