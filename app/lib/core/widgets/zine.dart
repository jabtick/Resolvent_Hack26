import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/palette.dart';

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
    final button = Opacity(
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
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(label, style: ZineText.heavy(22, color: fg)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    return enabled ? Jitter(child: button) : button;
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

/// A row of square toggle buttons, one per option; the picked one is pink.
/// Used for "pick your vibe" and the language switch.
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
  Widget build(BuildContext context) {
    final p = context.zine;
    return Row(
      children: [
        for (final (i, (v, label)) in options.indexed) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(
            child: Jitter(
              child: Material(
                color: v == value ? p.primary : p.card,
                shape: Border.all(color: p.ink, width: 3),
                child: InkWell(
                  onTap: () => onChanged(v),
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: padding),
                    child: Center(
                      child: FittedBox(
                        child: Text(
                          label,
                          style: ZineText.heavy(
                            fontSize,
                            color: v == value ? p.onPrimary : p.ink,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// The three loud block colours the design paints cards with
/// (`bg-primary` / `bg-secondary` / `bg-accent` plus their foreground).
enum ZineTone {
  primary,
  secondary,
  accent;

  Color bg(Palette p) => switch (this) {
    ZineTone.primary => p.primary,
    ZineTone.secondary => p.secondary,
    ZineTone.accent => p.accent,
  };

  Color fg(Palette p) =>
      this == ZineTone.primary ? p.onPrimary : const Color(0xFF070707);

  /// Cycles primary → secondary → accent, like the design's sample data.
  static ZineTone cycle(int i) => values[i % values.length];
}

/// Shakes a little while the mouse is over it (the design's `jitter`).
class Jitter extends StatefulWidget {
  final Widget child;
  const Jitter({super.key, required this.child});

  @override
  State<Jitter> createState() => _JitterState();
}

class _JitterState extends State<Jitter> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 250),
  );

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MouseRegion(
    onEnter: (_) {
      if (!MediaQuery.of(context).disableAnimations) _c.repeat();
    },
    onExit: (_) => _c
      ..stop()
      ..value = 0,
    child: AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (context, child) {
        final t = _c.value;
        // 0 → 25% → 75% → 100%: still, left-down, right-up, still.
        final s = t < .5
            ? -math.sin(t * 2 * math.pi)
            : math.sin(t * 2 * math.pi);
        return Transform.translate(
          offset: Offset(s, -s),
          child: Transform.rotate(angle: s * .5 * math.pi / 180, child: child),
        );
      },
    ),
  );
}

/// A square filter chip: 3px ink border, pink when [selected].
class ZineChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  const ZineChip(this.label, {super.key, this.selected = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Jitter(
      child: Material(
        color: selected ? p.primary : p.card,
        shape: Border.all(color: p.ink, width: 3),
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Text(
              label,
              style: ZineText.heavy(18, color: selected ? p.onPrimary : p.ink),
            ),
          ),
        ),
      ),
    );
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

/// Round initials badge with an ink ring (org logos, avatars).
class InitialsAvatar extends StatelessWidget {
  final String initials;
  final ZineTone tone;
  final double size;
  const InitialsAvatar(
    this.initials, {
    super.key,
    this.tone = ZineTone.secondary,
    this.size = 44,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: tone.bg(p),
        border: Border.all(color: p.ink, width: 3),
      ),
      child: Text(
        initials,
        style: ZineText.heavy(size * 0.45, color: tone.fg(p)),
      ),
    );
  }
}

/// A dashed horizontal rule (`border-dashed border-ink`).
class DashedLine extends StatelessWidget {
  final double thickness;
  const DashedLine({super.key, this.thickness = 2});

  @override
  Widget build(BuildContext context) => CustomPaint(
    size: Size(double.infinity, thickness),
    painter: _DashPainter(context.zine.ink, thickness),
  );
}

class _DashPainter extends CustomPainter {
  final Color color;
  final double thickness;
  _DashPainter(this.color, this.thickness);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = thickness;
    for (var x = 0.0; x < size.width; x += 10) {
      canvas.drawLine(
        Offset(x, thickness / 2),
        Offset(math.min(x + 6, size.width), thickness / 2),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_DashPainter old) =>
      old.color != color || old.thickness != thickness;
}
