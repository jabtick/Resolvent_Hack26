import 'package:supabase_flutter/supabase_flutter.dart';

import '../auth/auth_error_mapper.dart';
import '../auth/auth_repo.dart';
import 'profile_models.dart';
import 'profile_repo.dart';

/// Reads and writes only what the profiles_feed migration grants:
/// profiles (display_name), student_details (city, school, grade, bio,
/// is_public), organizer_details (org_name, website), and the
/// public_profiles view.
class SupabaseProfileRepo extends ProfileRepo {
  final SupabaseClient _db;
  SupabaseProfileRepo(this._db);

  String get _uid => _db.auth.currentUser!.id;

  Future<T> _guard<T>(Future<T> Function() fn) async {
    try {
      return await fn();
    } catch (e) {
      throw mapAuthError(e);
    }
  }

  @override
  Future<MyProfile> loadMine() => _guard(() async {
    final r = await _db
        .from('profiles')
        .select('*, student_details(*), organizer_details(*)')
        .eq('id', _uid)
        .single();
    final s = r['student_details'] as Map<String, dynamic>?;
    final o = r['organizer_details'] as Map<String, dynamic>?;
    return MyProfile(
      type: AccountType.fromDb(r['account_type'] as String),
      username: r['username'] as String,
      displayName: r['display_name'] as String,
      avatarUrl: r['avatar_url'] as String?,
      student: s == null
          ? null
          : StudentInfo(
              birthDate: DateTime.parse(s['birth_date'] as String),
              city: s['city'] as String?,
              school: s['school'] as String?,
              grade: s['grade'] as int?,
              bio: s['bio'] as String?,
              isPublic: s['is_public'] as bool? ?? false,
              consentGranted: s['consent_granted_at'] != null,
            ),
      organizer: o == null
          ? null
          : OrganizerInfo(
              orgName: o['org_name'] as String,
              orgType: OrgType.fromDb(o['org_type'] as String),
              website: o['website'] as String?,
              verificationStatus: o['verification_status'] as String,
            ),
    );
  });

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
  }) => _guard(() async {
    if (displayName != null) {
      await _db
          .from('profiles')
          .update({'display_name': displayName})
          .eq('id', _uid);
    }
    final student = <String, dynamic>{
      'city': ?city,
      'school': ?school,
      'grade': ?grade,
      'bio': ?bio,
      'is_public': ?isPublic,
    };
    if (student.isNotEmpty) {
      await _db.from('student_details').update(student).eq('profile_id', _uid);
    }
    final org = <String, dynamic>{'org_name': ?orgName, 'website': ?website};
    if (org.isNotEmpty) {
      await _db.from('organizer_details').update(org).eq('profile_id', _uid);
    }
    notifyListeners();
  });

  @override
  Future<PublicProfile?> loadPublic(String username) => _guard(() async {
    // ilike for case-insensitive match; escape LIKE wildcards (_ is
    // allowed in usernames).
    final pattern = username.replaceAllMapped(
      RegExp(r'[\\%_]'),
      (m) => '\\${m[0]}',
    );
    final r = await _db
        .from('public_profiles')
        .select()
        .ilike('username', pattern)
        .maybeSingle();
    if (r == null) return null;
    return PublicProfile(
      username: r['username'] as String,
      displayName: r['display_name'] as String,
      avatarUrl: r['avatar_url'] as String?,
      bio: r['bio'] as String?,
      school: r['school'] as String?,
      interests: (r['interests'] as List? ?? const []).cast<String>(),
    );
  });
}
