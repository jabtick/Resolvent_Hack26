import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Colours live in lib/core/theme/palette.dart only, so the three vibes keep
/// working and a teammate can restyle the app in one file. Use
/// `context.zine.<colour>` in widgets instead of `Color(0x…)` / `Colors.x`.
void main() {
  test('no hard-coded colours outside the palette', () {
    final offenders = <String>[];
    final pattern = RegExp(r'Color\(0x|Colors\.(?!transparent)');
    for (final f in Directory('lib').listSync(recursive: true)) {
      if (f is! File || !f.path.endsWith('.dart')) continue;
      if (f.path.replaceAll(r'\', '/').endsWith('core/theme/palette.dart')) {
        continue;
      }
      final lines = f.readAsLinesSync();
      for (var i = 0; i < lines.length; i++) {
        if (pattern.hasMatch(lines[i])) offenders.add('${f.path}:${i + 1}');
      }
    }
    expect(offenders, isEmpty, reason: 'Use context.zine.* instead.');
  });
}
