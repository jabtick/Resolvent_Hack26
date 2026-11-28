import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/services.dart';
import '../../../core/ui.dart';
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
              Text(
                context.tr('WHICH SIDE', 'НА КОЯ СТРАНА'),
                style: ZineText.heavy(56, color: p.ink),
              ),
              RansomText(context.tr('ARE YOU ON?', 'СИ?'), size: 56),
            ],
          ),
          const SizedBox(height: 40),
          Wrap(
            spacing: 32,
            runSpacing: 32,
            alignment: WrapAlignment.center,
            children: [
              _SideCard(
                title: context.tr('CANDIDATE', 'УЧЕНИК'),
                sub: context.tr(
                  'Find opportunities. Build your own future.',
                  'Намери възможности. Изгради си бъдещето.',
                ),
                icon: LucideIcons.rocket,
                color: p.secondary,
                textColor: p.onBright,
                tilt: -1.5,
                onTap: () => setState(() => _side = AccountType.student),
              ),
              _SideCard(
                title: context.tr('ORGANISER', 'ОРГАНИЗАТОР'),
                sub: context.tr(
                  'Publish events. Find your next crew.',
                  'Публикувай събития. Намери следващия си екип.',
                ),
                icon: LucideIcons.megaphone,
                color: p.primary,
                textColor: p.onPrimary,
                tilt: 1.2,
                onTap: () => setState(() => _side = AccountType.organizer),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextLink(
            context.tr('Have an account? Log in', 'Имаш акаунт? Влез'),
            onTap: () => context.go('/login'),
          ),
        ],
      );
    }

    return Form(
      key: _form,
      child: AuthCard(
        title: _side == AccountType.student
            ? context.tr('CANDIDATE', 'УЧЕНИК')
            : context.tr('ORGANISER', 'ОРГАНИЗАТОР'),
        children: [
          ZineField(
            label: context.tr('Email', 'Имейл'),
            controller: _email,
            keyboard: TextInputType.emailAddress,
            autofill: const [AutofillHints.email],
            validator: validateEmail,
          ),
          ZineField(
            label: context.tr('Password', 'Парола'),
            controller: _password,
            obscure: true,
            autofill: const [AutofillHints.newPassword],
            validator: validatePassword,
          ),
          const SizedBox(height: 6),
          SubmitButton(
            busy: busy,
            label: context.tr('LET’S GO', 'ДАВАЙ'),
            onPressed: _submit,
          ),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            children: [
              TextLink(
                context.tr('Change side', 'Смени страната'),
                onTap: () => setState(() => _side = null),
              ),
              TextLink(
                context.tr('Have an account? Log in', 'Имаш акаунт? Влез'),
                onTap: () => context.go('/login'),
              ),
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
      padding: const EdgeInsets.all(32),
      onTap: onTap,
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
  );
}
