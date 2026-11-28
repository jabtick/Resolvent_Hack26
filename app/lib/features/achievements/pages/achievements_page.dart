import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/zine.dart';

/// Achievements and badges (owner: Zahari), UI only. The Lovable prototype
/// has no such page, so this one is built from the same zine pieces.
///
/// The badges are [_sample]. To wire it up: achievements_repo.dart
/// (+ fake_/supabase_), add it to core/services.dart, swap [_sample] for the
/// badges the organisers issued from their results.
class AchievementsPage extends StatelessWidget {
  const AchievementsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final places = _sample.where((b) => b.place != null).length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          context.tr('proof, not promises', 'доказателства, не обещания'),
          style: ZineText.hand(22, color: p.primary),
        ),
        Text.rich(
          TextSpan(
            style: ZineText.heavy(60, color: p.ink),
            children: [
              TextSpan(text: context.tr('YOUR ', 'ТВОИТЕ ')),
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: RansomText(context.tr('BADGES', 'ЗНАЧКИ'), size: 60),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _Stat(
              n: '${_sample.length}',
              label: context.tr('badges', 'значки'),
              tone: ZineTone.accent,
            ),
            _Stat(
              n: '$places',
              label: context.tr('podium places', 'места на подиума'),
              tone: ZineTone.primary,
            ),
            _Stat(
              n: '${_sample.map((b) => b.org).toSet().length}',
              label: context.tr('organisers', 'организатори'),
              tone: ZineTone.secondary,
            ),
          ],
        ),
        const SizedBox(height: 40),
        LayoutBuilder(
          builder: (context, c) {
            final cols = c.maxWidth >= 1000 ? 3 : (c.maxWidth >= 640 ? 2 : 1);
            final w = (c.maxWidth - 32 * (cols - 1)) / cols;
            return Wrap(
              spacing: 32,
              runSpacing: 40,
              children: [
                for (final (i, b) in _sample.indexed)
                  SizedBox(
                    width: w,
                    child: _BadgeCard(b: b, index: i),
                  ),
              ],
            );
          },
        ),
        const SizedBox(height: 48),
        Taped(
          child: ZineBox(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Icon(LucideIcons.hourglass, size: 32, color: p.primary),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('WAITING FOR RESULTS', 'ЧАКАМЕ РЕЗУЛТАТИ'),
                        style: ZineText.heavy(26, color: p.ink),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Hack the Coast — Burgas · '
                        '${context.tr('the organiser uploads results after the event, then your badge lands here.', 'организаторът качва резултатите след събитието и значката ти се появява тук.')}',
                        style: TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Badge {
  final String event, org, date;
  final int? place; // null = participation
  const _Badge(this.event, this.org, this.date, [this.place]);
}

const _sample = [
  _Badge('National Maths Olympiad', 'Ministry of Education', 'Apr 2026', 1),
  _Badge('Robotics Cup Varna', 'TechSchool Varna', 'Mar 2026', 3),
  _Badge('Young Writers Contest', 'Loud Canvas Fund', 'Feb 2026'),
  _Badge('Informatics Open', 'Riot Code Collective', 'Jan 2026', 2),
  _Badge('Climate Ideas Sprint', 'Climate Mosh Pit', 'Nov 2025'),
  _Badge('Physics Tournament', 'Garage Science Club', 'Oct 2025'),
];

class _BadgeCard extends StatelessWidget {
  final _Badge b;
  final int index;
  const _BadgeCard({required this.b, required this.index});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final tone = switch (b.place) {
      1 => ZineTone.accent,
      2 => ZineTone.secondary,
      3 => ZineTone.primary,
      _ => null,
    };
    final bg = tone?.bg(p) ?? p.card;
    final fg = tone?.fg(p) ?? p.ink;
    final label = switch (b.place) {
      1 => context.tr('1ST PLACE', '1-ВО МЯСТО'),
      2 => context.tr('2ND PLACE', '2-РО МЯСТО'),
      3 => context.tr('3RD PLACE', '3-ТО МЯСТО'),
      _ => context.tr('PARTICIPANT', 'УЧАСТНИК'),
    };
    return ZineBox(
      tilt: index.isOdd ? 1.2 : -1.5,
      pink: b.place == 1,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            color: bg,
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Container(
                  width: 88,
                  height: 88,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: p.card,
                    border: Border.all(color: p.ink, width: 4),
                  ),
                  child: b.place != null
                      ? Text(
                          '${b.place}',
                          style: ZineText.display(48, color: p.ink),
                        )
                      : Icon(LucideIcons.award, size: 44, color: p.ink),
                ),
                const SizedBox(height: 12),
                Transform.rotate(
                  angle: -0.05,
                  child: Text(label, style: ZineText.heavy(26, color: fg)),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: p.ink, width: 3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(b.event, style: ZineText.heavy(24, color: p.ink)),
                const SizedBox(height: 4),
                Text(
                  '${b.org} · ${b.date}',
                  style: TextStyle(fontSize: 12, color: p.mutedFg),
                ),
                const SizedBox(height: 12),
                const DashedLine(),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(LucideIcons.shieldCheck, size: 16, color: p.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        context.tr(
                          'Verified by organiser',
                          'Потвърдено от организатора',
                        ),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Tooltip(
                      message: context.tr('Share badge', 'Сподели значката'),
                      child: Icon(LucideIcons.share2, size: 18, color: p.ink),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String n, label;
  final ZineTone tone;
  const _Stat({required this.n, required this.label, required this.tone});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return ZineBox(
      color: tone.bg(p),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(n, style: ZineText.heavy(40, color: tone.fg(p))),
          const SizedBox(width: 8),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(label, style: ZineText.hand(22, color: tone.fg(p))),
            ),
          ),
        ],
      ),
    );
  }
}
