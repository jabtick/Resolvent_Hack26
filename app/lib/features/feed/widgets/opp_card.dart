import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/zine.dart';
import '../feed_sample.dart';

/// One opportunity in the feed: a tilted zine "post" with the org, a loud
/// colour block, likes and a MORE INFO button
/// (design/lovable, src/components/OppCard.tsx). Like/save only toggle locally.
class OppCard extends StatefulWidget {
  final Opp opp;
  final int index;
  const OppCard({super.key, required this.opp, required this.index});

  @override
  State<OppCard> createState() => _OppCardState();
}

class _OppCardState extends State<OppCard> {
  bool _liked = false, _saved = false;

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final o = widget.opp;
    final bg = o.tone.bg(p), fg = o.tone.fg(p);
    final ink = BorderSide(color: p.ink, width: 3);
    void open() => context.go('/opp/${o.id}');

    return ZineBox(
      tilt: widget.index.isOdd ? 1.2 : -1.5,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Org row.
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(border: Border(bottom: ink)),
            child: Row(
              children: [
                InitialsAvatar(o.org[0], tone: o.tone),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        o.org,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      Row(
                        children: [
                          Icon(LucideIcons.mapPin, size: 12, color: p.mutedFg),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              '${o.location}'
                              '${o.remote ? context.tr(' · remote ok', ' · може дистанционно') : ''}',
                              style: TextStyle(fontSize: 12, color: p.mutedFg),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                RansomText(oppTypeLabel(context, o.type), size: 18),
              ],
            ),
          ),
          // Colour block.
          Material(
            color: bg,
            child: InkWell(
              onTap: open,
              child: Container(
                decoration: BoxDecoration(border: Border(bottom: ink)),
                // At least 4:3 like the design, taller when a long title needs it.
                child: LayoutBuilder(
                  builder: (context, box) => ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: box.maxWidth * 3 / 4,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '#${oppFieldLabel(context, o.field).toLowerCase()}',
                            style: ZineText.hand(22, color: fg),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            child: Text(
                              o.title,
                              style: ZineText.display(46, color: fg),
                            ),
                          ),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: p.card,
                                    border: Border.all(color: p.ink, width: 3),
                                  ),
                                  child: Text(
                                    o.amount,
                                    style: ZineText.heavy(28, color: p.ink),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Transform.rotate(
                                  angle: -0.1,
                                  child: Text(
                                    '${context.tr('deadline', 'срок')}: ${o.deadline}',
                                    textAlign: TextAlign.right,
                                    style: ZineText.hand(20, color: fg),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          // Actions and blurb.
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    _IconToggle(
                      icon: LucideIcons.heart,
                      on: _liked,
                      onColor: p.primary,
                      label: context.tr('Like', 'Харесай'),
                      onTap: () => setState(() => _liked = !_liked),
                    ),
                    const Spacer(),
                    _IconToggle(
                      icon: LucideIcons.bookmark,
                      on: _saved,
                      onColor: p.ink,
                      label: context.tr('Save', 'Запази'),
                      onTap: () => setState(() => _saved = !_saved),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${o.likes + (_liked ? 1 : 0)} '
                  '${context.tr('punks dig this', 'пънкари харесват това')}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: '${o.org} ',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      TextSpan(text: o.desc),
                    ],
                  ),
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 12),
                ZineButton(
                  label: context.tr('MORE INFO →', 'ОЩЕ ИНФО →'),
                  pink: true,
                  onPressed: open,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _IconToggle extends StatelessWidget {
  final IconData icon;
  final bool on;
  final Color onColor;
  final String label;
  final VoidCallback onTap;
  const _IconToggle({
    required this.icon,
    required this.on,
    required this.onColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Jitter(
    child: IconButton(
      tooltip: label,
      onPressed: onTap,
      icon: Icon(
        icon,
        size: 28,
        color: on ? onColor : context.zine.ink,
        weight: on ? 900 : 400,
      ),
    ),
  );
}
