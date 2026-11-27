import 'package:flutter/painting.dart';

/// The three looks from the Lovable design ("pick your vibe").
enum ZineVibe {
  zine('Ксерокс'),
  basement('Мазе'),
  acid('Киселина');

  final String label;
  const ZineVibe(this.label);
}

/// Colours of one vibe, converted from the design's oklch tokens
/// (design/lovable, src/styles.css).
class Palette {
  final Color background, ink, card, primary, secondary, accent;
  final Color muted, mutedFg, destructive;
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

  /// Text/surface on top of [primary] and [ink] blocks.
  Color get onPrimary => const Color(0xFFFCFCFC);

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
