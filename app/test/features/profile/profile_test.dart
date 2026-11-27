import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:nofuture/core/app.dart';
import 'package:nofuture/core/services.dart';
import 'package:nofuture/features/auth/auth_repo.dart';
import 'package:nofuture/features/profile/fake_profile_repo.dart';
import 'package:nofuture/features/auth/fake_auth_repo.dart';
import 'package:nofuture/features/profile/profile_models.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<void> signUpStudent(AuthRepo a, {DateTime? birth}) async {
  await a.signUp('petya@example.com', 'abcdefghi1');
  await a.confirmCode('123456');
  await a.createProfile(
    NewProfile(
      type: AccountType.student,
      username: 'petya',
      displayName: 'Петя Иванова',
      birthDate: birth ?? DateTime(2008, 5, 1),
    ),
  );
}

Future<Services> pumpAt(
  WidgetTester tester,
  String path, {
  Future<void> Function(Services s)? before,
}) async {
  SharedPreferences.setMockInitialValues({});
  tester.view.physicalSize = const Size(1400, 2000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final s = Services.fake();
  if (before != null) await before(s);
  await tester.pumpWidget(NoFutureApp(services: s, initialLocation: path));
  await tester.pumpAndSettle();
  return s;
}

void main() {
  group('fake repo', () {
    test('public profile lookup ignores case', () async {
      final repo = FakeProfileRepo(FakeAuthRepo());
      final p = await repo.loadPublic('IVAN');
      expect(p!.username, 'ivan');
    });

    test('a hidden profile is not public', () async {
      final repo = FakeProfileRepo(FakeAuthRepo());
      expect(await repo.loadPublic('maria'), isNull);
    });

    test('my profile reflects sign-up and edits', () async {
      final auth = FakeAuthRepo();
      final repo = FakeProfileRepo(auth);
      await signUpStudent(auth);
      var me = await repo.loadMine();
      expect(me.username, 'petya');
      expect(me.student!.isPublic, isFalse);
      await repo.updateMine(isPublic: true, bio: 'Обичам математика');
      me = await repo.loadMine();
      expect(me.student!.isPublic, isTrue);
      expect((await repo.loadPublic('petya'))!.bio, 'Обичам математика');
    });

    test(
      'an under-14 without consent stays private even when public',
      () async {
        final auth = FakeAuthRepo();
        final repo = FakeProfileRepo(auth);
        await signUpStudent(auth, birth: DateTime(2020, 1, 1));
        await repo.updateMine(isPublic: true);
        expect(await repo.loadPublic('petya'), isNull);
      },
    );
  });

  test('publicProfileUrl builds /u/<username> on the site origin', () {
    expect(
      publicProfileUrl(
        'petya',
        base: Uri.parse('https://nofuture.netlify.app/profile'),
      ),
      'https://nofuture.netlify.app/u/petya',
    );
  });

  group('my profile page', () {
    testWidgets('a hidden profile says so and offers a switch', (tester) async {
      await pumpAt(tester, '/profile', before: (s) => signUpStudent(s.auth));
      expect(find.text('Петя Иванова'), findsOneWidget);
      expect(find.text('Профилът ти е скрит'), findsOneWidget);
      expect(find.byType(Switch), findsOneWidget);
      await tester.tap(find.byType(Switch));
      await tester.pumpAndSettle();
      expect(find.text('Профилът ти е публичен'), findsOneWidget);
    });

    testWidgets('copy link puts the public URL on the clipboard', (
      tester,
    ) async {
      String? copied;
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        (call) async {
          if (call.method == 'Clipboard.setData') {
            copied = (call.arguments as Map)['text'] as String;
          }
          return null;
        },
      );
      await pumpAt(tester, '/profile', before: (s) => signUpStudent(s.auth));
      await tester.tap(find.text('КОПИРАЙ ЛИНК'));
      await tester.pumpAndSettle();
      expect(copied, endsWith('/u/petya'));
      expect(find.text('Линкът е копиран.'), findsOneWidget);
    });

    testWidgets('edit dialog saves the bio', (tester) async {
      final s = await pumpAt(
        tester,
        '/profile',
        before: (s) => signUpStudent(s.auth),
      );
      await tester.tap(find.text('РЕДАКТИРАЙ'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextFormField, 'За мен'),
        'Здрасти',
      );
      await tester.tap(find.text('ЗАПАЗИ'));
      await tester.pumpAndSettle();
      expect(find.text('Здрасти'), findsOneWidget);
      expect((await s.profiles.loadMine()).student!.bio, 'Здрасти');
    });
  });

  group('public profile page', () {
    testWidgets('shows a public profile without signing in', (tester) async {
      await pumpAt(tester, '/u/ivan');
      expect(find.text('Иван Петров'), findsOneWidget);
      expect(find.text('@ivan'), findsOneWidget);
    });

    testWidgets('going from one profile to another shows the new one', (
      tester,
    ) async {
      await pumpAt(tester, '/u/ivan');
      expect(find.text('Иван Петров'), findsOneWidget);
      GoRouter.of(tester.element(find.text('Иван Петров'))).go('/u/elena');
      await tester.pumpAndSettle();
      expect(find.text('Елена Димитрова'), findsOneWidget);
      expect(find.text('Иван Петров'), findsNothing);
    });

    testWidgets('unknown or hidden username', (tester) async {
      await pumpAt(tester, '/u/maria');
      expect(find.text('Няма такъв профил'), findsOneWidget);
    });
  });

  test('MyProfile initials use the first letters of two words', () {
    expect(initialsOf('Петя Иванова'), 'ПИ');
    expect(initialsOf('ivan'), 'I');
    expect(initialsOf('  '), '?');
  });
}
