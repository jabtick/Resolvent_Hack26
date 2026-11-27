import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/app_error.dart';

/// Turns anything Supabase throws into a Bulgarian [AppError] for the screen.
AppError mapAuthError(Object e) {
  if (e is AppError) return e;
  if (e is PostgrestException) {
    return switch (e.code) {
      '23505' => const AppError('Това потребителско име е заето'),
      '23514' || '22001' || '23502' => const AppError(
        'Някое поле е невалидно. Провери името и данните.',
      ),
      '42501' => const AppError('Нямаш права за това.'),
      _ => const AppError('Нещо се обърка. Опитай пак.'),
    };
  }
  if (e is AuthException) {
    final code = e.code ?? '';
    if (code == 'otp_expired' || e.message.contains('expired or is invalid')) {
      return const AppError('Кодът е грешен или изтекъл.');
    }
    if (e.statusCode == '429' || code.startsWith('over_')) {
      return const AppError('Изчакай минута и опитай пак.');
    }
    return switch (code) {
      'invalid_credentials' => const AppError('Грешен имейл или парола.'),
      'email_not_confirmed' => const AppError(
        'Имейлът още не е потвърден. Въведи кода от писмото.',
      ),
      'user_already_exists' ||
      'email_exists' => const AppError('Вече има акаунт с този имейл. Влез.'),
      'weak_password' => const AppError(
        'Паролата е твърде слаба: поне 10 знака, букви и цифри.',
      ),
      'reauthentication_needed' => const AppError('Влез отново и опитай пак.'),
      _ => const AppError('Нещо се обърка. Опитай пак.'),
    };
  }
  if (e is FunctionException && e.status == 429) {
    return const AppError('Твърде много опити. Опитай по-късно.');
  }
  return const AppError('Нещо се обърка. Опитай пак.');
}
