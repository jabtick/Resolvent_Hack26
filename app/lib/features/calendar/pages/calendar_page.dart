import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/palette.dart';
import '../../../core/widgets/zine.dart';

/// The calendar (owner: Niki), UI only — a copy of the Lovable calendar
/// (design/lovable, src/routes/calendar.tsx).
///
/// Months can be flipped and a day picked, but the events are [_sample] and
/// ADD EVENT does nothing. To wire it up: calendar_repo.dart (+ fake_/supabase_),
/// add it to core/services.dart and swap [_sample] for the repo's events.
class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _Event {
  final DateTime start, end;
  final String title, field, location, description;
  final bool published;
  final List<String> qualities;
  const _Event({
    required this.start,
    required this.end,
    required this.title,
    required this.field,
    required this.location,
    required this.description,
    this.published = true,
    this.qualities = const [],
  });
}

final _sample = [
  _Event(
    start: DateTime(2026, 12, 3, 10),
    end: DateTime(2026, 12, 3, 16),
    title: 'Hack the Coast — Burgas',
    field: 'Tech',
    location: 'Burgas Free University, Hall 2',
    description: '24 hours, teams of 3–5, mentors on site. Pizza included.',
    qualities: ['Teamwork', 'Python', 'Pitching'],
  ),
  _Event(
    start: DateTime(2026, 12, 9, 14),
    end: DateTime(2026, 12, 9, 15),
    title: 'Street Art Stipend — Q&A',
    field: 'Art',
    location: 'meet.example.org/loud-canvas',
    description: 'Ask the jury anything before the January deadline.',
  ),
  _Event(
    start: DateTime(2026, 12, 12, 9),
    end: DateTime(2026, 12, 12, 13),
    title: 'National Maths Olympiad — round 2',
    field: 'Education',
    location: 'Sofia, Mathematical High School',
    description: 'Bring a pen, a calculator and your student ID.',
    qualities: ['Logic', 'Persistence'],
  ),
  _Event(
    start: DateTime(2026, 12, 18, 17),
    end: DateTime(2026, 12, 18, 18),
    title: 'Finish motivation letter',
    field: 'Personal',
    location: '',
    description: 'For the Open Science Fellowship.',
    published: false,
  ),
];

const _months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const _weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
String _two(int n) => n.toString().padLeft(2, '0');
const _monthsBg = [
  'януари',
  'февруари',
  'март',
  'април',
  'май',
  'юни',
  'юли',
  'август',
  'септември',
  'октомври',
  'ноември',
  'декември',
];
const _weekdaysBg = [
  'понеделник',
  'вторник',
  'сряда',
  'четвъртък',
  'петък',
  'събота',
  'неделя',
];

String _monthName(BuildContext c, int m) =>
    c.lang == AppLang.bg ? _monthsBg[m - 1] : _months[m - 1];
String _weekdayName(BuildContext c, int d) =>
    c.lang == AppLang.bg ? _weekdaysBg[d - 1] : _weekdays[d - 1];
String _short(BuildContext c, DateTime d) =>
    '${_two(d.day)} ${_monthName(c, d.month).substring(0, 3)}';
String _time(DateTime d) => '${_two(d.hour)}:${_two(d.minute)}';
bool _sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;

class _CalendarPageState extends State<CalendarPage> {
  DateTime _date = DateTime.now();
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  bool _dayView = false;

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final visible = _dayView
        ? _sample.where((e) => _sameDay(e.start, _date)).toList()
        : _sample;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.end,
          runSpacing: 16,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.tr(
                    'make time for something good',
                    'намери време за нещо хубаво',
                  ),
                  style: ZineText.hand(22, color: p.primary),
                ),
                Text.rich(
                  TextSpan(
                    style: ZineText.heavy(60, color: p.ink),
                    children: [
                      TextSpan(text: context.tr('YOUR ', 'ТВОЯТ ')),
                      WidgetSpan(
                        alignment: PlaceholderAlignment.middle,
                        child: RansomText(
                          context.tr('CALENDAR', 'КАЛЕНДАР'),
                          size: 60,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            _SecondaryButton(
              icon: LucideIcons.plus,
              label: context.tr('ADD EVENT', 'ДОБАВИ СЪБИТИЕ'),
              onTap: () {},
            ),
          ],
        ),
        const SizedBox(height: 32),
        LayoutBuilder(
          builder: (context, c) {
            final aside = _aside(p);
            final list = _list(p, visible);
            if (c.maxWidth < 1024) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [aside, const SizedBox(height: 32), list],
              );
            }
            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(width: 340, child: aside),
                const SizedBox(width: 32),
                Expanded(child: list),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _aside(Palette p) {
    final pub = _sample.where((e) => e.published).length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ZineBox(
          padding: const EdgeInsets.all(12),
          child: _MonthGrid(
            month: _month,
            selected: _date,
            marked: _sample.map((e) => e.start).toList(),
            onMonth: (m) => setState(() => _month = m),
            onPick: (d) => setState(() {
              _date = d;
              _dayView = true;
            }),
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.only(left: 16),
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: p.primary, width: 6)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr(
                  '${_sample.length} SCHEDULED',
                  '${_sample.length} ПЛАНИРАНИ',
                ),
                style: ZineText.heavy(32, color: p.ink),
              ),
              Text(
                context.tr(
                  '$pub public · ${_sample.length - pub} personal',
                  '$pub публични · ${_sample.length - pub} лични',
                ),
                style: TextStyle(fontSize: 13, color: p.mutedFg),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton(
          onPressed: () => setState(() {
            final now = DateTime.now();
            _date = now;
            _month = DateTime(now.year, now.month);
            _dayView = true;
          }),
          child: Text(context.tr('Today', 'Днес')),
        ),
      ],
    );
  }

  Widget _list(Palette p, List<_Event> visible) {
    Widget tab(String label, bool on, VoidCallback tap) => Padding(
      padding: const EdgeInsets.only(left: 8),
      child: on
          ? FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: p.secondary,
                foregroundColor: const Color(0xFF070707),
                side: BorderSide(color: p.ink, width: 3),
              ),
              onPressed: tap,
              child: Text(label),
            )
          : OutlinedButton(onPressed: tap, child: Text(label)),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: p.ink, width: 3)),
          ),
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            runSpacing: 12,
            children: [
              Text(
                _dayView
                    ? '${_weekdayName(context, _date.weekday)}, ${_date.day} '
                          '${_monthName(context, _date.month).substring(0, 3)}'
                    : context.tr('ALL EVENTS', 'ВСИЧКИ СЪБИТИЯ'),
                style: ZineText.heavy(32, color: p.ink),
              ),
              Wrap(
                runSpacing: 8,
                children: [
                  tab(
                    context.tr('All events', 'Всички събития'),
                    !_dayView,
                    () => setState(() => _dayView = false),
                  ),
                  tab(
                    context.tr('Selected day', 'Избран ден'),
                    _dayView,
                    () => setState(() => _dayView = true),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        if (visible.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 48),
            child: Column(
              children: [
                Icon(LucideIcons.calendarDays, size: 40, color: p.primary),
                const SizedBox(height: 16),
                Text(
                  context.tr('NO PLANS. YET.', 'НЯМА ПЛАНОВЕ. ОЩЕ.'),
                  style: ZineText.heavy(32, color: p.ink),
                ),
              ],
            ),
          )
        else
          for (final e in visible) ...[
            _EventCard(e: e),
            const SizedBox(height: 20),
          ],
      ],
    );
  }
}

class _EventCard extends StatelessWidget {
  final _Event e;
  const _EventCard({required this.e});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return ZineBox(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_short(context, e.start)} ${e.start.year} · '
                      '${e.published ? e.field : context.tr('PERSONAL', 'ЛИЧНО')}',
                      style: ZineText.heavy(20, color: p.primary),
                    ),
                    const SizedBox(height: 8),
                    Text(e.title, style: ZineText.heavy(32, color: p.ink)),
                  ],
                ),
              ),
              for (final (icon, tip) in [
                (LucideIcons.pencil, context.tr('Edit event', 'Редактирай')),
                (LucideIcons.trash2, context.tr('Delete event', 'Изтрий')),
              ])
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: IconButton.outlined(
                    tooltip: tip,
                    style: IconButton.styleFrom(
                      shape: const RoundedRectangleBorder(),
                      side: BorderSide(color: p.ink, width: 3),
                    ),
                    onPressed: () {},
                    icon: Icon(icon, size: 18, color: p.ink),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          _line(
            LucideIcons.clock,
            '${_time(e.start)} – ${_short(context, e.end)} ${_time(e.end)}',
          ),
          if (e.location.isNotEmpty) ...[
            const SizedBox(height: 8),
            _line(LucideIcons.mapPin, e.location),
          ],
          const SizedBox(height: 12),
          Text(e.description, style: const TextStyle(fontSize: 13)),
          if (e.qualities.isNotEmpty) ...[
            const SizedBox(height: 16),
            const DashedLine(),
            const SizedBox(height: 12),
            Text(
              context.tr('CANDIDATES WITH', 'ТЪРСИМ ХОРА С'),
              style: ZineText.heavy(20, color: p.ink),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final q in e.qualities)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: p.accent,
                      border: Border.all(color: p.ink, width: 2),
                    ),
                    child: Text(
                      q,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF070707),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _line(IconData icon, String text) => Row(
    children: [
      Icon(icon, size: 16),
      const SizedBox(width: 8),
      Flexible(child: Text(text, style: const TextStyle(fontSize: 13))),
    ],
  );
}

/// A small month view: arrows, weekday initials, day cells. Days with an
/// event get a pink underline; the picked day is filled pink.
class _MonthGrid extends StatelessWidget {
  final DateTime month, selected;
  final List<DateTime> marked;
  final ValueChanged<DateTime> onMonth, onPick;
  const _MonthGrid({
    required this.month,
    required this.selected,
    required this.marked,
    required this.onMonth,
    required this.onPick,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final first = DateTime(month.year, month.month);
    final days = DateTime(month.year, month.month + 1, 0).day;
    final lead = first.weekday - 1; // Monday first
    final today = DateTime.now();
    final cells = <Widget>[
      for (final d
          in context.lang == AppLang.bg
              ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']
              : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'])
        Center(
          child: Text(d, style: TextStyle(fontSize: 12, color: p.mutedFg)),
        ),
      for (var i = 0; i < lead; i++) const SizedBox(),
      for (var d = 1; d <= days; d++)
        _day(context, DateTime(month.year, month.month, d), today),
    ];
    return Column(
      children: [
        Row(
          children: [
            IconButton(
              tooltip: context.tr('Previous month', 'Предишен месец'),
              onPressed: () => onMonth(DateTime(month.year, month.month - 1)),
              icon: const Icon(LucideIcons.chevronLeft),
            ),
            Expanded(
              child: Center(
                child: Text(
                  '${_monthName(context, month.month)} ${month.year}',
                  style: ZineText.heavy(22, color: p.ink),
                ),
              ),
            ),
            IconButton(
              tooltip: context.tr('Next month', 'Следващ месец'),
              onPressed: () => onMonth(DateTime(month.year, month.month + 1)),
              icon: const Icon(LucideIcons.chevronRight),
            ),
          ],
        ),
        const SizedBox(height: 4),
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: cells,
        ),
      ],
    );
  }

  Widget _day(BuildContext context, DateTime d, DateTime today) {
    final p = context.zine;
    final isSel = _sameDay(d, selected);
    final isMarked = marked.any((m) => _sameDay(m, d));
    final isToday = _sameDay(d, today);
    return InkWell(
      onTap: () => onPick(d),
      child: Container(
        margin: const EdgeInsets.all(2),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSel ? p.primary : (isToday ? p.muted : null),
          border: isMarked
              ? Border(bottom: BorderSide(color: p.primary, width: 3))
              : null,
        ),
        child: Text(
          '${d.day}',
          style: TextStyle(
            fontWeight: isMarked ? FontWeight.w700 : FontWeight.w400,
            color: isSel ? p.onPrimary : p.ink,
          ),
        ),
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SecondaryButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    const fg = Color(0xFF070707);
    return Jitter(
      child: ZineBox(
        color: p.secondary,
        padding: EdgeInsets.zero,
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, color: fg),
                  const SizedBox(width: 8),
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(label, style: ZineText.heavy(24, color: fg)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
