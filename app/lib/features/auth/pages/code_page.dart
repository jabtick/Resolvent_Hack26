import 'package:flutter/material.dart';

import '../../../core/services.dart';
import '../../../core/widgets/zine.dart';
import 'auth_widgets.dart';

/// Enter the 6-digit code from the confirmation email.
class CodePage extends StatefulWidget {
  const CodePage({super.key});

  @override
  State<CodePage> createState() => _CodePageState();
}

class _CodePageState extends State<CodePage> with BusyAction {
  final _form = GlobalKey<FormState>();
  final _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ServicesScope.of(context).auth;
    return Form(
      key: _form,
      child: AuthCard(
        title: 'ПРОВЕРИ ПОЩАТА',
        children: [
          Text(
            'Пратихме 6-цифрен код на ${auth.pendingEmail ?? 'имейла ти'}. '
            'Въведи го тук.',
          ),
          const SizedBox(height: 16),
          ZineField(
            label: 'Код',
            controller: _code,
            keyboard: TextInputType.number,
            autofill: const [AutofillHints.oneTimeCode],
            validator: (v) => RegExp(r'^\d{6}$').hasMatch(v.trim())
                ? null
                : 'Кодът е 6 цифри.',
          ),
          ZineButton(
            label: busy ? 'ЧАКАЙ…' : 'ПОТВЪРДИ',
            pink: true,
            onPressed: busy
                ? null
                : () {
                    if (_form.currentState!.validate()) {
                      run(() => auth.confirmCode(_code.text));
                    }
                  },
          ),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            children: [
              TextLink(
                'Прати нов код',
                onTap: () {
                  if (busy) return;
                  run(() async {
                    await auth.resendCode();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Пратихме нов код.')),
                      );
                    }
                  });
                },
              ),
              TextLink('Започни отначало', onTap: () => auth.signOut()),
            ],
          ),
        ],
      ),
    );
  }
}
