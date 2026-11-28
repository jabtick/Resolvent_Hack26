import 'dart:math' as math;

import 'package:flutter/widgets.dart';

/// Keeps a side column in view while the page scrolls (the design's
/// `sticky top-24`). Put it around a sidebar that sits next to a longer main
/// column, inside the page's scroll view:
///
/// ```dart
/// SizedBox(width: 260, child: StickyRail(child: _RightRail()))
/// ```
///
/// The rail slides down with the scroll, stops at the bottom of the page,
/// and when it is taller than the window it sticks by its bottom edge
/// instead, so every part of it can still be reached.
class StickyRail extends StatefulWidget {
  final Widget child;

  /// Gap between the top of the window and the rail.
  final double top;

  /// Space left free at the end of the page (the shell's bottom padding).
  final double bottom;

  const StickyRail({
    super.key,
    required this.child,
    this.top = 24,
    this.bottom = 80,
  });

  @override
  State<StickyRail> createState() => _StickyRailState();
}

class _StickyRailState extends State<StickyRail> {
  ScrollableState? _scrollable;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _scrollable = Scrollable.maybeOf(context);
  }

  /// How far to slide the rail down, from the last laid-out frame.
  double _offset() {
    final s = _scrollable;
    final rail = context.findRenderObject() as RenderBox?;
    final viewport = s?.context.findRenderObject() as RenderBox?;
    if (s == null ||
        rail == null ||
        viewport == null ||
        !rail.attached ||
        !rail.hasSize ||
        !s.position.hasContentDimensions) {
      return 0;
    }
    final pos = s.position;
    // Where the rail sits in the scrolled content (our own render object is
    // the transform, whose position does not include its own translation).
    final origin =
        rail.localToGlobal(Offset.zero, ancestor: viewport).dy + pos.pixels;
    final height = rail.size.height;
    final window = pos.viewportDimension;
    final contentEnd = pos.maxScrollExtent + window - widget.bottom;

    // Fits in the window: stick by the top. Taller: stick by the bottom.
    final want = height + widget.top <= window
        ? pos.pixels + widget.top - origin
        : pos.pixels + window - widget.top - height - origin;
    final max = math.max(0.0, contentEnd - origin - height);
    return want.clamp(0.0, max);
  }

  @override
  Widget build(BuildContext context) {
    final s = _scrollable;
    if (s == null) return widget.child;
    return AnimatedBuilder(
      animation: s.position,
      child: widget.child,
      builder: (context, child) =>
          Transform.translate(offset: Offset(0, _offset()), child: child),
    );
  }
}
