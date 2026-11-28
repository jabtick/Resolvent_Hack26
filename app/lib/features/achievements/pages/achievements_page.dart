import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/ui.dart';
import '../achievements_sample.dart';

/// Achievements and badges (owner: Zahari), UI only. The Lovable prototype
/// has no such page, so this one is built from the same zine pieces.
///
/// The badges are [kSampleBadges]. To wire it up: achievements_repo.dart
/// (+ fake_/supabase_), add it to core/services.dart, swap [kSampleBadges]
/// for the badges the organisers issued from their results.
class AchievementsPage extends StatelessWidget {
  const AchievementsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    const badges = kSampleBadges;
    final places = badges.where((b) => b.place != null).length;
    final orgs = badges.map((b) => b.org).toSet().length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PageHeading(
          kicker: context.tr(
            'proof, not promises',
            'доказателства, не обещания',
          ),
          title: context.tr('YOUR ', 'ТВОИТЕ '),
          ransom: context.tr('BADGES', 'ЗНАЧКИ'),
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _Stat(
              n: badges.length,
              label: context.tr('badges', 'значки'),
              tone: ZineTone.accent,
            ),
            _Stat(
              n: places,
              label: context.tr('podium places', 'места на подиума'),
              tone: ZineTone.primary,
            ),
            _Stat(
              n: orgs,
              label: context.tr('organisers', 'организатори'),
              tone: ZineTone.secondary,
            ),
          ],
        ),
        const SizedBox(height: 40),
        ZineGrid(
          columns: (w) =>
              w >= Breakpoints.desktop ? 3 : (w >= Breakpoints.phone ? 2 : 1),
          spacing: 32,
          runSpacing: 40,
          children: [
            for (final (i, b) in badges.indexed) _BadgeCard(b: b, index: i),
          ],
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
                        style: ZineText.small(size: 13),
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

class _BadgeCard extends StatelessWidget {
  final EarnedBadge b;
  final int index;
  const _BadgeCard({required this.b, required this.index});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final (tone, label) = switch (b.place) {
      1 => (ZineTone.accent, context.tr('1ST PLACE', '1-ВО МЯСТО')),
      2 => (ZineTone.secondary, context.tr('2ND PLACE', '2-РО МЯСТО')),
      3 => (ZineTone.primary, context.tr('3RD PLACE', '3-ТО МЯСТО')),
      _ => (null, context.tr('PARTICIPANT', 'УЧАСТНИК')),
    };
    final fg = tone?.fg(p) ?? p.ink;
    return ZineBox(
      tilt: ZineSize.tiltFor(index),
      pink: b.place == 1,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Medal.
          Container(
            color: tone?.bg(p) ?? p.card,
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
          // Event, organiser, verified line.
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: p.ink, width: ZineSize.border),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(b.event, style: ZineText.heavy(24, color: p.ink)),
                const SizedBox(height: 4),
                Text(
                  '${b.org} · ${b.date}',
                  style: ZineText.small(color: p.mutedFg),
                ),
                const SizedBox(height: 12),
                const DashedLine(),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: IconLabel(
                        LucideIcons.shieldCheck,
                        context.tr(
                          'Verified by organiser',
                          'Потвърдено от организатора',
                        ),
                        color: p.ink,
                        iconColor: p.primary,
                        bold: true,
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

/// A coloured counter: "6 badges".
class _Stat extends StatelessWidget {
  final int n;
  final String label;
  final ZineTone tone;
  const _Stat({required this.n, required this.label, required this.tone});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final fg = tone.fg(p);
    return ZineBox(
      color: tone.bg(p),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text('$n', style: ZineText.heavy(40, color: fg)),
          const SizedBox(width: 8),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(label, style: ZineText.hand(22, color: fg)),
            ),
          ),
        ],
      ),
    );
  }
}
