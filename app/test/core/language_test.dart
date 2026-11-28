import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/i18n/language.dart';
import 'package:nofuture/core/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<Services> pumpApp(WidgetTester tester, {String path = '/'}) async {
  tester.view.physicalSize = const Size(1400, 1000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final s = Services.fake();
  await s.lang.load();
  await tester.pumpWidget(NoFutureApp(services: s, initialLocation: path));
  await tester.pumpAndSettle();
  return s;
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('English by default', (tester) async {
    final s = await pumpApp(tester);
    expect(s.lang.lang, AppLang.en);
    expect(find.text('JOIN'), findsOneWidget);
  });

  testWidgets('БГ in the menu switches the UI to Bulgarian', (tester) async {
    final s = await pumpApp(tester);
    await tester.tap(find.byTooltip('Menu'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('БГ'));
    await tester.pumpAndSettle();

    expect(s.lang.lang, AppLang.bg);
    expect(find.text('МЕНЮ'), findsOneWidget);
    expect(find.text('Настройки'), findsOneWidget);
    expect(find.text('ВЛЕЗ'), findsOneWidget);
  });

  testWidgets('posts keep the language the organiser wrote them in', (
    tester,
  ) async {
    final s = await pumpApp(tester);
    await s.lang.set(AppLang.bg);
    await tester.pumpAndSettle();

    // UI text is translated…
    expect(find.text('ОЩЕ ИНФО →'), findsWidgets);
    expect(find.text('MORE INFO →'), findsNothing);
    // …but the organiser's title and org name are not.
    expect(find.text('Backend Rebel Intern'), findsWidgets);
    expect(find.text('Riot Code Collective'), findsWidgets);
  });

  testWidgets('the choice is remembered between visits', (tester) async {
    final s = await pumpApp(tester);
    await s.lang.set(AppLang.bg);

    final again = LanguageController();
    await again.load();
    expect(again.lang, AppLang.bg);
  });

  // Bulgarian words are longer: every page must still fit.
  for (final width in [1400.0, 420.0]) {
    for (final path in [
      '/',
      '/opp/1',
      '/saved',
      '/calendar',
      '/achievements',
      '/join',
      '/login',
      '/forgot',
      '/u/ivan',
    ]) {
      testWidgets('$path fits in Bulgarian at ${width.toInt()}px', (
        tester,
      ) async {
        SharedPreferences.setMockInitialValues({'lang': 'bg'});
        tester.view.physicalSize = Size(width, 1000);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);
        final s = Services.fake();
        await s.lang.load();
        await tester.pumpWidget(
          NoFutureApp(services: s, initialLocation: path),
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
      });
    }
  }

  testWidgets('settings has the language switch too', (tester) async {
    final s = Services.fake();
    await s.auth.signUp('petya@example.com', 'abcdefghi1');
    await s.auth.confirmCode('123456');
    tester.view.physicalSize = const Size(1400, 1600);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      NoFutureApp(services: s, initialLocation: '/create-profile'),
    );
    await tester.pumpAndSettle();
    await s.lang.set(AppLang.bg);
    await tester.pumpAndSettle();
    expect(find.text('ТВОЯТ ПРОФИЛ'), findsOneWidget);
  });
}
