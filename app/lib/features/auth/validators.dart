// Form checks. Each returns a Bulgarian message, or null when the value is ok.
// The rules match the server: supabase/config.toml (password) and the
// profiles.username check in the profiles_feed migration.

final _usernameRe = RegExp(r'^[A-Za-z0-9_.-]{3,30}$');
final _letterRe = RegExp(r'\p{L}', unicode: true);
final _digitRe = RegExp(r'\d');
final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

String? validatePassword(String v) {
  if (v.length < 10) return 'Паролата трябва да е поне 10 знака.';
  if (!_letterRe.hasMatch(v) || !_digitRe.hasMatch(v)) {
    return 'Паролата трябва да има поне една буква и една цифра.';
  }
  return null;
}

String? validateUsername(String v) {
  if (!_usernameRe.hasMatch(v)) {
    return '3–30 знака: латински букви, цифри, _ . -';
  }
  return null;
}

String? validateEmail(String v) {
  if (!_emailRe.hasMatch(v.trim())) return 'Въведи валиден имейл.';
  return null;
}

/// True until the day of the 14th birthday (needs parental consent, ЗЗЛД).
bool isUnder14(DateTime birthDate, DateTime today) {
  var age = today.year - birthDate.year;
  final hadBirthday =
      today.month > birthDate.month ||
      (today.month == birthDate.month && today.day >= birthDate.day);
  if (!hadBirthday) age--;
  return age < 14;
}

String? _required(String v, int max) {
  if (v.trim().isEmpty) return 'Попълни полето.';
  if (v.trim().length > max) return 'До $max знака.';
  return null;
}

/// profiles.display_name: 1–80 characters.
String? validateDisplayName(String v) => _required(v, 80);

/// organizer_details.org_name: 1–120 characters.
String? validateOrgName(String v) => _required(v, 120);
