import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../features/auth/auth_repo.dart';
import 'config.dart';
import 'services.dart';
import 'ui.dart';

/// The frame around every page (design/lovable, src/components/Nav.tsx):
/// sticky header with the brand, calendar, join/account button and the side
/// menu; below it the page, centred and scrollable.
///
/// Menu entries live in [_menuItems] — add a line there for a new page.
class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
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
                _Header(signedIn: signedIn),
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

class _Header extends StatelessWidget {
  final bool signedIn;
  const _Header({required this.signedIn});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: p.background,
        border: Border(
          bottom: BorderSide(color: p.ink, width: ZineSize.border),
        ),
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
              const Spacer(),
              ZineIconButton(
                icon: LucideIcons.calendarDays,
                tooltip: context.tr('Calendar', 'Календар'),
                onPressed: () => context.go('/calendar'),
              ),
              if (MediaQuery.sizeOf(context).width >= Breakpoints.phone) ...[
                const SizedBox(width: 12),
                ZineButton(
                  label: signedIn
                      ? context.tr('ACCOUNT', 'АКАУНТ')
                      : context.tr('JOIN', 'ВЛЕЗ'),
                  kind: ZineButtonKind.primary,
                  onPressed: () => context.go(signedIn ? '/profile' : '/join'),
                ),
              ],
              const SizedBox(width: 12),
              // Builder: Scaffold.of needs a context below the Scaffold.
              Builder(
                builder: (context) => ZineIconButton(
                  icon: LucideIcons.menu,
                  tooltip: context.tr('Menu', 'Меню'),
                  onPressed: () => Scaffold.of(context).openEndDrawer(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Content column, max [PageWidth.max] wide like the design's `max-w-6xl`.
class _Centered extends StatelessWidget {
  final Widget child;
  const _Centered({required this.child});

  @override
  Widget build(BuildContext context) => PageColumn(
    maxWidth: PageWidth.max,
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: child,
    ),
  );
}

/// The side menu's page links: icon, label (EN, БГ), path.
List<(IconData, String, String)> _menuItems(BuildContext context) => [
  (LucideIcons.house, context.tr('Feed', 'Фийд'), '/'),
  (LucideIcons.user, context.tr('Profile', 'Профил'), '/profile'),
  (LucideIcons.calendarDays, context.tr('Calendar', 'Календар'), '/calendar'),
  (
    LucideIcons.award,
    context.tr('Achievements', 'Постижения'),
    '/achievements',
  ),
  (LucideIcons.bookmark, context.tr('Saved', 'Запазени'), '/saved'),
  (LucideIcons.settings, context.tr('Settings', 'Настройки'), '/settings'),
];

class _Menu extends StatelessWidget {
  final bool signedIn;
  const _Menu({required this.signedIn});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final here = GoRouter.of(
      context,
    ).routerDelegate.currentConfiguration.uri.path;
    void close() => Navigator.of(context).pop();

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
            for (final (icon, label, path) in _menuItems(context))
              _MenuItem(
                icon: icon,
                label: label,
                active: here == path,
                onTap: () {
                  close();
                  context.go(path);
                },
              ),
            if (signedIn)
              _MenuItem(
                icon: LucideIcons.logOut,
                label: context.tr('Log out', 'Изход'),
                onTap: () {
                  close();
                  ServicesScope.of(context).auth.signOut();
                },
              )
            else
              _MenuItem(
                icon: LucideIcons.logIn,
                label: context.tr('Sign up / Log in', 'Регистрация / Вход'),
                active: here == '/join',
                onTap: () {
                  close();
                  context.go('/join');
                },
              ),
            const SizedBox(height: 20),
            _MenuLabel(
              LucideIcons.palette,
              context.tr('pick your vibe', 'избери си стил'),
            ),
            const VibePicker(),
            const SizedBox(height: 20),
            _MenuLabel(LucideIcons.languages, context.tr('language', 'език')),
            const LanguagePicker(),
            const SizedBox(height: 32),
            // Sample lines from the design; not wired to anything yet.
            IconLabel(
              LucideIcons.bell,
              context.tr(
                '3 new opportunities today',
                '3 нови възможности днес',
              ),
              color: p.ink,
              size: 13,
            ),
            const SizedBox(height: 8),
            IconLabel(
              LucideIcons.circleQuestionMark,
              context.tr('Help & how it works', 'Помощ и как работи'),
              color: p.ink,
              size: 13,
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuLabel extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MenuLabel(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: p.ink),
          const SizedBox(width: 8),
          Flexible(
            child: Text(text, style: ZineText.hand(24, color: p.ink)),
          ),
        ],
      ),
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
      child: ZineBox(
        color: active ? p.primary : null,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        onTap: onTap,
        child: Row(
          children: [
            Icon(icon, color: fg),
            const SizedBox(width: 16),
            Flexible(
              child: Text(label, style: ZineText.heavy(24, color: fg)),
            ),
          ],
        ),
      ),
    );
  }
}
