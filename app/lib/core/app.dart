import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/achievements/pages/achievements_page.dart';
import '../features/auth/pages/code_page.dart';
import '../features/auth/pages/create_profile_page.dart';
import '../features/auth/pages/forgot_page.dart';
import '../features/auth/pages/join_page.dart';
import '../features/auth/pages/login_page.dart';
import '../features/calendar/pages/calendar_page.dart';
import '../features/feed/pages/feed_page.dart';
import '../features/feed/pages/opp_page.dart';
import '../features/feed/pages/saved_page.dart';
import '../features/profile/pages/my_profile_page.dart';
import '../features/profile/pages/public_profile_page.dart';
import '../features/settings/pages/settings_page.dart';
import 'config.dart';
import 'i18n/language.dart';
import 'router.dart';
import 'services.dart';
import 'theme/app_theme.dart';

/// Every route and the page that fills it. A new page = one line here (and,
/// if it needs a menu entry, one in `_menuItems` in app_shell.dart; if it
/// needs a signed-in user, add its path to `_private` in router.dart).
Map<String, PageBuilder> appPages() => {
  '/': (c, s) => const FeedPage(),
  '/opp/:id': (c, s) => OppPage(id: s.pathParameters['id']!),
  '/saved': (c, s) => const SavedPage(),
  '/calendar': (c, s) => const CalendarPage(),
  '/achievements': (c, s) => const AchievementsPage(),
  '/join': (c, s) => const JoinPage(),
  '/login': (c, s) => const LoginPage(),
  '/code': (c, s) => const CodePage(),
  '/create-profile': (c, s) => const CreateProfilePage(),
  '/forgot': (c, s) => const ForgotPage(),
  '/profile': (c, s) => const MyProfilePage(),
  '/u/:username': (c, s) =>
      PublicProfilePage(username: s.pathParameters['username']!),
  '/settings': (c, s) => const SettingsPage(),
};

class NoFutureApp extends StatefulWidget {
  final Services services;
  final String initialLocation;
  const NoFutureApp({
    super.key,
    required this.services,
    this.initialLocation = '/',
  });

  @override
  State<NoFutureApp> createState() => _NoFutureAppState();
}

class _NoFutureAppState extends State<NoFutureApp> {
  late final GoRouter _router = buildRouter(
    widget.services.auth,
    appPages(),
    initialLocation: widget.initialLocation,
  );

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = widget.services.theme;
    return ServicesScope(
      services: widget.services,
      child: LanguageScope(
        controller: widget.services.lang,
        child: ListenableBuilder(
          listenable: theme,
          builder: (context, _) => MaterialApp.router(
            title: kBrand,
            debugShowCheckedModeBanner: false,
            theme: buildTheme(theme.vibe),
            routerConfig: _router,
          ),
        ),
      ),
    );
  }
}
