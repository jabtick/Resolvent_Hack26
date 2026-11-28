import 'package:flutter/widgets.dart';

import '../i18n/language.dart';
import '../services.dart';
import '../theme/palette.dart';
import 'buttons.dart';

/// "Pick your vibe": one square button per theme. Saved in the browser.
class VibePicker extends StatelessWidget {
  final double fontSize, padding;
  const VibePicker({super.key, this.fontSize = 18, this.padding = 8});

  @override
  Widget build(BuildContext context) {
    final theme = ServicesScope.of(context).theme;
    return ListenableBuilder(
      listenable: theme,
      builder: (context, _) => ZinePicker<ZineVibe>(
        options: [
          for (final v in ZineVibe.values) (v, context.tr(v.label, v.labelBg)),
        ],
        value: theme.vibe,
        onChanged: theme.set,
        fontSize: fontSize,
        padding: padding,
      ),
    );
  }
}

/// EN / БГ switch for the site's own text. Organisers' posts stay in
/// whatever language they were written in.
class LanguagePicker extends StatelessWidget {
  final double fontSize, padding;
  const LanguagePicker({super.key, this.fontSize = 18, this.padding = 8});

  @override
  Widget build(BuildContext context) => ZinePicker<AppLang>(
    options: [for (final l in AppLang.values) (l, l.label)],
    value: context.lang,
    onChanged: ServicesScope.of(context).lang.set,
    fontSize: fontSize,
    padding: padding,
  );
}
