import 'package:flutter/material.dart';

import 'palette.dart';
import 'tokens.dart';

/// Fonts bundled in assets/fonts (Cyrillic-capable stand-ins for the design's
/// Bebas Neue / Space Mono / Permanent Marker, which have no Cyrillic).
/// To swap a font: add the .ttf to assets/fonts, list it in pubspec.yaml,
/// change the family name here.
abstract final class ZineFonts {
  static const display = 'RubikGlitch';
  static const heavy = 'Oswald';
  static const body = 'IBMPlexMono';
  static const hand = 'Caveat';

  /// Oswald and Caveat are variable fonts: set the weight axis explicitly.
  static const bold = [FontVariation('wght', 700)];
}

/// The text styles. Plain `Text('…')` already gets the body font and ink
/// colour from the theme; use these for everything louder or quieter.
abstract final class ZineText {
  /// Headings, labels, buttons (Oswald bold).
  static TextStyle heavy(double size, {Color? color}) => TextStyle(
    fontFamily: ZineFonts.heavy,
    fontVariations: ZineFonts.bold,
    fontWeight: FontWeight.w700,
    fontSize: size,
    height: 1.0,
    color: color,
  );

  /// Hand-written notes and kickers (Caveat).
  static TextStyle hand(double size, {Color? color}) => TextStyle(
    fontFamily: ZineFonts.hand,
    fontVariations: ZineFonts.bold,
    fontSize: size,
    color: color,
  );

  /// The glitchy logo font, for the brand and big card titles.
  static TextStyle display(double size, {Color? color}) => TextStyle(
    fontFamily: ZineFonts.display,
    fontSize: size,
    height: 1.0,
    color: color,
  );

  /// Small body text: captions, dates, meta lines. Pass `p.mutedFg` for
  /// the grey "secondary" look.
  static TextStyle small({Color? color, double size = 12, bool bold = false}) =>
      TextStyle(
        fontSize: size,
        color: color,
        fontWeight: bold ? FontWeight.w700 : null,
      );

  /// Body text in bold (names, titles in lists).
  static const bold = TextStyle(fontWeight: FontWeight.w700);
}

/// Lets widgets reach the active palette (use [ZinePaletteContext.zine]).
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
  /// The active vibe's colours: `final p = context.zine;` then `p.ink`.
  Palette get zine => Theme.of(this).extension<ZineColors>()!.palette;
}

/// Material's theme, restyled so stock widgets (inputs, dialogs, switches,
/// outlined buttons, snack bars) already look zine without extra code.
ThemeData buildTheme(ZineVibe vibe) {
  final p = Palette.of(vibe);
  final scheme = ColorScheme(
    brightness: p.dark ? Brightness.dark : Brightness.light,
    primary: p.primary,
    onPrimary: p.onPrimary,
    secondary: p.secondary,
    onSecondary: p.onBright,
    tertiary: p.accent,
    onTertiary: p.onBright,
    error: p.destructive,
    onError: p.onPrimary,
    surface: p.card,
    onSurface: p.ink,
    surfaceContainerHighest: p.muted,
    onSurfaceVariant: p.mutedFg,
    outline: p.ink,
  );
  const square = RoundedRectangleBorder(borderRadius: BorderRadius.zero);
  final inkSide = BorderSide(color: p.ink, width: ZineSize.border);
  OutlineInputBorder inputBorder(Color c) => OutlineInputBorder(
    borderRadius: BorderRadius.zero,
    borderSide: BorderSide(color: c, width: ZineSize.border),
  );
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
      border: inputBorder(p.ink),
      enabledBorder: inputBorder(p.ink),
      focusedBorder: inputBorder(p.primary),
      errorBorder: inputBorder(p.destructive),
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
      side: BorderSide(color: p.ink, width: ZineSize.thinBorder),
    ),
    dividerTheme: DividerThemeData(
      color: p.ink,
      thickness: ZineSize.thinBorder,
    ),
    extensions: [ZineColors(p)],
  );
}
