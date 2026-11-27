import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../features/auth/auth_repo.dart';
import 'config.dart';
import 'services.dart';
import 'theme/app_theme.dart';
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
                          InkWell(
                            onTap: () => context.go('/'),
                            child: Text(
                              kBrand,
                              style: ZineText.display(34, color: p.primary),
                            ),
                          ),
                          const Spacer(),
                          IconButton.filled(
                            tooltip: 'Календар',
                            style: IconButton.styleFrom(
                              backgroundColor: p.secondary,
                              foregroundColor: const Color(0xFF070707),
                              shape: const RoundedRectangleBorder(),
                            ),
                            onPressed: () => context.go('/calendar'),
                            icon: const Icon(LucideIcons.calendarDays),
                          ),
                          const SizedBox(width: 12),
                          ZineButton(
                            label: signedIn ? 'ПРОФИЛ' : 'ВХОД',
                            pink: true,
                            onPressed: () =>
                                context.go(signedIn ? '/profile' : '/join'),
                          ),
                          const SizedBox(width: 12),
                          Builder(
                            builder: (context) => IconButton.filled(
                              tooltip: 'Меню',
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

    Widget item(IconData icon, String label, String path) =>
        _MenuItem(icon: icon, label: label, onTap: () => go(path));

    return Drawer(
      width: 320,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('МЕНЮ', style: ZineText.display(36, color: p.primary)),
            const SizedBox(height: 24),
            item(LucideIcons.house, 'Фийд', '/'),
            item(LucideIcons.user, 'Профил', '/profile'),
            item(LucideIcons.calendarDays, 'Календар', '/calendar'),
            item(LucideIcons.award, 'Постижения', '/achievements'),
            item(LucideIcons.settings, 'Настройки', '/settings'),
            if (!signedIn)
              item(LucideIcons.logIn, 'Вход / Регистрация', '/join'),
            if (signedIn)
              _MenuItem(
                icon: LucideIcons.logOut,
                label: 'Изход',
                onTap: () {
                  Navigator.of(context).pop();
                  ServicesScope.of(context).auth.signOut();
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ZineBox(
        padding: EdgeInsets.zero,
        child: Material(
          type: MaterialType.transparency,
          child: ListTile(
            leading: Icon(icon, color: p.ink),
            title: Text(label, style: ZineText.heavy(24, color: p.ink)),
            onTap: onTap,
          ),
        ),
      ),
    );
  }
}
