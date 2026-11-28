/// Everything a page needs for the look, in one import:
///
/// ```dart
/// import 'package:flutter/material.dart';
/// import '../../../core/ui.dart';
/// ```
///
/// Colours (`context.zine`), text styles (`ZineText`), sizes and breakpoints,
/// the zine widgets, and `context.tr` for EN/БГ text. The catalogue of
/// widgets is in app/README.md.
library;

export 'i18n/dates.dart';
export 'i18n/language.dart';
export 'theme/app_theme.dart';
export 'theme/palette.dart';
export 'theme/tokens.dart';
export 'widgets/boxes.dart';
export 'widgets/buttons.dart';
export 'widgets/decor.dart';
export 'widgets/layout.dart';
export 'widgets/pickers.dart';
export 'widgets/sticky_rail.dart';
export 'widgets/text.dart';
