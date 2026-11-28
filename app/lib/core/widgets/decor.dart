import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/palette.dart';
import '../theme/tokens.dart';

/// The photocopy dot grid behind every page (1px dots, 6px apart, ink at 18%).
class HalftoneBackground extends StatelessWidget {
  final Widget child;
  const HalftoneBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) => CustomPaint(
    painter: _DotsPainter(context.zine.ink.withValues(alpha: 0.18)),
    child: child,
  );
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

/// Shakes a little while the mouse is over it (the design's `jitter`).
/// [ZineBox] with `onTap` already does this; wrap other tappables yourself.
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

/// Round initials badge with an ink ring (org logos, avatars).
class InitialsAvatar extends StatelessWidget {
  final String initials;
  final ZineTone tone;
  final double size;

  /// Adds the hard box shadow (big profile avatar).
  final bool shadow;

  const InitialsAvatar(
    this.initials, {
    super.key,
    this.tone = ZineTone.secondary,
    this.size = 44,
    this.shadow = false,
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
        border: Border.all(
          color: p.ink,
          width: size >= 80 ? 4 : ZineSize.border,
        ),
        boxShadow: shadow
            ? [BoxShadow(color: p.ink, offset: ZineSize.shadow, blurRadius: 0)]
            : null,
      ),
      child: Text(
        initials,
        style: ZineText.heavy(size * 0.42, color: tone.fg(p)),
      ),
    );
  }
}

/// A dashed horizontal rule (`border-dashed border-ink`).
class DashedLine extends StatelessWidget {
  final double thickness;
  const DashedLine({super.key, this.thickness = ZineSize.thinBorder});

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
