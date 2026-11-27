import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/app_error.dart';
import '../../../core/services.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/zine.dart';
import '../../auth/auth_repo.dart';
import '../../auth/validators.dart';
import '../profile_models.dart';
import '../profile_repo.dart';
import 'profile_widgets.dart';

class MyProfilePage extends StatefulWidget {
  const MyProfilePage({super.key});

  @override
  State<MyProfilePage> createState() => _MyProfilePageState();
}

class _MyProfilePageState extends State<MyProfilePage> {
  late ProfileRepo _repo;
  Future<MyProfile>? _me;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final repo = ServicesScope.of(context).profiles;
    if (_me == null) {
      _repo = repo..addListener(_reload);
      _me = _repo.loadMine();
    }
  }

  @override
  void dispose() {
    _repo.removeListener(_reload);
    super.dispose();
  }

  void _reload() => setState(() {
    _me = _repo.loadMine();
  });

  void _say(String msg) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(msg)));

  Future<void> _try(Future<void> Function() fn) async {
    try {
      await fn();
    } on AppError catch (e) {
      if (mounted) _say(e.message);
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<MyProfile>(
    future: _me,
    builder: (context, snap) {
      if (snap.hasError) {
        return ZineBox(
          child: Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            children: [
              const Text('Профилът не се зареди.'),
              ZineButton(label: 'ПАК', onPressed: _reload),
            ],
          ),
        );
      }
      if (!snap.hasData) {
        return const Center(child: CircularProgressIndicator());
      }
      return _body(snap.data!);
    },
  );

  Widget _body(MyProfile me) {
    final p = context.zine;
    final s = me.student;
    final o = me.organizer;
    final under14NoConsent =
        s != null &&
        isUnder14(s.birthDate, DateTime.now()) &&
        !s.consentGranted;

    final subtitle = [
      '@${me.username}',
      me.type == AccountType.student ? 'ученик' : 'организатор',
      if (s?.city != null && s!.city!.isNotEmpty) s.city!,
    ].join(' · ');

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 768),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ProfileHeader(
              displayName: me.displayName,
              subtitle: subtitle,
              action: ZineButton(
                label: 'РЕДАКТИРАЙ',
                icon: LucideIcons.pencil,
                onPressed: () => _edit(me),
              ),
              below: [
                const SizedBox(height: 20),
                Wrap(
                  spacing: 16,
                  runSpacing: 12,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    if (s != null)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Switch(
                            value: s.isPublic,
                            onChanged: (v) =>
                                _try(() => _repo.updateMine(isPublic: v)),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            s.isPublic
                                ? 'Профилът ти е публичен'
                                : 'Профилът ти е скрит',
                          ),
                        ],
                      ),
                    ZineButton(
                      label: 'КОПИРАЙ ЛИНК',
                      icon: LucideIcons.share2,
                      onPressed: () async {
                        await Clipboard.setData(
                          ClipboardData(text: publicProfileUrl(me.username)),
                        );
                        if (mounted) _say('Линкът е копиран.');
                      },
                    ),
                  ],
                ),
                if (under14NoConsent) ...[
                  const SizedBox(height: 16),
                  ZineBox(
                    color: p.accent,
                    child: const Text(
                      'Под 14 г.: профилът остава скрит, докато родител не даде съгласие.',
                      style: TextStyle(color: Color(0xFF070707)),
                    ),
                  ),
                ],
              ],
            ),
            if (s != null) ...[
              ProfileSection(title: 'ЗА МЕН', text: s.bio),
              ProfileSection(
                title: 'УЧИЛИЩЕ',
                text: [
                  if (s.school != null) s.school!,
                  if (s.grade != null) '${s.grade} клас',
                ].join(' · '),
              ),
            ],
            if (o != null) ...[
              ProfileSection(
                title: 'ОРГАНИЗАЦИЯ',
                text: [
                  o.orgName,
                  o.orgType.label,
                  if (o.website != null) o.website!,
                ].join(' · '),
              ),
              ProfileSection(
                title: 'ПРОВЕРКА',
                text: switch (o.verificationStatus) {
                  'verified' => 'Проверена организация — можеш да публикуваш.',
                  'rejected' => 'Проверката е отказана. Пиши ни.',
                  _ => 'Чака проверка. Дотогава обявите ти са чернови.',
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _edit(MyProfile me) async {
    final edits = await showDialog<_Edits>(
      context: context,
      builder: (_) => _EditDialog(me: me),
    );
    if (edits == null) return;
    await _try(
      () => _repo.updateMine(
        displayName: edits.displayName,
        city: edits.city,
        school: edits.school,
        grade: edits.grade,
        bio: edits.bio,
        orgName: edits.orgName,
        website: edits.website,
      ),
    );
  }
}

/// Only the fields that changed; null = leave as is.
typedef _Edits = ({
  String? displayName,
  String? city,
  String? school,
  int? grade,
  String? bio,
  String? orgName,
  String? website,
});

/// Owns its text controllers, so they live exactly as long as the dialog.
class _EditDialog extends StatefulWidget {
  final MyProfile me;
  const _EditDialog({required this.me});

  @override
  State<_EditDialog> createState() => _EditDialogState();
}

class _EditDialogState extends State<_EditDialog> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.me.displayName);
  late final _city = TextEditingController(text: widget.me.student?.city ?? '');
  late final _school = TextEditingController(
    text: widget.me.student?.school ?? '',
  );
  late final _grade = TextEditingController(
    text: widget.me.student?.grade?.toString() ?? '',
  );
  late final _bio = TextEditingController(text: widget.me.student?.bio ?? '');
  late final _org = TextEditingController(
    text: widget.me.organizer?.orgName ?? '',
  );
  late final _web = TextEditingController(
    text: widget.me.organizer?.website ?? '',
  );

  @override
  void dispose() {
    for (final c in [_name, _city, _school, _grade, _bio, _org, _web]) {
      c.dispose();
    }
    super.dispose();
  }

  Widget _field(
    String label,
    TextEditingController c, {
    int lines = 1,
    String? Function(String?)? validator,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: TextFormField(
      controller: c,
      maxLines: lines,
      decoration: InputDecoration(labelText: label),
      validator: validator,
    ),
  );

  void _save() {
    if (!_form.currentState!.validate()) return;
    final s = widget.me.student;
    final o = widget.me.organizer;
    String? changed(TextEditingController c, String? old) =>
        c.text.trim() == (old ?? '') ? null : c.text.trim();
    final g = _grade.text.trim();
    Navigator.pop<_Edits>(context, (
      displayName: changed(_name, widget.me.displayName),
      city: s == null ? null : changed(_city, s.city),
      school: s == null ? null : changed(_school, s.school),
      grade: s == null || g.isEmpty ? null : int.tryParse(g),
      bio: s == null ? null : changed(_bio, s.bio),
      orgName: o == null ? null : changed(_org, o.orgName),
      website: o == null ? null : changed(_web, o.website),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.me.student;
    final o = widget.me.organizer;
    return AlertDialog(
      title: Text('НАПРАВИ ГО СВОЙ', style: ZineText.heavy(32)),
      content: SizedBox(
        width: 520,
        child: Form(
          key: _form,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _field(
                  'Име',
                  _name,
                  validator: (v) => validateDisplayName(v ?? ''),
                ),
                if (s != null) ...[
                  _field('Град', _city),
                  _field('Училище', _school),
                  _field(
                    'Клас (1–12)',
                    _grade,
                    validator: (v) {
                      final t = (v ?? '').trim();
                      if (t.isEmpty) return null;
                      final n = int.tryParse(t);
                      return n == null || n < 1 || n > 12
                          ? 'От 1 до 12.'
                          : null;
                    },
                  ),
                  _field(
                    'За мен',
                    _bio,
                    lines: 4,
                    validator: (v) =>
                        (v ?? '').length > 1000 ? 'До 1000 знака.' : null,
                  ),
                ],
                if (o != null) ...[
                  _field(
                    'Име на организацията',
                    _org,
                    validator: (v) => validateOrgName(v ?? ''),
                  ),
                  if (o.verificationStatus == 'verified')
                    const Padding(
                      padding: EdgeInsets.only(bottom: 12),
                      child: Text(
                        'Смяна на името пуска организацията на нова проверка.',
                      ),
                    ),
                  _field('Уебсайт', _web),
                ],
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('ОТКАЗ'),
        ),
        FilledButton(onPressed: _save, child: const Text('ЗАПАЗИ')),
      ],
    );
  }
}
