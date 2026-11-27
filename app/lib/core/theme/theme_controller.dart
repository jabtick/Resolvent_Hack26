import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'palette.dart';

/// The chosen vibe, remembered in the browser between visits.
class ThemeController extends ChangeNotifier {
  static const _key = 'vibe';
  ZineVibe _vibe = ZineVibe.zine;

  ZineVibe get vibe => _vibe;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_key);
    _vibe = ZineVibe.values.firstWhere(
      (v) => v.name == saved,
      orElse: () => ZineVibe.zine,
    );
    notifyListeners();
  }

  Future<void> set(ZineVibe v) async {
    _vibe = v;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, v.name);
  }
}
