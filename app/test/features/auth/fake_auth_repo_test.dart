import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app_error.dart';
import 'package:nofuture/features/auth/auth_repo.dart';
import 'package:nofuture/features/auth/fake_auth_repo.dart';

const _student = NewProfile(
  type: AccountType.student,
  username: 'petya',
  displayName: 'Петя',
  birthDate: null,
);

NewProfile _withName(String u) => NewProfile(
  type: AccountType.student,
  username: u,
  displayName: 'Някой',
  birthDate: DateTime(2008, 5, 1),
);

Future<FakeAuthRepo> _awaitingCode() async {
  final repo = FakeAuthRepo();
  await repo.signUp('petya@example.com', 'abcdefghi1');
  return repo;
}

void main() {
  test('starts signed out', () {
    expect(FakeAuthRepo().status, AuthStatus.signedOut);
  });

  test('sign-up waits for the emailed code', () async {
    final repo = await _awaitingCode();
    expect(repo.status, AuthStatus.awaitingCode);
    expect(repo.pendingEmail, 'petya@example.com');
  });

  test('a wrong code is refused and nothing changes', () async {
    final repo = await _awaitingCode();
    await expectLater(repo.confirmCode('000000'), throwsA(isA<AppError>()));
    expect(repo.status, AuthStatus.awaitingCode);
  });

  test('the right code leads to creating a profile', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    expect(repo.status, AuthStatus.needsProfile);
    expect(repo.userId, isNotNull);
  });

  test('a taken username (any case) keeps needsProfile', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await expectLater(
      repo.createProfile(_withName('IVAN')),
      throwsA(
        isA<AppError>().having(
          (e) => e.message,
          'message',
          'Това потребителско име е заето',
        ),
      ),
    );
    expect(repo.status, AuthStatus.needsProfile);
  });

  test('a free username signs in', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await repo.createProfile(_withName('petya'));
    expect(repo.status, AuthStatus.signedIn);
  });

  test('a student without a birth date is refused', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await expectLater(repo.createProfile(_student), throwsA(isA<AppError>()));
  });

  test('sign in with the right password', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await repo.createProfile(_withName('petya'));
    await repo.signOut();
    expect(repo.status, AuthStatus.signedOut);
    await repo.signIn('petya@example.com', 'abcdefghi1');
    expect(repo.status, AuthStatus.signedIn);
  });

  test('sign in with a wrong password is refused', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await repo.signOut();
    await expectLater(
      repo.signIn('petya@example.com', 'wrongpass1'),
      throwsA(isA<AppError>()),
    );
    expect(repo.status, AuthStatus.signedOut);
  });

  test('sign in to an account without a profile asks for one', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await repo.signOut();
    await repo.signIn('petya@example.com', 'abcdefghi1');
    expect(repo.status, AuthStatus.needsProfile);
  });

  test('password reset with the code changes the password', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await repo.createProfile(_withName('petya'));
    await repo.signOut();
    await repo.sendPasswordReset('petya@example.com');
    await repo.resetPassword('petya@example.com', '123456', 'novaparola2');
    expect(repo.status, AuthStatus.signedIn);
    await repo.signOut();
    await repo.signIn('petya@example.com', 'novaparola2');
    expect(repo.status, AuthStatus.signedIn);
  });

  test('delete account signs out and frees the username', () async {
    final repo = await _awaitingCode();
    await repo.confirmCode('123456');
    await repo.createProfile(_withName('petya'));
    await repo.deleteAccount();
    expect(repo.status, AuthStatus.signedOut);
    await repo.signUp('other@example.com', 'abcdefghi1');
    await repo.confirmCode('123456');
    await repo.createProfile(_withName('petya'));
    expect(repo.status, AuthStatus.signedIn);
  });

  test('every status change notifies listeners', () async {
    final repo = FakeAuthRepo();
    var n = 0;
    repo.addListener(() => n++);
    await repo.signUp('petya@example.com', 'abcdefghi1');
    await repo.confirmCode('123456');
    await repo.createProfile(_withName('petya'));
    expect(n, 3);
  });
}
