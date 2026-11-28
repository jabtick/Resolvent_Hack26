import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/sticky_rail.dart';
import '../../../core/widgets/zine.dart';
import '../feed_sample.dart';

/// `/opp/<id>`: one opportunity in full, UI only
/// (design/lovable, src/routes/opp.$id.tsx). APPLY and SAVE only show a note.
class OppPage extends StatelessWidget {
  final String id;
  const OppPage({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final o = sampleOppById(id);
    if (o == null) {
      return Center(
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          children: [
            Text(
              context.tr('GONE.', 'ИЗЧЕЗНА.'),
              style: ZineText.display(40, color: p.ink),
            ),
            TextButton(
              onPressed: () => context.go('/'),
              child: Text(
                context.tr('back', 'назад'),
                style: ZineText.display(
                  40,
                  color: p.ink,
                ).copyWith(decoration: TextDecoration.underline),
              ),
            ),
          ],
        ),
      );
    }

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1024),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: () => context.go('/'),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.arrowLeft, color: p.ink),
                  const SizedBox(width: 8),
                  Text(
                    context.tr('BACK TO FEED', 'КЪМ ФИЙДА'),
                    style: ZineText.heavy(22, color: p.ink),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            LayoutBuilder(
              builder: (context, c) {
                final main = _Main(o: o);
                final side = _Aside(o: o);
                if (c.maxWidth < 768) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [main, const SizedBox(height: 32), side],
                  );
                }
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: main),
                    const SizedBox(width: 32),
                    SizedBox(width: 300, child: StickyRail(child: side)),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _Main extends StatelessWidget {
  final Opp o;
  const _Main({required this.o});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final fg = o.tone.fg(p);
    final facts = [
      (LucideIcons.wallet, context.tr('Pay', 'Заплащане'), o.amount),
      (LucideIcons.clock, context.tr('Deadline', 'Срок'), o.deadline),
      (LucideIcons.mapPin, context.tr('Location', 'Място'), o.location),
      (
        LucideIcons.globe,
        context.tr('Remote', 'Дистанционно'),
        o.remote ? context.tr('Yes', 'Да') : context.tr('No', 'Не'),
      ),
    ];
    Widget section(String title, Widget body) => Padding(
      padding: const EdgeInsets.only(top: 24),
      child: ZineBox(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [RansomText(title), const SizedBox(height: 12), body],
        ),
      ),
    );
    Widget check(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.circleCheck, color: p.primary),
          const SizedBox(width: 8),
          Expanded(child: Text(t)),
        ],
      ),
    );
    Widget bullet(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text('•  $t'),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ZineBox(
          color: o.tone.bg(p),
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RansomText(oppTypeLabel(context, o.type), size: 22),
              const SizedBox(height: 16),
              Text(o.title, style: ZineText.display(60, color: fg)),
              const SizedBox(height: 12),
              Text(
                '${context.tr('by', 'от')} ${o.org}',
                style: ZineText.hand(28, color: fg),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        LayoutBuilder(
          builder: (context, c) {
            final cols = c.maxWidth < 560 ? 2 : 4;
            final w = (c.maxWidth - 12 * (cols - 1)) / cols;
            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final (icon, label, value) in facts)
                  SizedBox(
                    width: w,
                    child: ZineBox(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(icon, color: p.primary),
                          const SizedBox(height: 4),
                          Text(
                            label,
                            style: TextStyle(fontSize: 12, color: p.mutedFg),
                          ),
                          Text(value, style: ZineText.heavy(24, color: p.ink)),
                        ],
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
        section(
          context.tr('THE DEAL', 'СДЕЛКАТА'),
          Text(
            "${o.desc} We're looking for curious, stubborn people who care "
            "more about what they make than what's on their CV. You'll work "
            'with a small crew, get real responsibility from day one, and a '
            'mentor who actually answers messages.',
            style: const TextStyle(height: 1.5),
          ),
        ),
        section(
          context.tr('WHAT YOU GET', 'КАКВО ПОЛУЧАВАШ'),
          Column(
            children: [
              check('${o.amount} paid on time'),
              check("Mentorship from the org's crew"),
              check('Certificate + reference letter'),
              check('Access to the NO FUTURE? community'),
            ],
          ),
        ),
        section(
          context.tr('WHO WE WANT', 'КОГО ТЪРСИМ'),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              bullet('Student or recent grad (any field, honestly)'),
              bullet('Interest in ${o.field.toLowerCase()}'),
              bullet('A short note on why you — no cover letter essays'),
            ],
          ),
        ),
      ],
    );
  }
}

class _Aside extends StatelessWidget {
  final Opp o;
  const _Aside({required this.o});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    void say(String msg) => ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(msg)));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Taped(
          child: ZineBox(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  context.tr('APPLY VIA US', 'КАНДИДАТСТВАЙ ПРЕЗ НАС'),
                  style: ZineText.heavy(32, color: p.ink),
                ),
                const SizedBox(height: 4),
                Text(
                  context.tr(
                    'We pass your profile to ${o.org} and keep you posted.',
                    'Пращаме профила ти на ${o.org} и те държим в течение.',
                  ),
                  style: TextStyle(fontSize: 13, color: p.mutedFg),
                ),
                const SizedBox(height: 16),
                ZineButton(
                  label: context.tr('APPLY NOW', 'КАНДИДАТСТВАЙ'),
                  pink: true,
                  onPressed: () => say(
                    context.tr(
                      'Application sent to ${o.org}!',
                      'Кандидатурата е пратена до ${o.org}!',
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () =>
                      say(context.tr('Saved for later', 'Запазено за после')),
                  child: Text(
                    context.tr('SAVE', 'ЗАПАЗИ'),
                    style: ZineText.heavy(22, color: p.ink),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        ZineBox(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  InitialsAvatar(o.org[0], tone: o.tone, size: 48),
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
                            Icon(
                              LucideIcons.shieldCheck,
                              size: 12,
                              color: p.mutedFg,
                            ),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                context.tr(
                                  'Verified organiser',
                                  'Проверен организатор',
                                ),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: p.mutedFg,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                context.tr(
                  '${o.likes} punks follow this org · 6 open opportunities',
                  '${o.likes} пънкари следват организацията · 6 отворени възможности',
                ),
                style: const TextStyle(fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
