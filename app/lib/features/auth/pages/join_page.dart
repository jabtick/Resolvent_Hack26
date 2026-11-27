import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/zine.dart';
import '../auth_repo.dart';
import '../validators.dart';
import 'auth_widgets.dart';

/// "Which side are you on?" then sign-up (design/lovable, routes/join.tsx).
class JoinPage extends StatefulWidget {
  const JoinPage({super.key});

  @override
  State<JoinPage> createState() => _JoinPageState();
}

class _JoinPageState extends State<JoinPage> with BusyAction {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  AccountType? _side;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final s = ServicesScope.of(context);
    s.signupDraft.side = _side;
    await run(() async {
      await s.auth.signUp(_email.text, _password.text);
      // Staying on /join is allowed while a code is pending, so go on explicitly.
      if (mounted) context.go('/code');
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    if (_side == null) {
      return Column(
        children: [
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            children: [
              Text('НА КОЯ СТРАНА', style: ZineText.heavy(56, color: p.ink)),
              const RansomText('СИ?', size: 56),
            ],
          ),
          const SizedBox(height: 40),
          Wrap(
            spacing: 32,
            runSpacing: 32,
            alignment: WrapAlignment.center,
            children: [
              _SideCard(
                title: 'УЧЕНИК',
                sub: 'Намери възможности. Изгради си бъдещето.',
                icon: LucideIcons.rocket,
                color: p.secondary,
                textColor: const Color(0xFF070707),
                tilt: -1.5,
                onTap: () => setState(() => _side = AccountType.student),
              ),
              _SideCard(
                title: 'ОРГАНИЗАТОР',
                sub: 'Публикувай събития. Намери следващия си екип.',
                icon: LucideIcons.megaphone,
                color: p.primary,
                textColor: p.onPrimary,
                tilt: 1.2,
                onTap: () => setState(() => _side = AccountType.organizer),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextLink('Имаш акаунт? Влез', onTap: () => context.go('/login')),
        ],
      );
    }

    return Form(
      key: _form,
      child: AuthCard(
        title: _side == AccountType.student ? 'УЧЕНИК' : 'ОРГАНИЗАТОР',
        children: [
          ZineField(
            label: 'Имейл',
            controller: _email,
            keyboard: TextInputType.emailAddress,
            autofill: const [AutofillHints.email],
            validator: validateEmail,
          ),
          ZineField(
            label: 'Парола',
            controller: _password,
            obscure: true,
            autofill: const [AutofillHints.newPassword],
            validator: validatePassword,
          ),
          const SizedBox(height: 6),
          ZineButton(
            label: busy ? 'ЧАКАЙ…' : 'ДАВАЙ',
            pink: true,
            onPressed: busy ? null : _submit,
          ),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            children: [
              TextLink(
                'Смени страната',
                onTap: () => setState(() => _side = null),
              ),
              TextLink('Имаш акаунт? Влез', onTap: () => context.go('/login')),
            ],
          ),
        ],
      ),
    );
  }
}

class _SideCard extends StatelessWidget {
  final String title, sub;
  final IconData icon;
  final Color color, textColor;
  final double tilt;
  final VoidCallback onTap;

  const _SideCard({
    required this.title,
    required this.sub,
    required this.icon,
    required this.color,
    required this.textColor,
    required this.tilt,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 340,
    child: ZineBox(
      color: color,
      tilt: tilt,
      padding: EdgeInsets.zero,
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 48, color: textColor),
                const SizedBox(height: 12),
                Text(title, style: ZineText.display(34, color: textColor)),
                const SizedBox(height: 8),
                Text(sub, style: TextStyle(color: textColor)),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
