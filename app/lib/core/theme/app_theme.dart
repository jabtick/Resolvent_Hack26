import 'package:flutter/material.dart';

import 'palette.dart';

/// Fonts bundled in assets/fonts (Cyrillic-capable stand-ins for the design's
/// Bebas Neue / Space Mono / Permanent Marker, which have no Cyrillic).
abstract final class ZineFonts {
  static const display = 'RubikGlitch';
  static const heavy = 'Oswald';
  static const body = 'IBMPlexMono';
  static const hand = 'Caveat';

  /// Oswald and Caveat are variable fonts: set the weight axis explicitly.
  static const bold = [FontVariation('wght', 700)];
}

/// Text styles from the design: Oswald for headings, Caveat for hand notes,
/// Rubik Glitch for the logo.
abstract final class ZineText {
  static TextStyle heavy(double size, {Color? color}) => TextStyle(
    fontFamily: ZineFonts.heavy,
    fontVariations: ZineFonts.bold,
    fontWeight: FontWeight.w700,
    fontSize: size,
    height: 1.0,
    color: color,
  );

  static TextStyle hand(double size, {Color? color}) => TextStyle(
    fontFamily: ZineFonts.hand,
    fontVariations: ZineFonts.bold,
    fontSize: size,
    color: color,
  );

  static TextStyle display(double size, {Color? color}) => TextStyle(
    fontFamily: ZineFonts.display,
    fontSize: size,
    height: 1.0,
    color: color,
  );
}

/// Lets widgets reach the active palette: `Theme.of(context).extension<ZineColors>()`.
class ZineColors extends ThemeExtension<ZineColors> {
  final Palette palette;
  const ZineColors(this.palette);

  @override
  ZineColors copyWith({Palette? palette}) =>
      ZineColors(palette ?? this.palette);

  @override
  ZineColors lerp(ZineColors? other, double t) =>
      t < 0.5 ? this : (other ?? this);
}

extension ZinePaletteContext on BuildContext {
  Palette get zine => Theme.of(this).extension<ZineColors>()!.palette;
}

ThemeData buildTheme(ZineVibe vibe) {
  final p = Palette.of(vibe);
  final scheme = ColorScheme(
    brightness: p.dark ? Brightness.dark : Brightness.light,
    primary: p.primary,
    onPrimary: p.onPrimary,
    secondary: p.secondary,
    onSecondary: const Color(0xFF070707),
    tertiary: p.accent,
    onTertiary: const Color(0xFF070707),
    error: p.destructive,
    onError: p.onPrimary,
    surface: p.card,
    onSurface: p.ink,
    surfaceContainerHighest: p.muted,
    onSurfaceVariant: p.mutedFg,
    outline: p.ink,
  );
  const square = RoundedRectangleBorder(borderRadius: BorderRadius.zero);
  final inkSide = BorderSide(color: p.ink, width: 3);
  final base = ThemeData(useMaterial3: true, colorScheme: scheme);

  return base.copyWith(
    scaffoldBackgroundColor: p.background,
    canvasColor: p.background,
    textTheme: base.textTheme
        .apply(
          fontFamily: ZineFonts.body,
          bodyColor: p.ink,
          displayColor: p.ink,
        )
        .copyWith(
          displayLarge: ZineText.heavy(64, color: p.ink),
          displayMedium: ZineText.heavy(48, color: p.ink),
          displaySmall: ZineText.heavy(36, color: p.ink),
          headlineMedium: ZineText.heavy(28, color: p.ink),
          titleLarge: ZineText.heavy(24, color: p.ink),
        ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: inkSide,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: inkSide,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: p.primary, width: 3),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: p.destructive, width: 3),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(shape: square),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        shape: square,
        side: inkSide,
        foregroundColor: p.ink,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(shape: square, foregroundColor: p.ink),
    ),
    dialogTheme: DialogThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
        side: inkSide,
      ),
      backgroundColor: p.card,
    ),
    drawerTheme: DrawerThemeData(
      shape: Border(left: inkSide),
      backgroundColor: p.background,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: p.ink,
      contentTextStyle: TextStyle(
        fontFamily: ZineFonts.body,
        color: p.background,
      ),
      shape: square,
      behavior: SnackBarBehavior.floating,
    ),
    checkboxTheme: CheckboxThemeData(
      shape: square,
      side: BorderSide(color: p.ink, width: 2),
    ),
    dividerTheme: DividerThemeData(color: p.ink, thickness: 2),
    extensions: [ZineColors(p)],
  );
}
