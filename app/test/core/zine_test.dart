import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/theme/app_theme.dart';
import 'package:nofuture/core/theme/palette.dart';
import 'package:nofuture/core/widgets/zine.dart';

Widget _wrap(Widget child) => MaterialApp(
  theme: buildTheme(ZineVibe.zine),
  home: Scaffold(body: Center(child: child)),
);

BoxDecoration _decorationOf(WidgetTester tester) {
  final box = tester.widget<DecoratedBox>(
    find
        .descendant(
          of: find.byType(ZineBox),
          matching: find.byType(DecoratedBox),
        )
        .first,
  );
  return box.decoration as BoxDecoration;
}

void main() {
  testWidgets('ZineBox has a 3px ink border and a hard ink shadow', (
    tester,
  ) async {
    await tester.pumpWidget(_wrap(const ZineBox(child: Text('x'))));
    final d = _decorationOf(tester);
    final ink = Palette.of(ZineVibe.zine).ink;
    expect(d.border, Border.all(color: ink, width: 3));
    expect(d.boxShadow, [
      BoxShadow(color: ink, offset: const Offset(6, 6), blurRadius: 0),
    ]);
  });

  testWidgets('pink ZineBox casts a primary shadow', (tester) async {
    await tester.pumpWidget(_wrap(const ZineBox(pink: true, child: Text('x'))));
    final d = _decorationOf(tester);
    expect(d.boxShadow!.single.color, Palette.of(ZineVibe.zine).primary);
    expect(d.boxShadow!.single.offset, const Offset(6, 6));
  });

  testWidgets('RansomText shows paper text on ink', (tester) async {
    await tester.pumpWidget(_wrap(const RansomText('ПРОФИЛ')));
    expect(find.text('ПРОФИЛ'), findsOneWidget);
    final p = Palette.of(ZineVibe.zine);
    final container = tester.widget<ColoredBox>(
      find.descendant(
        of: find.byType(RansomText),
        matching: find.byType(ColoredBox),
      ),
    );
    expect(container.color, p.ink);
    final text = tester.widget<Text>(find.text('ПРОФИЛ'));
    expect(text.style!.color, p.background);
  });

  testWidgets('ZineButton calls back and is disabled without a callback', (
    tester,
  ) async {
    var taps = 0;
    await tester.pumpWidget(
      _wrap(
        Column(
          children: [
            ZineButton(label: 'ВХОД', onPressed: () => taps++),
            const ZineButton(label: 'ЧАКАЙ', onPressed: null),
          ],
        ),
      ),
    );
    await tester.tap(find.text('ВХОД'));
    await tester.tap(find.text('ЧАКАЙ'));
    expect(taps, 1);
  });

  testWidgets('HalftoneBackground renders its child', (tester) async {
    await tester.pumpWidget(_wrap(const HalftoneBackground(child: Text('в'))));
    expect(find.text('в'), findsOneWidget);
  });
}
