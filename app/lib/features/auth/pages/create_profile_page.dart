import 'package:flutter/material.dart';

import '../../../core/i18n/language.dart';
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
        title: context.tr('YOUR PROFILE', 'ТВОЯТ ПРОФИЛ'),
        children: [
          Wrap(
            spacing: 8,
            children: [
              for (final t in AccountType.values)
                ChoiceChip(
                  label: Text(
                    t == AccountType.student
                        ? context.tr('Candidate', 'Ученик')
                        : context.tr('Organiser', 'Организатор'),
                  ),
                  selected: _type == t,
                  onSelected: (_) => setState(() => _type = t),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ZineField(
            label: context.tr('Username', 'Потребителско име'),
            controller: _username,
            validator: validateUsername,
          ),
          ZineField(
            label: context.tr('Name', 'Име'),
            controller: _name,
            validator: validateDisplayName,
          ),
          if (student) ...[
            ZineField(
              label: context.tr(
                'Date of birth (DD.MM.YYYY)',
                'Дата на раждане (ДД.ММ.ГГГГ)',
              ),
              controller: _birth,
              keyboard: TextInputType.datetime,
              onChanged: (v) => setState(() => _birthDate = parseBgDate(v)),
              validator: (v) => parseBgDate(v) == null
                  ? context.tr(
                      'Enter a date like 01.05.2008.',
                      'Въведи дата като 01.05.2008.',
                    )
                  : null,
            ),
            if (under14)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: ZineBox(
                  color: p.accent,
                  child: Text(
                    context.tr(
                      'Your profile will stay hidden until a parent gives consent.',
                      'Профилът ти ще е скрит, докато родител не даде съгласие.',
                    ),
                    style: TextStyle(color: Color(0xFF070707)),
                  ),
                ),
              ),
          ] else ...[
            ZineField(
              label: context.tr('Organisation name', 'Име на организацията'),
              controller: _org,
              validator: validateOrgName,
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: DropdownButtonFormField<OrgType>(
                isExpanded: true,
                initialValue: _orgType,
                decoration: InputDecoration(
                  labelText: context.tr('Organisation type', 'Вид организация'),
                ),
                items: [
                  for (final t in OrgType.values)
                    DropdownMenuItem(value: t, child: Text(t.label)),
                ],
                onChanged: (t) => setState(() => _orgType = t),
                validator: (t) => t == null
                    ? context.tr('Pick a type.', 'Избери вид.')
                    : null,
              ),
            ),
            Text(
              context.tr(
                'Organisers can publish once we verify them.',
                'Организаторите публикуват, след като ги проверим.',
              ),
            ),
            const SizedBox(height: 14),
          ],
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            value: _terms,
            onChanged: (v) => setState(() => _terms = v ?? false),
            title: Text(
              context.tr(
                'I accept the Terms of Use and the Privacy Policy',
                'Приемам Условията за ползване и Политиката за личните данни',
              ),
            ),
          ),
          const SizedBox(height: 6),
          ZineButton(
            label: busy
                ? context.tr('PLEASE WAIT…', 'ЧАКАЙ…')
                : context.tr('CREATE PROFILE', 'СЪЗДАЙ ПРОФИЛ'),
            pink: true,
            onPressed: busy || !_terms ? null : _submit,
          ),
        ],
      ),
    );
  }
}
