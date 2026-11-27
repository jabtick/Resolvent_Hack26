import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/app_error.dart';
import 'package:nofuture/features/auth/auth_error_mapper.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

String _msg(Object e) => mapAuthError(e).message;

void main() {
  test('unique violation = username taken', () {
    expect(
      _msg(const PostgrestException(message: 'dup', code: '23505')),
      'Това потребителско име е заето',
    );
  });

  test('username check violation = bad format', () {
    expect(
      _msg(const PostgrestException(message: 'check', code: '23514')),
      'Някое поле е невалидно. Провери името и данните.',
    );
  });

  test('expired or wrong code', () {
    expect(
      _msg(
        const AuthException(
          'Token has expired or is invalid',
          code: 'otp_expired',
        ),
      ),
      'Кодът е грешен или изтекъл.',
    );
  });

  test('email rate limit', () {
    expect(
      _msg(
        const AuthException(
          'slow down',
          statusCode: '429',
          code: 'over_email_send_rate_limit',
        ),
      ),
      'Изчакай минута и опитай пак.',
    );
  });

  test('wrong credentials', () {
    expect(
      _msg(
        const AuthException(
          'Invalid login credentials',
          code: 'invalid_credentials',
        ),
      ),
      'Грешен имейл или парола.',
    );
  });

  test('email not confirmed', () {
    expect(
      _msg(
        const AuthException('Email not confirmed', code: 'email_not_confirmed'),
      ),
      'Имейлът още не е потвърден. Въведи кода от писмото.',
    );
  });

  test('already registered', () {
    expect(
      _msg(
        const AuthException(
          'User already registered',
          code: 'user_already_exists',
        ),
      ),
      'Вече има акаунт с този имейл. Влез.',
    );
  });

  test('weak password from the server', () {
    expect(
      _msg(const AuthException('weak', code: 'weak_password')),
      'Паролата е твърде слаба: поне 10 знака, букви и цифри.',
    );
  });

  test('edge function rate limit', () {
    expect(
      _msg(const FunctionException(status: 429)),
      'Твърде много опити. Опитай по-късно.',
    );
  });

  test('an AppError passes through unchanged', () {
    expect(_msg(const AppError('Въведи име.')), 'Въведи име.');
  });

  test('anything else is a generic message', () {
    expect(_msg(Exception('boom')), 'Нещо се обърка. Опитай пак.');
  });
}
