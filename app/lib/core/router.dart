import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/auth_repo.dart';
import 'app_shell.dart';

/// Pages that send a signed-in person on to their profile.
const _authOnly = {'/login', '/join', '/code', '/create-profile', '/forgot'};

/// Pages that need an account with a profile.
const _private = {'/profile', '/settings'};

/// Where to send someone, given their account state. Null = stay.
String? authRedirect(AuthStatus status, String location) {
  switch (status) {
    case AuthStatus.signedOut:
      if (_private.contains(location)) return '/login';
      if (location == '/code') return '/join';
      if (location == '/create-profile') return '/login';
      return null;
    case AuthStatus.awaitingCode:
      return location == '/code' || location == '/join' ? null : '/code';
    case AuthStatus.needsProfile:
      return location == '/create-profile' ? null : '/create-profile';
    case AuthStatus.signedIn:
      return _authOnly.contains(location) ? '/profile' : null;
  }
}

/// One page per route. Features fill these in; the key lets tests find the
/// page whatever it shows.
typedef PageBuilder =
    Widget Function(BuildContext context, GoRouterState state);

GoRouter buildRouter(
  AuthRepo auth,
  Map<String, PageBuilder> pages, {
  String initialLocation = '/',
}) {
  GoRoute route(String path) => GoRoute(
    path: path,
    // Key by the real URL: /u/ivan → /u/elena must build a new page,
    // not update the old one in place.
    pageBuilder: (context, state) => NoTransitionPage(
      key: ValueKey(state.uri.path),
      child: KeyedSubtree(
        key: ValueKey('page:$path'),
        child: pages[path]!(context, state),
      ),
    ),
  );

  return GoRouter(
    initialLocation: initialLocation,
    refreshListenable: auth,
    redirect: (context, state) => authRedirect(auth.status, state.uri.path),
    routes: [
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: pages.keys.map(route).toList(),
      ),
    ],
  );
}
