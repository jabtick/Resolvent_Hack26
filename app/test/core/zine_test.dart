import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/ui.dart';

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

  testWidgets('ZineBox with onTap is tappable', (tester) async {
    var taps = 0;
    await tester.pumpWidget(
      _wrap(ZineBox(onTap: () => taps++, child: const Text('tap'))),
    );
    await tester.tap(find.text('tap'));
    expect(taps, 1);
  });

  testWidgets('bright ZineButton is lime with dark text', (tester) async {
    await tester.pumpWidget(
      _wrap(
        ZineButton(label: 'ADD', kind: ZineButtonKind.bright, onPressed: () {}),
      ),
    );
    final p = Palette.of(ZineVibe.zine);
    expect(_decorationOf(tester).color, p.secondary);
    expect(tester.widget<Text>(find.text('ADD')).style!.color, p.onBright);
  });

  testWidgets('ZineGrid splits the width into columns', (tester) async {
    await tester.pumpWidget(
      _wrap(
        SizedBox(
          width: 416,
          child: ZineGrid(
            columns: (w) => 2,
            spacing: 16,
            children: const [Text('a'), Text('b')],
          ),
        ),
      ),
    );
    final boxes = tester.widgetList<SizedBox>(
      find.descendant(of: find.byType(Wrap), matching: find.byType(SizedBox)),
    );
    expect(boxes.map((b) => b.width), [200, 200]);
  });

  testWidgets('PageHeading shows kicker, title and ransom words', (
    tester,
  ) async {
    await tester.pumpWidget(
      _wrap(
        const PageHeading(kicker: 'hello', title: 'YOUR ', ransom: 'BADGES'),
      ),
    );
    expect(find.text('hello'), findsOneWidget);
    expect(find.byType(RansomText), findsOneWidget);
  });

  testWidgets('dates follow the language', (tester) async {
    final lang = LanguageController();
    late BuildContext ctx;
    await tester.pumpWidget(
      LanguageScope(
        controller: lang,
        child: Builder(
          builder: (c) {
            ctx = c;
            return const SizedBox();
          },
        ),
      ),
    );
    final d = DateTime(2026, 12, 3, 9, 5);
    expect(ctx.shortDate(d), '03 Dec');
    expect(ctx.weekdayName(d.weekday), 'Thursday');
    expect(hhmm(d), '09:05');
    lang.set(AppLang.bg);
    await tester.pump();
    expect(ctx.shortDate(d), '03 дек');
    expect(ctx.weekdayInitials.first, 'Пн');
  });
}
