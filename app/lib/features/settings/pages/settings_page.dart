import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/app_error.dart';
import '../../../core/app_shell.dart' show LanguagePicker;
import '../../../core/i18n/language.dart';
import '../../../core/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/palette.dart';
import '../../../core/widgets/zine.dart';
import '../../auth/auth_repo.dart';
import '../../profile/profile_models.dart';

/// Look, log out, delete account (design/lovable, routes/settings.tsx).
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Future<MyProfile>? _me;

  /// UI only for now: these switches are not saved anywhere.
  final _notify = {
    ('Email me new matches', 'Пращай ми нови съвпадения'): true,
    ('Deadline reminders', 'Напомняния за срокове'): true,
    ('Show my profile to organisers', 'Показвай профила ми на организатори'):
        false,
    ('Weekly zine digest', 'Седмичен бюлетин'): false,
  };

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _me ??= ServicesScope.of(context).profiles.loadMine();
  }

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => const _DeleteDialog(),
    );
    if (ok != true || !mounted) return;
    final auth = ServicesScope.of(context).auth;
    final router = GoRouter.of(context);
    try {
      await auth.deleteAccount();
      router.go('/');
    } on AppError catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final s = ServicesScope.of(context);
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 672),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              context.tr('SETTINGS', 'НАСТРОЙКИ'),
              style: ZineText.heavy(64, color: p.ink),
            ),
            const SizedBox(height: 24),
            ZineBox(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RansomText(context.tr('THEME', 'ВИЗИЯ')),
                  const SizedBox(height: 16),
                  ListenableBuilder(
                    listenable: s.theme,
                    builder: (context, _) => Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        for (final v in ZineVibe.values)
                          _VibeButton(
                            vibe: v,
                            selected: s.theme.vibe == v,
                            onTap: () => s.theme.set(v),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ZineBox(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: RansomText(context.tr('LANGUAGE', 'ЕЗИК')),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    context.tr(
                      'Changes the site\'s buttons and headings. Posts stay in the language the organiser wrote them in.',
                      'Сменя бутоните и заглавията на сайта. Обявите остават на езика, на който ги е написал организаторът.',
                    ),
                    style: TextStyle(fontSize: 13, color: p.mutedFg),
                  ),
                  const SizedBox(height: 16),
                  const SizedBox(
                    width: 372,
                    child: LanguagePicker(fontSize: 24, padding: 16),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ZineBox(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: RansomText(context.tr('NOTIFICATIONS', 'ИЗВЕСТИЯ')),
                  ),
                  const SizedBox(height: 8),
                  for (final (i, e) in _notify.entries.indexed) ...[
                    if (i > 0) const DashedLine(),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Expanded(child: Text(context.tr(e.key.$1, e.key.$2))),
                          Switch(
                            value: e.value,
                            onChanged: (v) =>
                                setState(() => _notify[e.key] = v),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),
            ZineBox(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RansomText(context.tr('ACCOUNT', 'АКАУНТ')),
                  const SizedBox(height: 16),
                  FutureBuilder<MyProfile>(
                    future: _me,
                    builder: (context, snap) => Text(
                      snap.hasData
                          ? '${context.tr('Role', 'Роля')}: '
                                '${snap.data!.type == AccountType.student ? context.tr('Candidate', 'Ученик') : context.tr('Organiser', 'Организатор')}'
                          : ' ',
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 16,
                    runSpacing: 16,
                    children: [
                      ZineButton(
                        label: context.tr('LOG OUT', 'ИЗХОД'),
                        onPressed: () => s.auth.signOut(),
                      ),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: p.destructive,
                          side: BorderSide(color: p.destructive, width: 3),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                        ),
                        onPressed: _delete,
                        child: Text(
                          context.tr('DELETE ACCOUNT', 'ИЗТРИЙ АКАУНТА'),
                          style: ZineText.heavy(22, color: p.destructive),
                        ),
                      ),
                    ],
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

class _VibeButton extends StatelessWidget {
  final ZineVibe vibe;
  final bool selected;
  final VoidCallback onTap;
  const _VibeButton({
    required this.vibe,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return SizedBox(
      width: 180,
      child: ZineBox(
        color: selected ? p.primary : p.card,
        padding: EdgeInsets.zero,
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  context.tr(vibe.label, vibe.labelBg),
                  style: ZineText.heavy(
                    24,
                    color: selected ? p.onPrimary : p.ink,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Asks for the word DELETE (ИЗТРИЙ in Bulgarian): deleting is forever.
class _DeleteDialog extends StatefulWidget {
  const _DeleteDialog();

  @override
  State<_DeleteDialog> createState() => _DeleteDialogState();
}

class _DeleteDialogState extends State<_DeleteDialog> {
  final _word = TextEditingController();

  @override
  void dispose() {
    _word.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final ok = _word.text.trim() == context.tr('DELETE', 'ИЗТРИЙ');
    return AlertDialog(
      title: Text(
        context.tr('DELETE ACCOUNT?', 'ИЗТРИВАНЕ НА АКАУНТА?'),
        style: ZineText.heavy(30),
      ),
      content: SizedBox(
        width: 460,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              context.tr(
                'Your profile, badges and everything you saved are deleted '
                    'forever. This cannot be undone.',
                'Профилът, значките и всичко запазено се изтриват завинаги. '
                    'Това не може да се върне.',
              ),
            ),
            const SizedBox(height: 16),
            Text(
              context.tr(
                'Type DELETE to confirm:',
                'Напиши ИЗТРИЙ, за да потвърдиш:',
              ),
            ),
            const SizedBox(height: 8),
            TextField(controller: _word, onChanged: (_) => setState(() {})),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text(context.tr('CANCEL', 'ОТКАЗ')),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: p.destructive),
          onPressed: ok ? () => Navigator.pop(context, true) : null,
          child: Text(context.tr('DELETE FOREVER', 'ИЗТРИЙ ЗАВИНАГИ')),
        ),
      ],
    );
  }
}
