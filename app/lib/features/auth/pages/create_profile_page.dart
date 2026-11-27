import 'package:flutter/material.dart';

import '../../../core/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/zine.dart';
import '../auth_repo.dart';
import '../validators.dart';
import 'auth_widgets.dart';

/// Reads "01.05.2008" (or "1.5.2008"). Null for anything else, impossible
/// dates, before 1900 (the DB check) or in the future.
DateTime? parseBgDate(String v) {
  final m = RegExp(r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$').firstMatch(v.trim());
  if (m == null) return null;
  final d = int.parse(m[1]!), mo = int.parse(m[2]!), y = int.parse(m[3]!);
  final date = DateTime(y, mo, d);
  if (date.year != y || date.month != mo || date.day != d) return null;
  if (y < 1900 || date.isAfter(DateTime.now())) return null;
  return date;
}

/// Last step of sign-up: the public profile.
class CreateProfilePage extends StatefulWidget {
  const CreateProfilePage({super.key});

  @override
  State<CreateProfilePage> createState() => _CreateProfilePageState();
}

class _CreateProfilePageState extends State<CreateProfilePage> with BusyAction {
  final _form = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _name = TextEditingController();
  final _birth = TextEditingController();
  final _org = TextEditingController();
  AccountType? _type;
  OrgType? _orgType;
  bool _terms = false;
  DateTime? _birthDate;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _type ??= ServicesScope.of(context).signupDraft.side ?? AccountType.student;
  }

  @override
  void dispose() {
    for (final c in [_username, _name, _birth, _org]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final auth = ServicesScope.of(context).auth;
    final student = _type == AccountType.student;
    await run(
      () => auth.createProfile(
        NewProfile(
          type: _type!,
          username: _username.text.trim(),
          displayName: _name.text.trim(),
          birthDate: student ? _birthDate : null,
          orgName: student ? null : _org.text.trim(),
          orgType: student ? null : _orgType,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    final student = _type == AccountType.student;
    final under14 =
        _birthDate != null && isUnder14(_birthDate!, DateTime.now());

    return Form(
      key: _form,
      child: AuthCard(
        title: 'ТВОЯТ ПРОФИЛ',
        children: [
          Wrap(
            spacing: 8,
            children: [
              for (final t in AccountType.values)
                ChoiceChip(
                  label: Text(
                    t == AccountType.student ? 'Ученик' : 'Организатор',
                  ),
                  selected: _type == t,
                  onSelected: (_) => setState(() => _type = t),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ZineField(
            label: 'Потребителско име',
            controller: _username,
            validator: validateUsername,
          ),
          ZineField(
            label: 'Име',
            controller: _name,
            validator: validateDisplayName,
          ),
          if (student) ...[
            ZineField(
              label: 'Дата на раждане (ДД.ММ.ГГГГ)',
              controller: _birth,
              keyboard: TextInputType.datetime,
              onChanged: (v) => setState(() => _birthDate = parseBgDate(v)),
              validator: (v) => parseBgDate(v) == null
                  ? 'Въведи дата като 01.05.2008.'
                  : null,
            ),
            if (under14)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: ZineBox(
                  color: p.accent,
                  child: const Text(
                    'Профилът ти ще е скрит, докато родител не даде съгласие.',
                    style: TextStyle(color: Color(0xFF070707)),
                  ),
                ),
              ),
          ] else ...[
            ZineField(
              label: 'Име на организацията',
              controller: _org,
              validator: validateOrgName,
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: DropdownButtonFormField<OrgType>(
                isExpanded: true,
                initialValue: _orgType,
                decoration: const InputDecoration(labelText: 'Вид организация'),
                items: [
                  for (final t in OrgType.values)
                    DropdownMenuItem(value: t, child: Text(t.label)),
                ],
                onChanged: (t) => setState(() => _orgType = t),
                validator: (t) => t == null ? 'Избери вид.' : null,
              ),
            ),
            const Text('Организаторите публикуват, след като ги проверим.'),
            const SizedBox(height: 14),
          ],
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            value: _terms,
            onChanged: (v) => setState(() => _terms = v ?? false),
            title: const Text(
              'Приемам Условията за ползване и Политиката за личните данни',
            ),
          ),
          const SizedBox(height: 6),
          ZineButton(
            label: busy ? 'ЧАКАЙ…' : 'СЪЗДАЙ ПРОФИЛ',
            pink: true,
            onPressed: busy || !_terms ? null : _submit,
          ),
        ],
      ),
    );
  }
}
