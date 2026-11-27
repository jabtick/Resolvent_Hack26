import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:nofuture/core/app_error.dart';
import 'package:nofuture/features/auth/auth_repo.dart';
import 'package:nofuture/features/auth/supabase_auth_repo.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const _uid = '11111111-1111-1111-1111-111111111111';

String _b64(Map<String, dynamic> m) =>
    base64Url.encode(utf8.encode(jsonEncode(m))).replaceAll('=', '');

/// A syntactically valid (unsigned) access token.
final _jwt =
    '${_b64({'alg': 'HS256', 'typ': 'JWT'})}.${_b64({'sub': _uid, 'role': 'authenticated', 'exp': 4102444800})}.sig';

final _session = {
  'access_token': _jwt,
  'token_type': 'bearer',
  'expires_in': 3600,
  'expires_at': 4102444800,
  'refresh_token': 'refresh',
  'user': {
    'id': _uid,
    'aud': 'authenticated',
    'email': 'petya@example.com',
    'app_metadata': <String, dynamic>{},
    'user_metadata': <String, dynamic>{},
    'created_at': '2026-11-27T00:00:00Z',
  },
};

/// Fake Supabase server. [profileRow] is what `profiles` returns for the user
/// (null = no row); [profileStatus] != 200 makes that select fail.
class FakeServer {
  Map<String, dynamic>? profileRow;
  int profileStatus = 200;
  bool emailConfirmed = true;
  final requests = <http.Request>[];

  Future<http.Response> handle(http.Request r) async {
    requests.add(r);
    // postgrest reads response.request, so every response carries it.
    http.Response json(Object body, [int status = 200]) => http.Response(
      jsonEncode(body),
      status,
      request: r,
      headers: {'content-type': 'application/json'},
    );
    final path = r.url.path;
    if (path == '/auth/v1/token') {
      if (!emailConfirmed) {
        return json({
          'code': 400,
          'error_code': 'email_not_confirmed',
          'msg': 'Email not confirmed',
        }, 400);
      }
      return json(_session);
    }
    if (path == '/auth/v1/resend') return json(<String, dynamic>{});
    if (path == '/rest/v1/profiles' && r.method == 'GET') {
      if (profileStatus != 200) {
        return json({
          'code': 'XX000',
          'message': 'boom',
          'details': null,
          'hint': null,
        }, profileStatus);
      }
      return json(profileRow == null ? [] : [profileRow]);
    }
    if (path.startsWith('/rest/v1/')) {
      return http.Response('', r.method == 'POST' ? 201 : 204, request: r);
    }
    return json({'message': 'not found: $path'}, 404);
  }

  Iterable<http.Request> writesTo(String table) => requests.where(
    (r) => r.url.path == '/rest/v1/$table' && r.method != 'GET',
  );
}

/// In-memory PKCE storage (supabase_flutter gives the real app one).
class _MemoryStorage extends GotrueAsyncStorage {
  final _m = <String, String>{};
  @override
  Future<String?> getItem({required String key}) async => _m[key];
  @override
  Future<void> setItem({required String key, required String value}) async =>
      _m[key] = value;
  @override
  Future<void> removeItem({required String key}) async => _m.remove(key);
}

SupabaseAuthRepo _repo(FakeServer server) => SupabaseAuthRepo(
  SupabaseClient(
    'https://test.supabase.co',
    'sb_publishable_test',
    httpClient: MockClient(server.handle),
    authOptions: AuthClientOptions(
      autoRefreshToken: false,
      pkceAsyncStorage: _MemoryStorage(),
    ),
  ),
);

void main() {
  group('a profile counts only with its details row', () {
    test('profiles row without details → needsProfile', () async {
      final server = FakeServer()
        ..profileRow = {
          'id': _uid,
          'account_type': 'organizer',
          'student_details': null,
          'organizer_details': null,
        };
      final repo = _repo(server);
      await repo.signIn('petya@example.com', 'abcdefghi1');
      expect(repo.status, AuthStatus.needsProfile);
    });

    test('profiles row with details → signedIn', () async {
      final server = FakeServer()
        ..profileRow = {
          'id': _uid,
          'account_type': 'organizer',
          'student_details': null,
          'organizer_details': {'profile_id': _uid},
        };
      final repo = _repo(server);
      await repo.signIn('petya@example.com', 'abcdefghi1');
      expect(repo.status, AuthStatus.signedIn);
    });
  });

  group('finishing a half-created profile', () {
    test(
      'keeps the stored type, updates the names, adds the details',
      () async {
        final server = FakeServer()
          ..profileRow = {
            'id': _uid,
            'account_type': 'organizer',
            'student_details': null,
            'organizer_details': null,
          };
        final repo = _repo(server);
        await repo.signIn('petya@example.com', 'abcdefghi1');
        await repo.createProfile(
          const NewProfile(
            type: AccountType.organizer,
            username: 'org_2',
            displayName: 'Орг',
            orgName: 'Клуб',
            orgType: OrgType.ngo,
          ),
        );
        expect(server.writesTo('profiles').single.method, 'PATCH');
        expect(jsonDecode(server.writesTo('profiles').single.body), {
          'username': 'org_2',
          'display_name': 'Орг',
        });
        expect(server.writesTo('organizer_details'), hasLength(1));
        expect(repo.status, AuthStatus.signedIn);
      },
    );

    test('switching type after the row exists is refused clearly', () async {
      final server = FakeServer()
        ..profileRow = {
          'id': _uid,
          'account_type': 'organizer',
          'student_details': null,
          'organizer_details': null,
        };
      final repo = _repo(server);
      await repo.signIn('petya@example.com', 'abcdefghi1');
      await expectLater(
        repo.createProfile(
          NewProfile(
            type: AccountType.student,
            username: 'org_2',
            displayName: 'Орг',
            birthDate: DateTime(2008, 1, 1),
          ),
        ),
        throwsA(
          isA<AppError>().having(
            (e) => e.message,
            'message',
            'Акаунтът вече е създаден като организатор.',
          ),
        ),
      );
      expect(server.writesTo('student_details'), isEmpty);
    });
  });

  test('login with an unconfirmed email goes to the code step', () async {
    final server = FakeServer()..emailConfirmed = false;
    final repo = _repo(server);
    await repo.signIn('Petya@Example.com', 'abcdefghi1');
    expect(repo.status, AuthStatus.awaitingCode);
    expect(repo.pendingEmail, 'petya@example.com');
    expect(server.requests.any((r) => r.url.path == '/auth/v1/resend'), isTrue);
  });

  test(
    'restore never throws: a failing check falls back to signed out',
    () async {
      final server = FakeServer()..profileRow = null;
      final repo = _repo(server);
      await repo.signIn('petya@example.com', 'abcdefghi1'); // session exists
      server.profileStatus = 400;
      await repo.restore();
      expect(repo.status, AuthStatus.signedOut);
    },
  );
}
