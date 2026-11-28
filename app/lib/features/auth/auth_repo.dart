import 'package:flutter/foundation.dart';

import '../../core/app_error.dart';

enum AuthStatus { signedOut, awaitingCode, needsProfile, signedIn }

enum AccountType {
  student('student', 'ученик'),
  organizer('organizer', 'организатор');

  final String db;
  final String label;
  const AccountType(this.db, this.label);

  static AccountType fromDb(String v) =>
      values.firstWhere((t) => t.db == v, orElse: () => student);
}

enum OrgType {
  school('school', 'School'),
  university('university', 'University'),
  ngo('ngo', 'NGO'),
  company('company', 'Company'),
  publicBody('public_body', 'Public institution');

  final String db;
  final String label;
  const OrgType(this.db, this.label);

  static OrgType fromDb(String v) =>
      values.firstWhere((t) => t.db == v, orElse: () => company);
}

/// What the create-profile form collects.
class NewProfile {
  final AccountType type;
  final String username;
  final String displayName;
  final DateTime? birthDate; // students
  final String? orgName; // organizers
  final OrgType? orgType; // organizers

  const NewProfile({
    required this.type,
    required this.username,
    required this.displayName,
    this.birthDate,
    this.orgName,
    this.orgType,
  });

  /// Throws [AppError] when a field the account type needs is missing.
  void check() {
    if (displayName.trim().isEmpty) throw const AppError('Въведи име.');
    switch (type) {
      case AccountType.student:
        if (birthDate == null) {
          throw const AppError('Въведи дата на раждане.');
        }
      case AccountType.organizer:
        if ((orgName ?? '').trim().isEmpty || orgType == null) {
          throw const AppError('Въведи име и вид на организацията.');
        }
    }
  }
}

/// Everything the auth screens need. Pages talk to this interface only:
/// [FakeAuthRepo] for demos and tests, [SupabaseAuthRepo] for the live project.
abstract class AuthRepo extends ChangeNotifier {
  AuthStatus get status;

  /// Picks up a session kept from the last visit. Never throws.
  Future<void> restore() async {}

  String? get pendingEmail;
  String? get userId;

  /// Starts sign-up; a 6-digit code is emailed. → [AuthStatus.awaitingCode]
  Future<void> signUp(String email, String password);
  Future<void> resendCode();

  /// → [AuthStatus.needsProfile]
  Future<void> confirmCode(String code);

  /// → [AuthStatus.signedIn]. A taken username keeps [AuthStatus.needsProfile].
  Future<void> createProfile(NewProfile p);

  /// → [AuthStatus.signedIn], or [AuthStatus.needsProfile] if no profile yet.
  Future<void> signIn(String email, String password);

  Future<void> sendPasswordReset(String email);
  Future<void> resetPassword(String email, String code, String newPassword);

  Future<void> signOut();

  /// Deletes the account and all its data. → [AuthStatus.signedOut]
  Future<void> deleteAccount();
}
