import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  for (final (path, title, owner) in [
    ('/', 'ФИЙД', 'Гошо'),
    ('/calendar', 'КАЛЕНДАР', 'Ники'),
    ('/achievements', 'ПОСТИЖЕНИЯ', 'Захари'),
  ]) {
    testWidgets('$path shows its title and owner', (tester) async {
      SharedPreferences.setMockInitialValues({});
      tester.view.physicalSize = const Size(1400, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        NoFutureApp(services: Services.fake(), initialLocation: path),
      );
      await tester.pumpAndSettle();
      expect(find.text(title), findsOneWidget);
      expect(find.textContaining(owner), findsOneWidget);
    });
  }
}
