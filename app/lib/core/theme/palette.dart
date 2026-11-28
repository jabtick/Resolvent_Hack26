import 'package:flutter/painting.dart';

/// The three looks from the Lovable design ("pick your vibe").
/// To add a vibe: add a value here, a [Palette] below, and a case in
/// [Palette.of]. Everything else picks it up on its own.
enum ZineVibe {
  zine('Photocopy', 'Ксерокс'),
  basement('Basement', 'Мазе'),
  acid('Acid', 'Киселина');

  final String label, labelBg;
  const ZineVibe(this.label, this.labelBg);
}

/// Colours of one vibe, converted from the design's oklch tokens
/// (design/lovable, src/styles.css). Read them in a widget with
/// `context.zine.primary` etc. — never write a `Color(0x…)` in a page.
class Palette {
  /// Page background ("paper").
  final Color background;

  /// Text, borders and hard shadows.
  final Color ink;

  /// Inside of boxes and cards.
  final Color card;

  /// The three loud block colours (pink, lime, yellow in the default vibe).
  final Color primary, secondary, accent;

  /// Quiet surfaces and secondary text (captions, dates, hints).
  final Color muted, mutedFg;

  /// Errors and the delete button.
  final Color destructive;

  /// Dark vibe (sets Material's brightness).
  final bool dark;

  const Palette({
    required this.background,
    required this.ink,
    required this.card,
    required this.primary,
    required this.secondary,
    required this.accent,
    required this.muted,
    required this.mutedFg,
    required this.destructive,
    this.dark = false,
  });

  /// Text on [primary] and [destructive] blocks.
  Color get onPrimary => const Color(0xFFFCFCFC);

  /// Text on the bright [secondary] and [accent] blocks. Stays dark in every
  /// vibe, because those blocks stay bright.
  Color get onBright => const Color(0xFF070707);

  static const _zine = Palette(
    background: Color(0xFFF9F5E6),
    ink: Color(0xFF070707),
    card: Color(0xFFFEFCF4),
    primary: Color(0xFFF40091),
    secondary: Color(0xFFD4F73E),
    accent: Color(0xFFFCEE28),
    muted: Color(0xFFE2DED0),
    mutedFg: Color(0xFF3A3A3A),
    destructive: Color(0xFFE60016),
  );

  static const _basement = Palette(
    background: Color(0xFF090909),
    ink: Color(0xFFF6F2E3),
    card: Color(0xFF161616),
    primary: Color(0xFFF40091),
    secondary: Color(0xFFD4F73E),
    accent: Color(0xFFFCEE28),
    muted: Color(0xFF242424),
    mutedFg: Color(0xFFAEAEAE),
    destructive: Color(0xFFE60016),
    dark: true,
  );

  static const _acid = Palette(
    background: Color(0xFFD8FA52),
    ink: Color(0xFF070707),
    card: Color(0xFFF5FCE6),
    primary: Color(0xFF8C34E9),
    secondary: Color(0xFF24E9F2),
    accent: Color(0xFFFFA034),
    muted: Color(0xFFE2DED0),
    mutedFg: Color(0xFF3A3A3A),
    destructive: Color(0xFFE60016),
  );

  static Palette of(ZineVibe v) => switch (v) {
    ZineVibe.zine => _zine,
    ZineVibe.basement => _basement,
    ZineVibe.acid => _acid,
  };
}

/// One of the three loud block colours, with the text colour that goes on
/// it. Use it to paint a card: `color: tone.bg(p)`, text `tone.fg(p)`.
enum ZineTone {
  primary,
  secondary,
  accent;

  Color bg(Palette p) => switch (this) {
    ZineTone.primary => p.primary,
    ZineTone.secondary => p.secondary,
    ZineTone.accent => p.accent,
  };

  Color fg(Palette p) => this == ZineTone.primary ? p.onPrimary : p.onBright;

  /// Cycles primary → secondary → accent, like the design's sample data.
  static ZineTone cycle(int i) => values[i % values.length];
}
