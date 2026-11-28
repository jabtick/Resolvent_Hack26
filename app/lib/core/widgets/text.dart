import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/tokens.dart';

/// The design's `ransom` label: heavy text cut out on a strip (ink by
/// default). Section headings, type labels.
class RansomText extends StatelessWidget {
  final String text;
  final Color? background;
  final double size;

  const RansomText(this.text, {super.key, this.background, this.size = 28});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final bg = background ?? p.ink;
    final fg = bg == p.ink ? p.background : p.onPrimary;
    return ColoredBox(
      color: bg,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: size * 0.3),
        child: Text(text, style: ZineText.heavy(size, color: fg)),
      ),
    );
  }
}

/// The big title at the top of a page:
///
/// ```
///   make time for something good        ← kicker (hand, pink)
///   YOUR [CALENDAR]                     ← title + ransom
///                          [ADD EVENT]  ← trailing
/// ```
class PageHeading extends StatelessWidget {
  final String title;

  /// Words after [title], cut out on an ink strip.
  final String? ransom;

  /// Small hand-written line above the title.
  final String? kicker;

  /// A button on the right (wraps below on small screens).
  final Widget? trailing;
  final double size;

  const PageHeading({
    super.key,
    required this.title,
    this.ransom,
    this.kicker,
    this.trailing,
    this.size = 60,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final heading = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (kicker != null)
          Text(kicker!, style: ZineText.hand(22, color: p.primary)),
        Text.rich(
          TextSpan(
            style: ZineText.heavy(size, color: p.ink),
            children: [
              TextSpan(text: title),
              if (ransom != null)
                WidgetSpan(
                  alignment: PlaceholderAlignment.middle,
                  child: RansomText(ransom!, size: size),
                ),
            ],
          ),
        ),
      ],
    );
    if (trailing == null) return heading;
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.end,
      runSpacing: 16,
      children: [heading, trailing!],
    );
  }
}

/// An icon followed by a short line of text: "📍 Sofia", "🛡 Verified".
/// Grey and small by default.
class IconLabel extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? color, iconColor;
  final double size;
  final bool bold;

  const IconLabel(
    this.icon,
    this.text, {
    super.key,
    this.color,
    this.iconColor,
    this.size = 12,
    this.bold = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? context.zine.mutedFg;
    return Row(
      children: [
        Icon(icon, size: size + 4, color: iconColor ?? c),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: ZineText.small(color: c, size: size, bold: bold),
          ),
        ),
      ],
    );
  }
}

/// A small coloured label with a thin ink border: skills, interests, tags.
class ZineTag extends StatelessWidget {
  final String text;

  /// Fill; text is dark, so use a bright colour (accent, secondary).
  final Color? color;
  const ZineTag(this.text, {super.key, this.color});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color ?? p.accent,
        border: Border.all(color: p.ink, width: ZineSize.thinBorder),
      ),
      child: Text(text, style: ZineText.heavy(18, color: p.onBright)),
    );
  }
}
