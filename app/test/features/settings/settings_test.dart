import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/services.dart';
import 'package:nofuture/core/theme/palette.dart';
import 'package:nofuture/features/auth/auth_repo.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<Services> pumpSettings(WidgetTester tester) async {
  SharedPreferences.setMockInitialValues({});
  tester.view.physicalSize = const Size(1400, 1600);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final s = Services.fake();
  await s.auth.signUp('petya@example.com', 'abcdefghi1');
  await s.auth.confirmCode('123456');
  await s.auth.createProfile(
    NewProfile(
      type: AccountType.student,
      username: 'petya',
      displayName: 'Петя',
      birthDate: DateTime(2008, 5, 1),
    ),
  );
  await tester.pumpWidget(
    NoFutureApp(services: s, initialLocation: '/settings'),
  );
  await tester.pumpAndSettle();
  return s;
}

void main() {
  testWidgets('picking a vibe changes the theme', (tester) async {
    final s = await pumpSettings(tester);
    await tester.tap(find.text('Acid'));
    await tester.pumpAndSettle();
    expect(s.theme.vibe, ZineVibe.acid);
  });

  testWidgets('shows the account type', (tester) async {
    await pumpSettings(tester);
    expect(find.text('Role: Candidate'), findsOneWidget);
  });

  testWidgets('log out signs out', (tester) async {
    final s = await pumpSettings(tester);
    await tester.tap(find.text('LOG OUT'));
    await tester.pumpAndSettle();
    expect(s.auth.status, AuthStatus.signedOut);
  });

  testWidgets('delete needs the word DELETE before it works', (tester) async {
    final s = await pumpSettings(tester);
    await tester.tap(find.text('DELETE ACCOUNT'));
    await tester.pumpAndSettle();

    final confirm = find.widgetWithText(FilledButton, 'DELETE FOREVER');
    expect(tester.widget<FilledButton>(confirm).onPressed, isNull);

    await tester.enterText(find.byType(TextField).last, 'delete');
    await tester.pump();
    expect(tester.widget<FilledButton>(confirm).onPressed, isNull);

    await tester.enterText(find.byType(TextField).last, 'DELETE');
    await tester.pump();
    await tester.tap(confirm);
    await tester.pumpAndSettle();

    expect(s.auth.status, AuthStatus.signedOut);
    expect(find.byKey(const ValueKey('page:/')), findsOneWidget);
  });

  testWidgets('cancelling delete keeps the account', (tester) async {
    final s = await pumpSettings(tester);
    await tester.tap(find.text('DELETE ACCOUNT'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('CANCEL'));
    await tester.pumpAndSettle();
    expect(s.auth.status, AuthStatus.signedIn);
  });
}
