import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/features/auth/validators.dart';

void main() {
  group('validatePassword (≥10, a letter and a digit)', () {
    test('too short', () => expect(validatePassword('short1'), isNotNull));
    test('no digit', () => expect(validatePassword('abcdefghij'), isNotNull));
    test('no letter', () => expect(validatePassword('1234567890'), isNotNull));
    test('ok', () => expect(validatePassword('abcdefghi1'), isNull));
    test(
      'Cyrillic letters count',
      () => expect(validatePassword('паролапаро1'), isNull),
    );
  });

  group('validateUsername (DB regex ^[A-Za-z0-9_.-]{3,30}\$)', () {
    test('too short', () => expect(validateUsername('ab'), isNotNull));
    test(
      'Cyrillic not allowed',
      () => expect(validateUsername('иван'), isNotNull),
    );
    test(
      'spaces not allowed',
      () => expect(validateUsername('ivan p'), isNotNull),
    );
    test(
      '31 chars too long',
      () => expect(validateUsername('a' * 31), isNotNull),
    );
    test('ok', () => expect(validateUsername('ivan_99'), isNull));
    test(
      'dots and dashes ok',
      () => expect(validateUsername('i.v-an'), isNull),
    );
  });

  group('validateEmail', () {
    test('empty', () => expect(validateEmail(''), isNotNull));
    test('no @', () => expect(validateEmail('ivan.example.com'), isNotNull));
    test('ok', () => expect(validateEmail('ivan@example.com'), isNull));
    test(
      'trims spaces',
      () => expect(validateEmail('  ivan@example.com '), isNull),
    );
  });

  group('isUnder14', () {
    test(
      'one day before the 14th birthday',
      () => expect(
        isUnder14(DateTime(2013, 11, 28), DateTime(2027, 11, 27)),
        isTrue,
      ),
    );
    test(
      'on the 14th birthday',
      () => expect(
        isUnder14(DateTime(2013, 11, 27), DateTime(2027, 11, 27)),
        isFalse,
      ),
    );
    test(
      'born 29 Feb, non-leap year',
      () => expect(
        isUnder14(DateTime(2012, 2, 29), DateTime(2026, 3, 1)),
        isFalse,
      ),
    );
  });

  group('length limits match the DB checks', () {
    test(
      'display name required',
      () => expect(validateDisplayName('  '), isNotNull),
    );
    test(
      'display name 80 ok',
      () => expect(validateDisplayName('а' * 80), isNull),
    );
    test(
      'display name 81 too long',
      () => expect(validateDisplayName('а' * 81), isNotNull),
    );
    test('org name 120 ok', () => expect(validateOrgName('а' * 120), isNull));
    test(
      'org name 121 too long',
      () => expect(validateOrgName('а' * 121), isNotNull),
    );
  });
}
