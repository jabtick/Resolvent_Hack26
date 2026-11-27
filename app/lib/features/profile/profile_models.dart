import '../auth/auth_repo.dart';

class StudentInfo {
  final DateTime birthDate;
  final String? city, school, bio;
  final int? grade;
  final bool isPublic;
  final bool consentGranted;

  const StudentInfo({
    required this.birthDate,
    this.city,
    this.school,
    this.bio,
    this.grade,
    this.isPublic = false,
    this.consentGranted = false,
  });

  StudentInfo copyWith({
    String? city,
    String? school,
    String? bio,
    int? grade,
    bool? isPublic,
  }) => StudentInfo(
    birthDate: birthDate,
    city: city ?? this.city,
    school: school ?? this.school,
    bio: bio ?? this.bio,
    grade: grade ?? this.grade,
    isPublic: isPublic ?? this.isPublic,
    consentGranted: consentGranted,
  );
}

class OrganizerInfo {
  final String orgName;
  final OrgType orgType;
  final String? website;
  final String verificationStatus; // pending | verified | rejected

  const OrganizerInfo({
    required this.orgName,
    required this.orgType,
    this.website,
    this.verificationStatus = 'pending',
  });

  OrganizerInfo copyWith({String? orgName, String? website}) => OrganizerInfo(
    orgName: orgName ?? this.orgName,
    orgType: orgType,
    website: website ?? this.website,
    verificationStatus: verificationStatus,
  );
}

/// The signed-in person's own profile, with everything they may see.
class MyProfile {
  final AccountType type;
  final String username;
  final String displayName;
  final String? avatarUrl;
  final StudentInfo? student;
  final OrganizerInfo? organizer;

  const MyProfile({
    required this.type,
    required this.username,
    required this.displayName,
    this.avatarUrl,
    this.student,
    this.organizer,
  });
}

/// What anyone may see at `/u/<username>` (the `public_profiles` view).
class PublicProfile {
  final String username, displayName;
  final String? avatarUrl, bio, school;
  final List<String> interests;

  const PublicProfile({
    required this.username,
    required this.displayName,
    this.avatarUrl,
    this.bio,
    this.school,
    this.interests = const [],
  });
}

/// "Петя Иванова" → "ПИ"; empty → "?".
String initialsOf(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
  if (parts.isEmpty) return '?';
  return parts
      .take(2)
      .map((w) => String.fromCharCode(w.runes.first).toUpperCase())
      .join();
}

/// The shareable link: `https://<site>/u/<username>`.
String publicProfileUrl(String username, {Uri? base}) {
  final b = base ?? Uri.base;
  final origin = b.hasScheme && b.scheme.startsWith('http') ? b.origin : '';
  return '$origin/u/$username';
}
