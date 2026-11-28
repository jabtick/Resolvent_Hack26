import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The language of the site's own text (buttons, headings, labels).
/// Content written by organisers — titles, descriptions, org names — is
/// shown exactly as they wrote it and is never translated.
enum AppLang {
  en('EN'),
  bg('БГ');

  final String label;
  const AppLang(this.label);
}

/// The chosen language, remembered in the browser between visits.
class LanguageController extends ChangeNotifier {
  static const _key = 'lang';
  AppLang _lang = AppLang.en;

  AppLang get lang => _lang;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_key);
    _lang = AppLang.values.firstWhere(
      (l) => l.name == saved,
      orElse: () => AppLang.en,
    );
    notifyListeners();
  }

  Future<void> set(AppLang l) async {
    _lang = l;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, l.name);
  }
}

/// Rebuilds every widget that called [TrContext.tr] when the language changes.
class LanguageScope extends InheritedNotifier<LanguageController> {
  const LanguageScope({
    super.key,
    required LanguageController controller,
    required super.child,
  }) : super(notifier: controller);
}

extension TrContext on BuildContext {
  /// The current language (English when there is no [LanguageScope]).
  AppLang get lang =>
      dependOnInheritedWidgetOfExactType<LanguageScope>()?.notifier?.lang ??
      AppLang.en;

  /// UI text in both languages, side by side where it is used:
  /// `Text(context.tr('Settings', 'Настройки'))`.
  String tr(String en, String bg) => lang == AppLang.bg ? bg : en;
}
