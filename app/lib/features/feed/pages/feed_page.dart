import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/sticky_rail.dart';
import '../../../core/widgets/zine.dart';
import '../feed_sample.dart';
import '../widgets/opp_card.dart';

/// The feed (owner: Gosho), UI only — a copy of the Lovable home page
/// (design/lovable, src/routes/index.tsx).
///
/// Nothing here filters or searches yet: the search box, chips and counters
/// only look right. To wire it up, add feed_repo.dart (+ fake_/supabase_)
/// and replace [kSampleOpps] and the hard-coded numbers. See app/README.md.
class FeedPage extends StatelessWidget {
  const FeedPage({super.key});

  @override
  Widget build(BuildContext context) {
    // The design's `lg:` breakpoint is on the screen width. (A LayoutBuilder
    // here trips a framework assertion when the search TextField is disposed.)
    const main = _FeedMain();
    if (MediaQuery.sizeOf(context).width < 1024) return main;
    return const Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 220, child: StickyRail(child: _LeftRail())),
        SizedBox(width: 32),
        Expanded(child: main),
        SizedBox(width: 32),
        SizedBox(width: 260, child: StickyRail(child: _RightRail())),
      ],
    );
  }
}

class _FeedMain extends StatelessWidget {
  const _FeedMain();

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final opps = kSampleOpps;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text.rich(
          TextSpan(
            style: ZineText.heavy(60, color: p.ink),
            children: [
              TextSpan(text: context.tr('FIND YOUR ', 'НАМЕРИ СВОЯ ')),
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: RansomText(
                  context.tr('ESCAPE', 'ИЗХОД'),
                  background: p.primary,
                  size: 60,
                ),
              ),
              TextSpan(text: context.tr('\nFROM THE ', '\nОТ ')),
              TextSpan(
                text: '9–5',
                style: ZineText.hand(64, color: p.primary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const _SearchAndFilter(),
        const SizedBox(height: 16),
        Text.rich(
          TextSpan(
            style: ZineText.hand(24, color: p.ink),
            children: [
              TextSpan(
                text: context.tr(
                  '${opps.length} results. ',
                  '${opps.length} резултата. ',
                ),
              ),
              TextSpan(
                text: context.tr(
                  'no gods, no masters.',
                  'без богове, без господари.',
                ),
                style: TextStyle(color: p.primary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        for (final (i, o) in opps.indexed) ...[
          OppCard(opp: o, index: i),
          const SizedBox(height: 40),
        ],
      ],
    );
  }
}

/// Search box + FILTER toggle. The panel opens and chips light up, but the
/// list does not change yet.
class _SearchAndFilter extends StatefulWidget {
  const _SearchAndFilter();

  @override
  State<_SearchAndFilter> createState() => _SearchAndFilterState();
}

class _SearchAndFilterState extends State<_SearchAndFilter> {
  bool _open = false, _remote = false;
  final _picked = <String>{};

  void _toggle(String v) =>
      setState(() => _picked.contains(v) ? _picked.remove(v) : _picked.add(v));

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final active = _picked.length + (_remote ? 1 : 0);
    final narrow = MediaQuery.sizeOf(context).width < 480;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: ZineBox(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    Icon(LucideIcons.search, color: p.ink),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: context.tr(
                            'search orgs, gigs, cities...',
                            'търси организации, обяви, градове...',
                          ),
                          filled: false,
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            Jitter(
              child: ZineBox(
                color: p.secondary,
                padding: EdgeInsets.zero,
                child: Material(
                  type: MaterialType.transparency,
                  child: InkWell(
                    onTap: () => setState(() => _open = !_open),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 13,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            LucideIcons.slidersHorizontal,
                            size: 20,
                            color: Color(0xFF070707),
                          ),
                          if (!narrow) ...[
                            const SizedBox(width: 8),
                            Text(
                              context.tr('FILTER', 'ФИЛТЪР'),
                              style: ZineText.heavy(
                                22,
                                color: const Color(0xFF070707),
                              ),
                            ),
                          ],
                          if (active > 0) ...[
                            const SizedBox(width: 6),
                            RansomText('$active', size: 20),
                          ],
                          const SizedBox(width: 4),
                          AnimatedRotation(
                            turns: _open ? .5 : 0,
                            duration: const Duration(milliseconds: 150),
                            child: const Icon(
                              LucideIcons.chevronDown,
                              size: 16,
                              color: Color(0xFF070707),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_open) ...[
          const SizedBox(height: 20),
          Taped(
            child: ZineBox(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _chipGroup(
                    context.tr('what kinda deal?', 'какво търсиш?'),
                    kOppTypes,
                    oppTypeLabel,
                  ),
                  const SizedBox(height: 16),
                  _chipGroup(
                    context.tr('your scene', 'твоята сцена'),
                    kOppFields,
                    oppFieldLabel,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      ZineChip(
                        context.tr('REMOTE ONLY', 'САМО ДИСТАНЦИОННО'),
                        selected: _remote,
                        onTap: () => setState(() => _remote = !_remote),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => setState(() {
                          _picked.clear();
                          _remote = false;
                        }),
                        child: Text(
                          context.tr('wipe it all', 'изчисти всичко'),
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _chipGroup(
    String title,
    List<String> options,
    String Function(BuildContext, String) label,
  ) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(title, style: ZineText.hand(22, color: context.zine.ink)),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          for (final t in options)
            ZineChip(
              label(context, t),
              selected: _picked.contains(t),
              onTap: () => _toggle(t),
            ),
        ],
      ),
    ],
  );
}

/// Left column: who you are and your numbers (all sample values).
class _LeftRail extends StatelessWidget {
  const _LeftRail();

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    Widget stat(String l, String v) => Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          Expanded(child: Text(l, style: const TextStyle(fontSize: 13))),
          Text(v, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ZineBox(
          child: Column(
            children: [
              const InitialsAvatar('HK', size: 64),
              const SizedBox(height: 8),
              Text('Hristo K.', style: ZineText.heavy(24, color: p.ink)),
              const SizedBox(height: 4),
              Text(
                '${context.tr('Candidate', 'Кандидат')} · Sofia',
                style: TextStyle(fontSize: 12, color: p.mutedFg),
              ),
              const SizedBox(height: 12),
              _OutlineLink(
                context.tr('VIEW PROFILE', 'ВИЖ ПРОФИЛА'),
                onTap: () => context.go('/profile'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ZineBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                context.tr('your stats', 'твоите числа'),
                style: ZineText.hand(22, color: p.ink),
              ),
              stat(context.tr('Applied', 'Кандидатствал'), '4'),
              stat(context.tr('Saved', 'Запазени'), '9'),
              stat(context.tr('Profile views', 'Прегледи на профила'), '57'),
            ],
          ),
        ),
      ],
    );
  }
}

/// Right column: hot list, counters, call to organisers (sample values).
class _RightRail extends StatelessWidget {
  const _RightRail();

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    const onAccent = Color(0xFF070707);
    Widget counter(IconData icon, String n, String l) => Expanded(
      child: Column(
        children: [
          Icon(icon, color: onAccent),
          Text(n, style: ZineText.heavy(24, color: onAccent)),
          Text(l, style: const TextStyle(fontSize: 12, color: onAccent)),
        ],
      ),
    );
    final hot = kSampleOpps.take(4).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ZineBox(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Icon(LucideIcons.flame, color: p.primary),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      context.tr('HOT RIGHT NOW', 'ГОРЕЩО СЕГА'),
                      style: ZineText.heavy(24, color: p.ink),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              for (final (i, o) in hot.indexed) ...[
                InkWell(
                  onTap: () => context.go('/opp/${o.id}'),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          o.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            height: 1.2,
                          ),
                        ),
                        Text(
                          '${o.org} · ${o.deadline}',
                          style: TextStyle(fontSize: 12, color: p.mutedFg),
                        ),
                      ],
                    ),
                  ),
                ),
                if (i < hot.length - 1) const DashedLine(),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        ZineBox(
          color: p.accent,
          child: Row(
            children: [
              counter(
                LucideIcons.building2,
                '120',
                context.tr('orgs', 'организации'),
              ),
              counter(
                LucideIcons.users,
                '3.4k',
                context.tr('punks', 'пънкари'),
              ),
              counter(LucideIcons.zap, '48', context.tr('new', 'нови')),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Jitter(
          child: ZineBox(
            pink: true,
            color: p.ink,
            padding: EdgeInsets.zero,
            child: Material(
              type: MaterialType.transparency,
              child: InkWell(
                onTap: () => context.go('/join'),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('GOT AN OPPORTUNITY?', 'ИМАШ ВЪЗМОЖНОСТ?'),
                        style: ZineText.heavy(24, color: p.background),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        context.tr(
                          'Post it as an organiser →',
                          'Публикувай я като организатор →',
                        ),
                        style: TextStyle(fontSize: 13, color: p.background),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _OutlineLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _OutlineLink(this.label, {required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Jitter(
      child: Material(
        type: MaterialType.transparency,
        shape: Border.all(color: p.ink, width: 3),
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Center(
              child: Text(label, style: ZineText.heavy(18, color: p.ink)),
            ),
          ),
        ),
      ),
    );
  }
}
