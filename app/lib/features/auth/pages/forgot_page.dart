import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/i18n/language.dart';
import '../../../core/services.dart';
import '../../../core/widgets/zine.dart';
import '../validators.dart';
import 'auth_widgets.dart';

/// Forgotten password: email → code → new password.
class ForgotPage extends StatefulWidget {
  const ForgotPage({super.key});

  @override
  State<ForgotPage> createState() => _ForgotPageState();
}

class _ForgotPageState extends State<ForgotPage> with BusyAction {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    for (final c in [_email, _code, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final auth = ServicesScope.of(context).auth;
    if (!_sent) {
      await run(() async {
        await auth.sendPasswordReset(_email.text);
        setState(() => _sent = true);
      });
    } else {
      await run(
        () => auth.resetPassword(_email.text, _code.text, _password.text),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Form(
    key: _form,
    child: AuthCard(
      title: context.tr('NEW PASSWORD', 'НОВА ПАРОЛА'),
      children: [
        ZineField(
          label: context.tr('Email', 'Имейл'),
          controller: _email,
          keyboard: TextInputType.emailAddress,
          validator: validateEmail,
        ),
        if (_sent) ...[
          Text(
            context.tr(
              'If there is an account with this email, we sent a code.',
              'Ако има акаунт с този имейл, пратихме код.',
            ),
          ),
          const SizedBox(height: 14),
          ZineField(
            label: context.tr('Code', 'Код'),
            controller: _code,
            keyboard: TextInputType.number,
            validator: (v) => RegExp(r'^\d{6}$').hasMatch(v.trim())
                ? null
                : context.tr('The code is 6 digits.', 'Кодът е 6 цифри.'),
          ),
          ZineField(
            label: context.tr('New password', 'Нова парола'),
            controller: _password,
            obscure: true,
            autofill: const [AutofillHints.newPassword],
            validator: validatePassword,
          ),
        ],
        const SizedBox(height: 6),
        ZineButton(
          label: busy
              ? context.tr('PLEASE WAIT…', 'ЧАКАЙ…')
              : _sent
              ? context.tr('CHANGE PASSWORD', 'СМЕНИ ПАРОЛАТА')
              : context.tr('SEND CODE', 'ПРАТИ КОД'),
          pink: true,
          onPressed: busy ? null : _submit,
        ),
        const SizedBox(height: 12),
        TextLink(
          context.tr('Back to log in', 'Обратно към вход'),
          onTap: () => context.go('/login'),
        ),
      ],
    ),
  );
}
