import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> pumpAt(WidgetTester tester, String path) async {
  SharedPreferences.setMockInitialValues({});
  tester.view.physicalSize = const Size(1400, 900);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    NoFutureApp(services: Services.fake(), initialLocation: path),
  );
  await tester.pumpAndSettle();
}

Future<void> scrollBy(WidgetTester tester, double dy) async {
  final pos = tester
      .state<ScrollableState>(find.byType(Scrollable).first)
      .position;
  pos.jumpTo((pos.pixels + dy).clamp(0, pos.maxScrollExtent));
  await tester.pump();
  await tester.pump(); // the rail reads the previous frame's layout
}

bool onScreen(WidgetTester tester, Finder f) {
  final y = tester.getTopLeft(f).dy;
  return y >= 0 && y < 900;
}

void main() {
  testWidgets('feed side panels follow the scroll', (tester) async {
    await pumpAt(tester, '/');
    expect(onScreen(tester, find.text('HOT RIGHT NOW')), isTrue);
    expect(onScreen(tester, find.text('your stats')), isTrue);

    await scrollBy(tester, 3000);
    expect(onScreen(tester, find.text('HOT RIGHT NOW')), isTrue);
    expect(onScreen(tester, find.text('your stats')), isTrue);
  });

  testWidgets('panels stop at the end of the page', (tester) async {
    await pumpAt(tester, '/');
    await scrollBy(tester, 1e9);
    final railBottom = tester.getBottomLeft(find.text('GOT AN OPPORTUNITY?'));
    expect(railBottom.dy, lessThanOrEqualTo(900));
    expect(tester.takeException(), isNull);
  });

  testWidgets('back at the top the panels are where they started', (
    tester,
  ) async {
    await pumpAt(tester, '/');
    final start = tester.getTopLeft(find.text('HOT RIGHT NOW'));
    await scrollBy(tester, 2000);
    await scrollBy(tester, -1e9);
    expect(tester.getTopLeft(find.text('HOT RIGHT NOW')), start);
  });

  testWidgets('opportunity APPLY panel follows the scroll', (tester) async {
    await pumpAt(tester, '/opp/1');
    await scrollBy(tester, 600);
    expect(onScreen(tester, find.text('APPLY VIA US')), isTrue);
  });
}
