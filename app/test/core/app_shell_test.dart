import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  Future<void> pumpApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(NoFutureApp(services: Services.fake()));
    await tester.pumpAndSettle();
  }

  testWidgets('header shows the brand and the join button', (tester) async {
    await pumpApp(tester);
    expect(find.text('NO FUTURE?'), findsOneWidget);
    expect(find.text('JOIN'), findsOneWidget);
  });

  testWidgets('menu opens with the main sections', (tester) async {
    await pumpApp(tester);
    await tester.tap(find.byTooltip('Menu'));
    await tester.pumpAndSettle();
    for (final item in [
      'Feed',
      'Profile',
      'Calendar',
      'Achievements',
      'Saved',
      'Settings',
    ]) {
      expect(find.text(item), findsWidgets, reason: item);
    }
  });

  testWidgets('opening settings while signed out lands on login', (
    tester,
  ) async {
    await pumpApp(tester);
    await tester.tap(find.byTooltip('Menu'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('page:/login')), findsOneWidget);
  });
}
