import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/i18n/language.dart';
import '../../../core/services.dart';
import '../../../core/widgets/zine.dart';
import '../validators.dart';
import 'auth_widgets.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with BusyAction {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final auth = ServicesScope.of(context).auth;
    await run(() => auth.signIn(_email.text, _password.text));
  }

  @override
  Widget build(BuildContext context) => Form(
    key: _form,
    child: AuthCard(
      title: context.tr('LOG IN', 'ВХОД'),
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
          autofill: const [AutofillHints.password],
        ),
        const SizedBox(height: 6),
        ZineButton(
          label: busy
              ? context.tr('PLEASE WAIT…', 'ЧАКАЙ…')
              : context.tr('GET IN', 'ВЛИЗАМ'),
          pink: true,
          onPressed: busy ? null : _submit,
        ),
        const SizedBox(height: 12),
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          children: [
            TextLink(
              context.tr('Forgot password?', 'Забравена парола?'),
              onTap: () => context.go('/forgot'),
            ),
            TextLink(
              context.tr('No account? Sign up', 'Нямаш акаунт? Регистрация'),
              onTap: () => context.go('/join'),
            ),
          ],
        ),
      ],
    ),
  );
}
