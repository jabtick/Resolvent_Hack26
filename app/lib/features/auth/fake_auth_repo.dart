import '../../core/app_error.dart';
import 'auth_repo.dart';

class _FakeUser {
  final String id;
  String password;
  String? username;
  NewProfile? profile;
  _FakeUser(this.id, this.password);
}

/// In-memory accounts for demos (`--dart-define=FAKE=true`) and tests.
/// Every emailed code is [code].
class FakeAuthRepo extends AuthRepo {
  final String code;
  final Set<String> _taken;
  final Map<String, _FakeUser> _users = {};
  var _nextId = 1;

  AuthStatus _status = AuthStatus.signedOut;
  String? _email;

  FakeAuthRepo({
    this.code = '123456',
    Set<String> takenUsernames = const {'ivan'},
  }) : _taken = takenUsernames.map((u) => u.toLowerCase()).toSet();

  /// What the fake sign-up collected for [userId] (fake-only, read by
  /// FakeProfileRepo).
  NewProfile? profileOf(String userId) {
    for (final u in _users.values) {
      if (u.id == userId) return u.profile;
    }
    return null;
  }

  @override
  AuthStatus get status => _status;
  @override
  String? get pendingEmail => _email;
  @override
  String? get userId =>
      _status == AuthStatus.signedOut || _status == AuthStatus.awaitingCode
      ? null
      : _users[_email]?.id;

  void _set(AuthStatus s) {
    if (s == _status) return;
    _status = s;
    notifyListeners();
  }

  void _checkCode(String c) {
    if (c.trim() != code) throw const AppError('Кодът е грешен или изтекъл.');
  }

  @override
  Future<void> signUp(String email, String password) async {
    final e = email.trim().toLowerCase();
    if (_users.containsKey(e)) {
      throw const AppError('Вече има акаунт с този имейл. Влез.');
    }
    _users[e] = _FakeUser('fake-${_nextId++}', password);
    _email = e;
    _set(AuthStatus.awaitingCode);
  }

  @override
  Future<void> resendCode() async {}

  @override
  Future<void> confirmCode(String c) async {
    _checkCode(c);
    _set(AuthStatus.needsProfile);
  }

  @override
  Future<void> createProfile(NewProfile p) async {
    p.check();
    final u = p.username.toLowerCase();
    if (_taken.contains(u)) {
      throw const AppError('Това потребителско име е заето');
    }
    _taken.add(u);
    _users[_email]!
      ..username = u
      ..profile = p;
    _set(AuthStatus.signedIn);
  }

  @override
  Future<void> signIn(String email, String password) async {
    final e = email.trim().toLowerCase();
    final user = _users[e];
    if (user == null || user.password != password) {
      throw const AppError('Грешен имейл или парола.');
    }
    _email = e;
    _set(user.username == null ? AuthStatus.needsProfile : AuthStatus.signedIn);
  }

  @override
  Future<void> sendPasswordReset(String email) async {}

  @override
  Future<void> resetPassword(String email, String c, String newPassword) async {
    _checkCode(c);
    final e = email.trim().toLowerCase();
    final user = _users[e];
    if (user == null) throw const AppError('Кодът е грешен или изтекъл.');
    user.password = newPassword;
    _email = e;
    _set(user.username == null ? AuthStatus.needsProfile : AuthStatus.signedIn);
  }

  @override
  Future<void> signOut() async => _set(AuthStatus.signedOut);

  @override
  Future<void> deleteAccount() async {
    final user = _users.remove(_email);
    if (user?.username != null) _taken.remove(user!.username);
    _email = null;
    _set(AuthStatus.signedOut);
  }
}
