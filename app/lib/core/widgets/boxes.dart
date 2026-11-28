import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'decor.dart';

/// The design's `zine` box: 3px ink border, hard offset shadow, optionally
/// tilted like a pasted cut-out. Almost every card on the site is one.
///
/// ```dart
/// ZineBox(child: Text('hi'))                       // plain card
/// ZineBox(color: p.accent, pink: true, child: …)   // yellow, pink shadow
/// ZineBox(tilt: ZineSize.tiltFor(i), child: …)     // hand-placed list item
/// ZineBox(onTap: () => context.go('/x'), child: …) // clickable, jitters
/// ```
class ZineBox extends StatelessWidget {
  final Widget child;

  /// Fill. Defaults to the palette's card colour.
  final Color? color;

  /// Pink (primary) shadow instead of ink.
  final bool pink;

  /// Rotation in degrees.
  final double tilt;
  final EdgeInsetsGeometry padding;

  /// Makes the whole box a button (ink ripple + jitter on hover).
  final VoidCallback? onTap;

  const ZineBox({
    super.key,
    required this.child,
    this.color,
    this.pink = false,
    this.tilt = 0,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    Widget content = Padding(padding: padding, child: child);
    if (onTap != null) {
      content = Material(
        type: MaterialType.transparency,
        child: InkWell(onTap: onTap, child: content),
      );
    }
    Widget box = DecoratedBox(
      decoration: BoxDecoration(
        color: color ?? p.card,
        border: Border.all(color: p.ink, width: ZineSize.border),
        boxShadow: [
          BoxShadow(
            color: pink ? p.primary : p.ink,
            offset: ZineSize.shadow,
            blurRadius: 0,
          ),
        ],
      ),
      child: content,
    );
    if (tilt != 0) {
      box = Transform.rotate(angle: tilt * math.pi / 180, child: box);
    }
    return onTap == null ? box : Jitter(child: box);
  }
}

/// A strip of masking tape stuck over the top edge of a box (`tape`).
class Taped extends StatelessWidget {
  final Widget child;
  const Taped({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        child,
        Positioned(
          top: -12,
          left: 0,
          right: 0,
          child: Align(
            alignment: const Alignment(-0.1, 0),
            child: Transform.rotate(
              angle: -4 * math.pi / 180,
              child: Container(
                width: 80,
                height: 22,
                decoration: BoxDecoration(
                  color: p.accent.withValues(alpha: 0.8),
                  border: Border.all(color: p.ink, width: 1),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// A yellow box with a short message: warnings and heads-ups
/// ("under 14: your profile stays hidden…").
class Notice extends StatelessWidget {
  final String text;
  const Notice(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return ZineBox(
      color: p.accent,
      child: Text(text, style: TextStyle(color: p.onBright)),
    );
  }
}
