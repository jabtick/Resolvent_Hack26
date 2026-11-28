import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/ui.dart';
import '../calendar_sample.dart';

/// The calendar (owner: Niki), UI only — a copy of the Lovable calendar
/// (design/lovable, src/routes/calendar.tsx).
///
/// Months can be flipped and a day picked, but the events are
/// [kSampleEvents] and ADD EVENT / edit / delete do nothing. To wire it up:
/// calendar_repo.dart (+ fake_/supabase_), add it to core/services.dart and
/// swap [kSampleEvents] for the repo's events.
class CalendarPage extends StatefulWidget {
  const CalendarPage({super.key});

  @override
  State<CalendarPage> createState() => _CalendarPageState();
}

class _CalendarPageState extends State<CalendarPage> {
  final _events = kSampleEvents;
  DateTime _date = DateTime.now();
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  bool _dayView = false;

  void _pickDay(DateTime d) => setState(() {
    _date = d;
    _month = DateTime(d.year, d.month);
    _dayView = true;
  });

  @override
  Widget build(BuildContext context) {
    final visible = _dayView
        ? _events.where((e) => sameDay(e.start, _date)).toList()
        : _events;
    final aside = _aside(context);
    final list = _list(context, visible);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PageHeading(
          kicker: context.tr(
            'make time for something good',
            'намери време за нещо хубаво',
          ),
          title: context.tr('YOUR ', 'ТВОЯТ '),
          ransom: context.tr('CALENDAR', 'КАЛЕНДАР'),
          trailing: ZineButton(
            icon: LucideIcons.plus,
            label: context.tr('ADD EVENT', 'ДОБАВИ СЪБИТИЕ'),
            kind: ZineButtonKind.bright,
            onPressed: () {},
          ),
        ),
        const SizedBox(height: 32),
        LayoutBuilder(
          builder: (context, c) => c.maxWidth < Breakpoints.desktop
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [aside, const SizedBox(height: 32), list],
                )
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(width: 340, child: StickyRail(child: aside)),
                    const SizedBox(width: 32),
                    Expanded(child: list),
                  ],
                ),
        ),
      ],
    );
  }

  /// Month grid, counts, TODAY.
  Widget _aside(BuildContext context) {
    final p = context.zine;
    final pub = _events.where((e) => e.published).length;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ZineBox(
          padding: const EdgeInsets.all(12),
          child: _MonthGrid(
            month: _month,
            selected: _date,
            marked: [for (final e in _events) e.start],
            onMonth: (m) => setState(() => _month = m),
            onPick: _pickDay,
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
                  '${_events.length} SCHEDULED',
                  '${_events.length} ПЛАНИРАНИ',
                ),
                style: ZineText.heavy(32, color: p.ink),
              ),
              Text(
                context.tr(
                  '$pub public · ${_events.length - pub} personal',
                  '$pub публични · ${_events.length - pub} лични',
                ),
                style: ZineText.small(color: p.mutedFg, size: 13),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton(
          onPressed: () => _pickDay(DateTime.now()),
          child: Text(context.tr('Today', 'Днес')),
        ),
      ],
    );
  }

  /// Heading, ALL / DAY tabs, event cards.
  Widget _list(BuildContext context, List<CalendarEvent> visible) {
    final p = context.zine;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: p.ink, width: ZineSize.border),
            ),
          ),
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 12,
            children: [
              Text(
                _dayView
                    ? '${context.weekdayName(_date.weekday)}, '
                          '${context.shortDate(_date)}'
                    : context.tr('ALL EVENTS', 'ВСИЧКИ СЪБИТИЯ'),
                style: ZineText.heavy(32, color: p.ink),
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ZineChip(
                    context.tr('All events', 'Всички събития'),
                    selected: !_dayView,
                    onTap: () => setState(() => _dayView = false),
                  ),
                  ZineChip(
                    context.tr('Selected day', 'Избран ден'),
                    selected: _dayView,
                    onTap: () => setState(() => _dayView = true),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        if (visible.isEmpty)
          EmptyState(
            icon: LucideIcons.calendarDays,
            title: context.tr('NO PLANS. YET.', 'НЯМА ПЛАНОВЕ. ОЩЕ.'),
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
  final CalendarEvent e;
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
                      '${context.shortDate(e.start)} ${e.start.year} · '
                      '${e.published ? e.field : context.tr('PERSONAL', 'ЛИЧНО')}',
                      style: ZineText.heavy(20, color: p.primary),
                    ),
                    const SizedBox(height: 8),
                    Text(e.title, style: ZineText.heavy(32, color: p.ink)),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              ZineIconButton(
                icon: LucideIcons.pencil,
                tooltip: context.tr('Edit event', 'Редактирай'),
                filled: false,
                onPressed: () {},
              ),
              const SizedBox(width: 4),
              ZineIconButton(
                icon: LucideIcons.trash2,
                tooltip: context.tr('Delete event', 'Изтрий'),
                filled: false,
                onPressed: () {},
              ),
            ],
          ),
          const SizedBox(height: 12),
          IconLabel(
            LucideIcons.clock,
            '${hhmm(e.start)} – ${context.shortDate(e.end)} ${hhmm(e.end)}',
            color: p.ink,
            size: 13,
          ),
          if (e.location.isNotEmpty) ...[
            const SizedBox(height: 8),
            IconLabel(LucideIcons.mapPin, e.location, color: p.ink, size: 13),
          ],
          const SizedBox(height: 12),
          Text(e.description, style: ZineText.small(size: 13)),
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
              children: [for (final q in e.qualities) ZineTag(q)],
            ),
          ],
        ],
      ),
    );
  }
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
    final days = DateTime(month.year, month.month + 1, 0).day;
    final lead = DateTime(month.year, month.month).weekday - 1; // Monday first
    final today = DateTime.now();
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
                  '${context.monthName(month.month)} ${month.year}',
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
          children: [
            for (final d in context.weekdayInitials)
              Center(
                child: Text(d, style: ZineText.small(color: p.mutedFg)),
              ),
            for (var i = 0; i < lead; i++) const SizedBox(),
            for (var d = 1; d <= days; d++)
              _day(context, DateTime(month.year, month.month, d), today),
          ],
        ),
      ],
    );
  }

  Widget _day(BuildContext context, DateTime d, DateTime today) {
    final p = context.zine;
    final isSel = sameDay(d, selected);
    final isMarked = marked.any((m) => sameDay(m, d));
    return InkWell(
      onTap: () => onPick(d),
      child: Container(
        margin: const EdgeInsets.all(2),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSel ? p.primary : (sameDay(d, today) ? p.muted : null),
          border: isMarked
              ? Border(
                  bottom: BorderSide(color: p.primary, width: ZineSize.border),
                )
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
