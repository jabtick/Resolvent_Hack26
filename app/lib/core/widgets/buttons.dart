import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'boxes.dart';
import 'decor.dart';

/// How loud a [ZineButton] is.
enum ZineButtonKind {
  /// The page's main action: ink block with a pink shadow.
  primary,

  /// Everything else: card-coloured block with an ink shadow.
  plain,

  /// Lime block (secondary colour): tools like FILTER or ADD EVENT.
  bright,
}

/// Chunky zine button. `onPressed: null` shows it disabled.
///
/// ```dart
/// ZineButton(label: 'SAVE', kind: ZineButtonKind.primary, onPressed: _save)
/// ```
class ZineButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final ZineButtonKind kind;
  final IconData? icon;

  const ZineButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.kind = ZineButtonKind.plain,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final (bg, fg) = switch (kind) {
      ZineButtonKind.primary => (p.ink, p.background),
      ZineButtonKind.plain => (p.card, p.ink),
      ZineButtonKind.bright => (p.secondary, p.onBright),
    };
    return Opacity(
      opacity: onPressed == null ? 0.5 : 1,
      child: ZineBox(
        pink: kind == ZineButtonKind.primary,
        color: bg,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        onTap: onPressed,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, color: fg, size: 20),
              const SizedBox(width: 8),
            ],
            Flexible(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(label, style: ZineText.heavy(22, color: fg)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Square icon button: lime filled (header) or ink outlined (`filled: false`,
/// e.g. edit / delete on a card). Always give a [tooltip] — it is the label
/// screen readers and tests use.
class ZineIconButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;
  final bool filled;

  const ZineIconButton({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.filled = true,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    if (filled) {
      return IconButton.filled(
        tooltip: tooltip,
        style: IconButton.styleFrom(
          backgroundColor: p.secondary,
          foregroundColor: p.onBright,
          shape: const RoundedRectangleBorder(),
        ),
        onPressed: onPressed,
        icon: Icon(icon),
      );
    }
    return IconButton.outlined(
      tooltip: tooltip,
      style: IconButton.styleFrom(
        shape: const RoundedRectangleBorder(),
        side: BorderSide(color: p.ink, width: ZineSize.border),
      ),
      onPressed: onPressed,
      icon: Icon(icon, size: 18, color: p.ink),
    );
  }
}

/// A square toggle chip: ink border, pink when [selected]. Filters, tabs.
class ZineChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const ZineChip(
    this.label, {
    super.key,
    this.selected = false,
    this.onTap,
    this.fontSize = 18,
    this.padding = const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Jitter(
      child: Material(
        color: selected ? p.primary : p.card,
        shape: Border.all(color: p.ink, width: ZineSize.border),
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: padding,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: ZineText.heavy(
                  fontSize,
                  color: selected ? p.onPrimary : p.ink,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A row of equal-width [ZineChip]s, one picked. Theme and language pickers.
class ZinePicker<T> extends StatelessWidget {
  final List<(T, String)> options;
  final T value;
  final ValueChanged<T> onChanged;
  final double fontSize, padding;

  const ZinePicker({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.fontSize = 18,
    this.padding = 8,
  });

  @override
  Widget build(BuildContext context) => Row(
    children: [
      for (final (i, (v, label)) in options.indexed) ...[
        if (i > 0) const SizedBox(width: 8),
        Expanded(
          child: ZineChip(
            label,
            selected: v == value,
            onTap: () => onChanged(v),
            fontSize: fontSize,
            padding: EdgeInsets.symmetric(vertical: padding),
          ),
        ),
      ],
    ],
  );
}

/// Small underlined text link ("Forgot password?", "back").
class TextLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const TextLink(this.label, {super.key, required this.onTap});

  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: onTap,
    child: Text(
      label,
      style: TextStyle(
        decoration: TextDecoration.underline,
        fontWeight: FontWeight.w700,
        color: context.zine.ink,
      ),
    ),
  );
}
