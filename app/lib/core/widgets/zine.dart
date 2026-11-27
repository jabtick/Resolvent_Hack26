import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// The design's `zine` / `zine-pink` box: 3px ink border, hard offset shadow,
/// optionally tilted like a pasted cut-out.
class ZineBox extends StatelessWidget {
  final Widget child;
  final Color? color;
  final bool pink;
  final double tilt; // degrees
  final EdgeInsetsGeometry padding;

  const ZineBox({
    super.key,
    required this.child,
    this.color,
    this.pink = false,
    this.tilt = 0,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    Widget box = DecoratedBox(
      decoration: BoxDecoration(
        color: color ?? p.card,
        border: Border.all(color: p.ink, width: 3),
        boxShadow: [
          BoxShadow(
            color: pink ? p.primary : p.ink,
            offset: const Offset(6, 6),
            blurRadius: 0,
          ),
        ],
      ),
      child: Padding(padding: padding, child: child),
    );
    if (tilt != 0) {
      box = Transform.rotate(angle: tilt * math.pi / 180, child: box);
    }
    return box;
  }
}

/// The design's `ransom` label: heavy text cut out on an ink strip.
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

/// Chunky button: ink block with a pink shadow (`pink`), or a card block.
class ZineButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool pink;
  final IconData? icon;

  const ZineButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.pink = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final enabled = onPressed != null;
    final bg = pink ? p.ink : p.card;
    final fg = pink ? p.background : p.ink;
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: ZineBox(
        pink: pink,
        color: bg,
        padding: EdgeInsets.zero,
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: onPressed,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: fg, size: 20),
                    const SizedBox(width: 8),
                  ],
                  Text(label, style: ZineText.heavy(22, color: fg)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The photocopy dot grid behind every page (1px dots, 6px apart, ink at 18%).
class HalftoneBackground extends StatelessWidget {
  final Widget child;
  const HalftoneBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return CustomPaint(
      painter: _DotsPainter(p.ink.withValues(alpha: 0.18)),
      child: child,
    );
  }
}

class _DotsPainter extends CustomPainter {
  final Color color;
  _DotsPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    for (var y = 3.0; y < size.height; y += 6) {
      for (var x = 3.0; x < size.width; x += 6) {
        canvas.drawCircle(Offset(x, y), 0.5, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DotsPainter old) => old.color != color;
}
