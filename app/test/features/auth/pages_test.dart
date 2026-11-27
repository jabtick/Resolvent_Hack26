import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/services.dart';
import 'package:nofuture/features/auth/auth_repo.dart';
import 'package:nofuture/features/auth/pages/create_profile_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<Services> pumpAt(
  WidgetTester tester,
  String path, {
  Future<void> Function(Services s)? before,
}) async {
  SharedPreferences.setMockInitialValues({});
  tester.view.physicalSize = const Size(1400, 1800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final s = Services.fake();
  if (before != null) await before(s);
  await tester.pumpWidget(NoFutureApp(services: s, initialLocation: path));
  await tester.pumpAndSettle();
  return s;
}

Future<void> toCode(Services s) =>
    s.auth.signUp('petya@example.com', 'abcdefghi1');
Future<void> toProfile(Services s) async {
  await toCode(s);
  await s.auth.confirmCode('123456');
}

Finder field(String label) => find.widgetWithText(TextFormField, label);

void main() {
  group('join', () {
    testWidgets('asks which side first', (tester) async {
      await pumpAt(tester, '/join');
      expect(find.text('УЧЕНИК'), findsOneWidget);
      expect(find.text('ОРГАНИЗАТОР'), findsOneWidget);
    });

    testWidgets('a weak password is refused before calling the server', (
      tester,
    ) async {
      final s = await pumpAt(tester, '/join');
      await tester.tap(find.text('УЧЕНИК'));
      await tester.pumpAndSettle();
      await tester.enterText(field('Имейл'), 'petya@example.com');
      await tester.enterText(field('Парола'), 'abc');
      await tester.tap(find.text('ДАВАЙ'));
      await tester.pumpAndSettle();
      expect(find.text('Паролата трябва да е поне 10 знака.'), findsOneWidget);
      expect(s.auth.status, AuthStatus.signedOut);
    });

    testWidgets('a good sign-up goes to the code page', (tester) async {
      final s = await pumpAt(tester, '/join');
      await tester.tap(find.text('ОРГАНИЗАТОР'));
      await tester.pumpAndSettle();
      await tester.enterText(field('Имейл'), 'org@example.com');
      await tester.enterText(field('Парола'), 'abcdefghi1');
      await tester.tap(find.text('ДАВАЙ'));
      await tester.pumpAndSettle();
      expect(s.auth.status, AuthStatus.awaitingCode);
      expect(find.byKey(const ValueKey('page:/code')), findsOneWidget);
      expect(s.signupDraft.side, AccountType.organizer);
    });
  });

  group('code', () {
    testWidgets('a wrong code shows an error', (tester) async {
      await pumpAt(tester, '/code', before: toCode);
      await tester.enterText(field('Код'), '000000');
      await tester.tap(find.text('ПОТВЪРДИ'));
      await tester.pumpAndSettle();
      expect(find.text('Кодът е грешен или изтекъл.'), findsOneWidget);
      expect(find.byKey(const ValueKey('page:/code')), findsOneWidget);
    });

    testWidgets('the right code leads to create-profile', (tester) async {
      await pumpAt(tester, '/code', before: toCode);
      await tester.enterText(field('Код'), '123456');
      await tester.tap(find.text('ПОТВЪРДИ'));
      await tester.pumpAndSettle();
      expect(
        find.byKey(const ValueKey('page:/create-profile')),
        findsOneWidget,
      );
    });
  });

  group('create profile', () {
    Future<void> fillStudent(
      WidgetTester tester, {
      String username = 'petya',
      String birth = '01.05.2008',
    }) async {
      await tester.enterText(field('Потребителско име'), username);
      await tester.enterText(field('Име'), 'Петя');
      await tester.enterText(field('Дата на раждане (ДД.ММ.ГГГГ)'), birth);
      await tester.pumpAndSettle();
    }

    testWidgets('submit is disabled until the terms are accepted', (
      tester,
    ) async {
      final s = await pumpAt(tester, '/create-profile', before: toProfile);
      await fillStudent(tester);
      await tester.tap(find.text('СЪЗДАЙ ПРОФИЛ'));
      await tester.pumpAndSettle();
      expect(s.auth.status, AuthStatus.needsProfile);
      await tester.tap(find.byType(Checkbox));
      await tester.pump();
      await tester.tap(find.text('СЪЗДАЙ ПРОФИЛ'));
      await tester.pumpAndSettle();
      expect(s.auth.status, AuthStatus.signedIn);
    });

    testWidgets('an under-14 student is told the profile stays hidden', (
      tester,
    ) async {
      await pumpAt(tester, '/create-profile', before: toProfile);
      await fillStudent(tester, birth: '01.01.2020');
      expect(
        find.text('Профилът ти ще е скрит, докато родител не даде съгласие.'),
        findsOneWidget,
      );
    });

    testWidgets('a taken username keeps the page with a message', (
      tester,
    ) async {
      final s = await pumpAt(tester, '/create-profile', before: toProfile);
      await fillStudent(tester, username: 'IVAN');
      await tester.tap(find.byType(Checkbox));
      await tester.pump();
      await tester.tap(find.text('СЪЗДАЙ ПРОФИЛ'));
      await tester.pumpAndSettle();
      expect(find.text('Това потребителско име е заето'), findsOneWidget);
      expect(s.auth.status, AuthStatus.needsProfile);
    });

    testWidgets('organizer asks for the organization instead of a birth date', (
      tester,
    ) async {
      await pumpAt(
        tester,
        '/create-profile',
        before: (s) async {
          s.signupDraft.side = AccountType.organizer;
          await toProfile(s);
        },
      );
      expect(field('Име на организацията'), findsOneWidget);
      expect(field('Дата на раждане (ДД.ММ.ГГГГ)'), findsNothing);
    });
  });

  group('login and forgot', () {
    testWidgets('wrong password shows an error', (tester) async {
      await pumpAt(tester, '/login');
      await tester.enterText(field('Имейл'), 'nobody@example.com');
      await tester.enterText(field('Парола'), 'abcdefghi1');
      await tester.tap(find.text('ВЛИЗАМ'));
      await tester.pumpAndSettle();
      expect(find.text('Грешен имейл или парола.'), findsOneWidget);
    });

    testWidgets('forgot password: code + new password signs in', (
      tester,
    ) async {
      final s = await pumpAt(
        tester,
        '/forgot',
        before: (s) async {
          await toProfile(s);
          await s.auth.createProfile(
            NewProfile(
              type: AccountType.student,
              username: 'petya',
              displayName: 'Петя',
              birthDate: DateTime(2008, 5, 1),
            ),
          );
          await s.auth.signOut();
        },
      );
      await tester.enterText(field('Имейл'), 'petya@example.com');
      await tester.tap(find.text('ПРАТИ КОД'));
      await tester.pumpAndSettle();
      await tester.enterText(field('Код'), '123456');
      await tester.enterText(field('Нова парола'), 'novaparola2');
      await tester.tap(find.text('СМЕНИ ПАРОЛАТА'));
      await tester.pumpAndSettle();
      expect(s.auth.status, AuthStatus.signedIn);
    });
  });

  test('parseBgDate reads DD.MM.YYYY and rejects nonsense', () {
    expect(parseBgDate('01.05.2008'), DateTime(2008, 5, 1));
    expect(parseBgDate('1.5.2008'), DateTime(2008, 5, 1));
    expect(parseBgDate('31.02.2008'), isNull);
    expect(parseBgDate('2008-05-01'), isNull);
    expect(parseBgDate('01.05.1899'), isNull);
  });
}
