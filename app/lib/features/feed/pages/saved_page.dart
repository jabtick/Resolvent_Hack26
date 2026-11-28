import 'package:flutter/material.dart';

import '../../../core/ui.dart';
import '../feed_sample.dart';
import '../widgets/opp_card.dart';

/// `/saved`: opportunities saved for later, UI only
/// (design/lovable, src/routes/saved.tsx). Shows every third sample.
class SavedPage extends StatelessWidget {
  const SavedPage({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final saved = kSampleOpps.where((o) => o.id % 3 == 0).toList();
    return PageColumn(
      maxWidth: PageWidth.wide,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.end,
            spacing: 12,
            children: [
              Text(
                context.tr('SAVED', 'ЗАПАЗЕНИ'),
                style: ZineText.heavy(60, color: p.ink),
              ),
              Text(
                context.tr('for later, punk', 'за после, пънкар'),
                style: ZineText.hand(32, color: p.primary),
              ),
            ],
          ),
          const SizedBox(height: 32),
          ZineGrid(
            columns: (w) => w >= Breakpoints.tablet ? 2 : 1,
            spacing: 40,
            children: [
              for (final (i, o) in saved.indexed) OppCard(opp: o, index: i),
            ],
          ),
        ],
      ),
    );
  }
}
