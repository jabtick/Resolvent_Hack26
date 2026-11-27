import '../../core/app_error.dart';
import '../auth/auth_repo.dart';
import '../auth/fake_auth_repo.dart';
import '../auth/validators.dart';
import 'profile_models.dart';
import 'profile_repo.dart';

/// Sample profiles plus whatever the fake sign-up created.
class FakeProfileRepo extends ProfileRepo {
  final FakeAuthRepo auth;
  final Map<String, MyProfile> _byUser = {};

  FakeProfileRepo(this.auth);

  static final _samples = <MyProfile>[
    MyProfile(
      type: AccountType.student,
      username: 'ivan',
      displayName: 'Иван Петров',
      student: StudentInfo(
        birthDate: DateTime(2007, 3, 14),
        city: 'Бургас',
        school: 'ППМГ „Акад. Никола Обрешков“',
        grade: 12,
        bio: 'Програмирам, правя роботи, търся стаж през лятото.',
        isPublic: true,
      ),
    ),
    MyProfile(
      type: AccountType.student,
      username: 'elena',
      displayName: 'Елена Димитрова',
      student: StudentInfo(
        birthDate: DateTime(2006, 6, 2),
        city: 'Варна',
        school: 'Икономически университет – Варна',
        bio: 'Маркетинг, дебати и доброволчество.',
        isPublic: true,
      ),
    ),
    MyProfile(
      type: AccountType.student,
      username: 'maria',
      displayName: 'Мария',
      student: StudentInfo(birthDate: DateTime(2009, 9, 1)),
    ),
  ];

  MyProfile _fromSignUp(NewProfile p) => MyProfile(
    type: p.type,
    username: p.username,
    displayName: p.displayName,
    student: p.type == AccountType.student
        ? StudentInfo(birthDate: p.birthDate!)
        : null,
    organizer: p.type == AccountType.organizer
        ? OrganizerInfo(orgName: p.orgName!, orgType: p.orgType!)
        : null,
  );

  @override
  Future<MyProfile> loadMine() async {
    final id = auth.userId;
    final created = id == null ? null : auth.profileOf(id);
    if (created == null) throw const AppError('Влез, за да видиш профила си.');
    return _byUser.putIfAbsent(id!, () => _fromSignUp(created));
  }

  @override
  Future<void> updateMine({
    String? displayName,
    String? city,
    String? school,
    int? grade,
    String? bio,
    bool? isPublic,
    String? orgName,
    String? website,
  }) async {
    final me = await loadMine();
    _byUser[auth.userId!] = MyProfile(
      type: me.type,
      username: me.username,
      displayName: displayName ?? me.displayName,
      avatarUrl: me.avatarUrl,
      student: me.student?.copyWith(
        city: city,
        school: school,
        grade: grade,
        bio: bio,
        isPublic: isPublic,
      ),
      organizer: me.organizer?.copyWith(orgName: orgName, website: website),
    );
    notifyListeners();
  }

  @override
  Future<PublicProfile?> loadPublic(String username) async {
    final all = [..._samples, ..._byUser.values];
    for (final p in all) {
      if (p.username.toLowerCase() != username.toLowerCase()) continue;
      final s = p.student;
      // Same rule as the public_profiles view.
      if (s == null || !s.isPublic) return null;
      if (isUnder14(s.birthDate, DateTime.now()) && !s.consentGranted) {
        return null;
      }
      return PublicProfile(
        username: p.username,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        bio: s.bio,
        school: s.school,
        interests: p.username == 'ivan'
            ? const ['Роботика', 'Програмиране']
            : const [],
      );
    }
    return null;
  }
}
