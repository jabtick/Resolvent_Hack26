import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../features/auth/auth_repo.dart';
import 'config.dart';
import 'i18n/language.dart';
import 'services.dart';
import 'theme/app_theme.dart';
import 'theme/palette.dart';
import 'widgets/zine.dart';

/// The design's `Nav` (design/lovable, src/components/Nav.tsx): sticky header
/// with the brand, calendar, join/profile button and a side menu.
class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final auth = ServicesScope.of(context).auth;
    return ListenableBuilder(
      listenable: auth,
      builder: (context, _) {
        final signedIn = auth.status == AuthStatus.signedIn;
        return Scaffold(
          endDrawer: _Menu(signedIn: signedIn),
          body: HalftoneBackground(
            child: Column(
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: p.background,
                    border: Border(bottom: BorderSide(color: p.ink, width: 3)),
                  ),
                  child: _Centered(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        children: [
                          Flexible(
                            child: InkWell(
                              onTap: () => context.go('/'),
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text(
                                  kBrand,
                                  style: ZineText.display(34, color: p.primary),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Spacer(),
                          IconButton.filled(
                            tooltip: context.tr('Calendar', 'Календар'),
                            style: IconButton.styleFrom(
                              backgroundColor: p.secondary,
                              foregroundColor: const Color(0xFF070707),
                              shape: const RoundedRectangleBorder(),
                            ),
                            onPressed: () => context.go('/calendar'),
                            icon: const Icon(LucideIcons.calendarDays),
                          ),
                          if (MediaQuery.sizeOf(context).width >= 640) ...[
                            const SizedBox(width: 12),
                            ZineButton(
                              label: signedIn
                                  ? context.tr('ACCOUNT', 'АКАУНТ')
                                  : context.tr('JOIN', 'ВЛЕЗ'),
                              pink: true,
                              onPressed: () =>
                                  context.go(signedIn ? '/profile' : '/join'),
                            ),
                          ],
                          const SizedBox(width: 12),
                          Builder(
                            builder: (context) => IconButton.filled(
                              tooltip: context.tr('Menu', 'Меню'),
                              style: IconButton.styleFrom(
                                backgroundColor: p.secondary,
                                foregroundColor: const Color(0xFF070707),
                                shape: const RoundedRectangleBorder(),
                              ),
                              onPressed: () =>
                                  Scaffold.of(context).openEndDrawer(),
                              icon: const Icon(LucideIcons.menu),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    child: _Centered(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 32, bottom: 80),
                        child: child,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Content column, max 1152 px wide like the design's `max-w-6xl`.
class _Centered extends StatelessWidget {
  final Widget child;
  const _Centered({required this.child});

  @override
  Widget build(BuildContext context) => Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 1152),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: child,
      ),
    ),
  );
}

class _Menu extends StatelessWidget {
  final bool signedIn;
  const _Menu({required this.signedIn});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    void go(String path) {
      Navigator.of(context).pop();
      context.go(path);
    }

    final here = GoRouter.of(
      context,
    ).routerDelegate.currentConfiguration.uri.path;
    Widget item(IconData icon, String label, String path) => _MenuItem(
      icon: icon,
      label: label,
      active: here == path,
      onTap: () => go(path),
    );

    return Drawer(
      width: 320,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              context.tr('MENU', 'МЕНЮ'),
              style: ZineText.display(36, color: p.primary),
            ),
            const SizedBox(height: 24),
            item(LucideIcons.house, context.tr('Feed', 'Фийд'), '/'),
            item(LucideIcons.user, context.tr('Profile', 'Профил'), '/profile'),
            item(
              LucideIcons.calendarDays,
              context.tr('Calendar', 'Календар'),
              '/calendar',
            ),
            item(
              LucideIcons.award,
              context.tr('Achievements', 'Постижения'),
              '/achievements',
            ),
            item(
              LucideIcons.bookmark,
              context.tr('Saved', 'Запазени'),
              '/saved',
            ),
            item(
              LucideIcons.settings,
              context.tr('Settings', 'Настройки'),
              '/settings',
            ),
            if (!signedIn)
              item(
                LucideIcons.logIn,
                context.tr('Sign up / Log in', 'Регистрация / Вход'),
                '/join',
              ),
            if (signedIn)
              _MenuItem(
                icon: LucideIcons.logOut,
                label: context.tr('Log out', 'Изход'),
                onTap: () {
                  Navigator.of(context).pop();
                  ServicesScope.of(context).auth.signOut();
                },
              ),
            const SizedBox(height: 20),
            Row(
              children: [
                Icon(LucideIcons.palette, size: 20, color: p.ink),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    context.tr('pick your vibe', 'избери си стил'),
                    style: ZineText.hand(24, color: p.ink),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const _VibePicker(),
            const SizedBox(height: 20),
            Row(
              children: [
                Icon(LucideIcons.languages, size: 20, color: p.ink),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    context.tr('language', 'език'),
                    style: ZineText.hand(24, color: p.ink),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const LanguagePicker(),
            const SizedBox(height: 32),
            for (final (icon, text) in [
              (
                LucideIcons.bell,
                context.tr(
                  '3 new opportunities today',
                  '3 нови възможности днес',
                ),
              ),
              (
                LucideIcons.circleQuestionMark,
                context.tr('Help & how it works', 'Помощ и как работи'),
              ),
            ])
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(icon, size: 16, color: p.ink),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(text, style: const TextStyle(fontSize: 13)),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// The three themes as a row of square buttons (the design's "pick your vibe").
class _VibePicker extends StatelessWidget {
  const _VibePicker();

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
  Widget build(BuildContext context) {
    final lang = ServicesScope.of(context).lang;
    return ZinePicker<AppLang>(
      options: [for (final l in AppLang.values) (l, l.label)],
      value: context.lang,
      onChanged: lang.set,
      fontSize: fontSize,
      padding: padding,
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool active;
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final fg = active ? p.onPrimary : p.ink;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Jitter(
        child: ZineBox(
          color: active ? p.primary : null,
          padding: EdgeInsets.zero,
          child: Material(
            type: MaterialType.transparency,
            child: ListTile(
              leading: Icon(icon, color: fg),
              title: Text(label, style: ZineText.heavy(24, color: fg)),
              onTap: onTap,
            ),
          ),
        ),
      ),
    );
  }
}
