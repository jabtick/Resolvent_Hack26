import 'package:flutter/widgets.dart';

import 'language.dart';

/// Month and weekday names in the current language, for calendars, deadlines
/// and badge dates. Monday is the first day of the week.
extension DateNames on BuildContext {
  static const _months = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', //
    'August', 'September', 'October', 'November', 'December',
  ];
  static const _monthsBg = [
    'януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', //
    'август', 'септември', 'октомври', 'ноември', 'декември',
  ];
  static const _weekdays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', //
    'Sunday',
  ];
  static const _weekdaysBg = [
    'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота', //
    'неделя',
  ];

  bool get _bg => lang == AppLang.bg;

  /// "December" / "декември" (month 1–12).
  String monthName(int month) => (_bg ? _monthsBg : _months)[month - 1];

  /// "Monday" / "понеделник" (`DateTime.weekday`, 1–7).
  String weekdayName(int weekday) =>
      (_bg ? _weekdaysBg : _weekdays)[weekday - 1];

  /// Two-letter weekday heads for a month grid: Mo Tu … / Пн Вт …
  List<String> get weekdayInitials => _bg
      ? const ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
      : const ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  /// "03 Dec" / "03 дек".
  String shortDate(DateTime d) =>
      '${_two(d.day)} ${monthName(d.month).substring(0, 3)}';
}

/// "09:05".
String hhmm(DateTime d) => '${_two(d.hour)}:${_two(d.minute)}';

bool sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

String _two(int n) => n.toString().padLeft(2, '0');
