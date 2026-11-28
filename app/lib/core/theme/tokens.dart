import 'package:flutter/painting.dart';

/// Sizes that make the zine look. Change one here and every box, chip and
/// button follows.
abstract final class ZineSize {
  /// Border of boxes, buttons, chips, inputs.
  static const double border = 3;

  /// Thinner border for small things (tags, checkboxes, tape).
  static const double thinBorder = 2;

  /// The hard, unblurred shadow under every box.
  static const Offset shadow = Offset(6, 6);

  /// Default tilt of "pasted" cards, in degrees. Alternate the sign
  /// (`tiltFor(i)`) so a list of cards looks hand-placed.
  static const double tilt = 1.5;
  static double tiltFor(int index) => index.isOdd ? 1.2 : -tilt;
}

/// Screen widths where the layout changes (the design's Tailwind `sm/md/lg`).
/// Compare with `MediaQuery.sizeOf(context).width` or a LayoutBuilder's
/// `maxWidth`.
abstract final class Breakpoints {
  static const double small = 480;
  static const double phone = 640;
  static const double tablet = 768;
  static const double desktop = 1024;
}

/// Max widths of a page's content column (use with `PageColumn`).
abstract final class PageWidth {
  /// Auth forms.
  static const double form = 448;

  /// Settings.
  static const double narrow = 672;

  /// Profiles, reading.
  static const double reading = 768;

  /// Detail pages, saved list.
  static const double wide = 1024;

  /// The whole shell (`max-w-6xl`).
  static const double max = 1152;
}
