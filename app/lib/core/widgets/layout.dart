import 'package:flutter/material.dart';

import '../i18n/language.dart';
import '../theme/app_theme.dart';
import 'boxes.dart';
import 'buttons.dart';

/// Centres a page's content and caps its width. Pick a width from
/// `PageWidth` (form, narrow, reading, wide).
class PageColumn extends StatelessWidget {
  final double maxWidth;
  final Widget child;
  const PageColumn({super.key, required this.maxWidth, required this.child});

  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth),
      child: child,
    ),
  );
}

/// Cards in equal-width columns that wrap. [columns] gets the available
/// width and returns how many columns fit:
///
/// ```dart
/// ZineGrid(
///   columns: (w) => w >= Breakpoints.tablet ? 2 : 1,
///   children: [for (final o in opps) OppCard(opp: o)],
/// )
/// ```
class ZineGrid extends StatelessWidget {
  final int Function(double width) columns;
  final double spacing;
  final double? runSpacing;
  final List<Widget> children;

  const ZineGrid({
    super.key,
    required this.columns,
    required this.children,
    this.spacing = 16,
    this.runSpacing,
  });

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, c) {
      final n = columns(c.maxWidth).clamp(1, 12);
      final w = (c.maxWidth - spacing * (n - 1)) / n;
      return Wrap(
        spacing: spacing,
        runSpacing: runSpacing ?? spacing,
        children: [
          for (final child in children) SizedBox(width: w, child: child),
        ],
      );
    },
  );
}

/// What a page shows when its data failed to load, with a retry button.
class LoadError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const LoadError({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) => ZineBox(
    child: Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 12,
      runSpacing: 12,
      children: [
        Text(message),
        ZineButton(label: context.tr('RETRY', 'ПАК'), onPressed: onRetry),
      ],
    ),
  );
}

/// A big "nothing here" message: no such profile, no events, gone post.
class EmptyState extends StatelessWidget {
  final String title;
  final String? note;
  final IconData? icon;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.title,
    this.note,
    this.icon,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 40, color: p.primary),
              const SizedBox(height: 16),
            ],
            Text(
              title,
              textAlign: TextAlign.center,
              style: ZineText.heavy(36, color: p.ink),
            ),
            if (note != null) ...[
              const SizedBox(height: 8),
              Text(note!, style: ZineText.hand(24, color: p.ink)),
            ],
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    );
  }
}

/// Shows a short message at the bottom of the screen, replacing any that is
/// already showing.
void showSnack(BuildContext context, String message) =>
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
