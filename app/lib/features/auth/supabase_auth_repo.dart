import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/app_error.dart';
import 'auth_error_mapper.dart';
import 'auth_repo.dart';

/// Email + password accounts on the live project, confirmed with the 6-digit
/// code from the email (templates in supabase/templates). The profile rows are
/// written by the app itself; the column grants in the profiles_feed
/// migration decide what it may write.
class SupabaseAuthRepo extends AuthRepo {
  final SupabaseClient _db;
  StreamSubscription<AuthState>? _sub;

  AuthStatus _status = AuthStatus.signedOut;
  String? _email;

  SupabaseAuthRepo(this._db) {
    // Another tab signed out, or the session expired.
    _sub = _db.auth.onAuthStateChange.listen((s) {
      if (s.event == AuthChangeEvent.signedOut) _set(AuthStatus.signedOut);
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  AuthStatus get status => _status;
  @override
  String? get pendingEmail => _email;
  @override
  String? get userId => _db.auth.currentUser?.id;

  void _set(AuthStatus s) {
    if (s == _status) return;
    _status = s;
    notifyListeners();
  }

  Future<T> _guard<T>(Future<T> Function() fn) async {
    try {
      return await fn();
    } catch (e) {
      throw mapAuthError(e);
    }
  }

  /// Picks up a session kept from the last visit. Call once at start-up.
  /// Never throws: if the check fails (expired session, network), the app
  /// starts signed out instead of showing a blank page.
  @override
  Future<void> restore() async {
    if (_db.auth.currentSession == null) return;
    try {
      _email = _db.auth.currentUser?.email;
      await _afterSignIn();
    } catch (_) {
      _set(AuthStatus.signedOut);
    }
  }

  /// The profile row and whether its details row exists too. A profile
  /// without details (the second insert failed) is not finished.
  Future<({AccountType? type, bool complete})> _profileState() async {
    final row = await _db
        .from('profiles')
        .select(
          'id, account_type, student_details(profile_id), organizer_details(profile_id)',
        )
        .eq('id', userId!)
        .maybeSingle();
    if (row == null) return (type: null, complete: false);
    final type = AccountType.fromDb(row['account_type'] as String);
    final details = type == AccountType.student
        ? row['student_details']
        : row['organizer_details'];
    return (type: type, complete: details != null);
  }

  Future<void> _afterSignIn() async {
    final s = await _profileState();
    _set(s.complete ? AuthStatus.signedIn : AuthStatus.needsProfile);
  }

  @override
  Future<void> signUp(String email, String password) => _guard(() async {
    final e = email.trim().toLowerCase();
    final res = await _db.auth.signUp(email: e, password: password);
    // With email confirmation on, an existing address comes back as a
    // user with no identities instead of an error.
    if (res.user != null && (res.user!.identities ?? const []).isEmpty) {
      throw const AppError('Вече има акаунт с този имейл. Влез.');
    }
    _email = e;
    _set(AuthStatus.awaitingCode);
  });

  @override
  Future<void> resendCode() => _guard(() async {
    await _db.auth.resend(type: OtpType.signup, email: _email!);
  });

  @override
  Future<void> confirmCode(String code) => _guard(() async {
    await _db.auth.verifyOTP(
      type: OtpType.signup,
      email: _email!,
      token: code.trim(),
    );
    await _afterSignIn();
  });

  @override
  Future<void> createProfile(NewProfile p) => _guard(() async {
    p.check();
    final id = userId!;
    final existing = await _profileState();
    if (existing.type == null) {
      await _db.from('profiles').insert({
        'id': id,
        'account_type': p.type.db,
        'username': p.username.trim(),
        'display_name': p.displayName.trim(),
        'terms_accepted_at': DateTime.now().toUtc().toIso8601String(),
      });
    } else {
      // A retry after a failed details insert: the type is fixed (only the
      // server may change it), the names may have been corrected.
      if (existing.type != p.type) {
        throw AppError(
          'Акаунтът вече е създаден като ${existing.type!.label}.',
        );
      }
      await _db
          .from('profiles')
          .update({
            'username': p.username.trim(),
            'display_name': p.displayName.trim(),
          })
          .eq('id', id);
    }
    switch (p.type) {
      case AccountType.student:
        final b = p.birthDate!;
        await _db.from('student_details').upsert({
          'profile_id': id,
          'birth_date':
              '${b.year.toString().padLeft(4, '0')}-${b.month.toString().padLeft(2, '0')}-${b.day.toString().padLeft(2, '0')}',
        }, ignoreDuplicates: true);
      case AccountType.organizer:
        await _db.from('organizer_details').upsert({
          'profile_id': id,
          'org_name': p.orgName!.trim(),
          'org_type': p.orgType!.db,
        }, ignoreDuplicates: true);
    }
    _set(AuthStatus.signedIn);
  });

  @override
  Future<void> signIn(String email, String password) => _guard(() async {
    final e = email.trim().toLowerCase();
    try {
      await _db.auth.signInWithPassword(email: e, password: password);
    } on AuthException catch (err) {
      if (err.code != 'email_not_confirmed') rethrow;
      // Signed up but never entered the code: send a fresh one and ask for it.
      _email = e;
      try {
        await _db.auth.resend(type: OtpType.signup, email: e);
      } catch (_) {} // too soon for a new one: the last code still works
      _set(AuthStatus.awaitingCode);
      return;
    }
    _email = e;
    await _afterSignIn();
  });

  @override
  Future<void> sendPasswordReset(String email) => _guard(() async {
    await _db.auth.resetPasswordForEmail(email.trim().toLowerCase());
  });

  @override
  Future<void> resetPassword(String email, String code, String newPassword) =>
      _guard(() async {
        final e = email.trim().toLowerCase();
        await _db.auth.verifyOTP(
          type: OtpType.recovery,
          email: e,
          token: code.trim(),
        );
        await _db.auth.updateUser(UserAttributes(password: newPassword));
        _email = e;
        await _afterSignIn();
      });

  @override
  Future<void> signOut() => _guard(() async {
    await _db.auth.signOut();
    _set(AuthStatus.signedOut);
  });

  @override
  Future<void> deleteAccount() => _guard(() async {
    await _db.functions.invoke('delete-account', body: {'confirm': 'DELETE'});
    // The user is gone server-side; dropping the local session can fail.
    try {
      await _db.auth.signOut(scope: SignOutScope.local);
    } catch (_) {}
    _email = null;
    _set(AuthStatus.signedOut);
  });
}
