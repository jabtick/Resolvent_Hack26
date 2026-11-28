import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The UI-only pages (feed, opportunity, saved, calendar, achievements)
/// render at desktop and phone widths without layout errors.
void main() {
  for (final width in [1400.0, 420.0]) {
    for (final (path, text) in [
      ('/', 'ESCAPE'),
      ('/opp/1', 'Backend Rebel Intern'),
      ('/opp/999', 'GONE.'),
      ('/saved', 'SAVED'),
      ('/calendar', 'CALENDAR'),
      ('/achievements', 'BADGES'),
    ]) {
      testWidgets('$path renders at ${width.toInt()}px', (tester) async {
        SharedPreferences.setMockInitialValues({});
        tester.view.physicalSize = Size(width, 1000);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);
        await tester.pumpWidget(
          NoFutureApp(services: Services.fake(), initialLocation: path),
        );
        await tester.pumpAndSettle();
        expect(find.text(text), findsWidgets);
        expect(tester.takeException(), isNull);
      });
    }
  }

  testWidgets('MORE INFO opens the opportunity', (tester) async {
    SharedPreferences.setMockInitialValues({});
    tester.view.physicalSize = const Size(1400, 1000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(NoFutureApp(services: Services.fake()));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('MORE INFO →').first);
    await tester.tap(find.text('MORE INFO →').first);
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('page:/opp/:id')), findsOneWidget);
    expect(find.text('APPLY VIA US'), findsOneWidget);
  });
}
