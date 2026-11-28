import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/theme/app_theme.dart';
import 'package:nofuture/core/theme/palette.dart';
import 'package:nofuture/core/theme/theme_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('zine palette uses the design pink', () {
    expect(Palette.of(ZineVibe.zine).primary, const Color(0xFFF40091));
    expect(Palette.of(ZineVibe.zine).background, const Color(0xFFF9F5E6));
  });

  test('acid palette swaps primary to purple', () {
    expect(Palette.of(ZineVibe.acid).primary, const Color(0xFF8C34E9));
  });

  test('vibes have Bulgarian labels', () {
    expect(ZineVibe.values.map((v) => v.label), [
      'Photocopy',
      'Basement',
      'Acid',
    ]);
  });

  test('basement is a dark theme', () {
    expect(
      buildTheme(ZineVibe.basement).colorScheme.brightness,
      Brightness.dark,
    );
  });

  test('theme exposes the palette as an extension', () {
    final theme = buildTheme(ZineVibe.acid);
    expect(
      theme.extension<ZineColors>()!.palette.primary,
      const Color(0xFF8C34E9),
    );
  });

  test('controller loads the saved vibe', () async {
    SharedPreferences.setMockInitialValues({'vibe': 'acid'});
    final c = ThemeController();
    await c.load();
    expect(c.vibe, ZineVibe.acid);
  });

  test('controller saves the chosen vibe and notifies', () async {
    SharedPreferences.setMockInitialValues({});
    final c = ThemeController();
    var notified = 0;
    c.addListener(() => notified++);
    await c.set(ZineVibe.basement);
    expect(c.vibe, ZineVibe.basement);
    expect(notified, 1);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('vibe'), 'basement');
  });

  test('unknown saved value falls back to zine', () async {
    SharedPreferences.setMockInitialValues({'vibe': 'neon'});
    final c = ThemeController();
    await c.load();
    expect(c.vibe, ZineVibe.zine);
  });
}
