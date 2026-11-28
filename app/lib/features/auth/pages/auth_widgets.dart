import 'package:flutter/material.dart';

import '../../../core/app_error.dart';
import '../../../core/ui.dart';

/// The narrow form card all auth pages share (the design's `max-w-md` box).
class AuthCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const AuthCard({super.key, required this.title, required this.children});

  @override
  Widget build(BuildContext context) => PageColumn(
    maxWidth: PageWidth.form,
    child: ZineBox(
      padding: const EdgeInsets.all(24),
      // Own Material so list tiles and ink effects show on the card colour.
      child: Material(
        type: MaterialType.transparency,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(alignment: Alignment.centerLeft, child: RansomText(title)),
            const SizedBox(height: 20),
            ...children,
          ],
        ),
      ),
    ),
  );
}

/// Labelled input. Without a [validator] the field just has to be filled.
class ZineField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? Function(String)? validator;
  final bool obscure;
  final TextInputType? keyboard;
  final ValueChanged<String>? onChanged;
  final Iterable<String>? autofill;

  const ZineField({
    super.key,
    required this.label,
    required this.controller,
    this.validator,
    this.obscure = false,
    this.keyboard,
    this.onChanged,
    this.autofill,
  });

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboard,
      autofillHints: autofill,
      onChanged: onChanged,
      decoration: InputDecoration(labelText: label),
      validator: (v) {
        final value = v ?? '';
        if (validator != null) return validator!(value);
        return value.trim().isEmpty
            ? context.tr('Fill this in.', 'Попълни полето.')
            : null;
      },
    ),
  );
}

/// The pink submit button of an auth form; says "please wait" while [busy].
class SubmitButton extends StatelessWidget {
  final String label;
  final bool busy;
  final VoidCallback? onPressed;
  const SubmitButton({
    super.key,
    required this.label,
    required this.busy,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) => ZineButton(
    label: busy ? context.tr('PLEASE WAIT…', 'ЧАКАЙ…') : label,
    kind: ZineButtonKind.primary,
    onPressed: busy ? null : onPressed,
  );
}

/// Runs a server action with a busy flag; an [AppError] becomes a SnackBar.
mixin BusyAction<T extends StatefulWidget> on State<T> {
  bool busy = false;

  Future<void> run(Future<void> Function() action) async {
    setState(() => busy = true);
    try {
      await action();
    } on AppError catch (e) {
      if (mounted) showSnack(context, e.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
}
