import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/router.dart';
import 'package:nofuture/features/auth/auth_repo.dart';

void main() {
  group('signed out', () {
    test(
      'private page → login',
      () => expect(authRedirect(AuthStatus.signedOut, '/profile'), '/login'),
    );
    test(
      'settings → login',
      () => expect(authRedirect(AuthStatus.signedOut, '/settings'), '/login'),
    );
    test(
      'public profile stays',
      () => expect(authRedirect(AuthStatus.signedOut, '/u/ivan'), isNull),
    );
    test(
      'feed stays',
      () => expect(authRedirect(AuthStatus.signedOut, '/'), isNull),
    );
    test(
      'calendar stays',
      () => expect(authRedirect(AuthStatus.signedOut, '/calendar'), isNull),
    );
    test(
      'join stays',
      () => expect(authRedirect(AuthStatus.signedOut, '/join'), isNull),
    );
    test(
      'code page without a pending sign-up → join',
      () => expect(authRedirect(AuthStatus.signedOut, '/code'), '/join'),
    );
    test(
      'create-profile while signed out → login',
      () => expect(
        authRedirect(AuthStatus.signedOut, '/create-profile'),
        '/login',
      ),
    );
  });

  group('awaiting code', () {
    test(
      'anywhere → code',
      () => expect(authRedirect(AuthStatus.awaitingCode, '/'), '/code'),
    );
    test(
      'code stays',
      () => expect(authRedirect(AuthStatus.awaitingCode, '/code'), isNull),
    );
    test(
      'can go back to join',
      () => expect(authRedirect(AuthStatus.awaitingCode, '/join'), isNull),
    );
  });

  group('needs profile', () {
    test(
      'settings → create-profile',
      () => expect(
        authRedirect(AuthStatus.needsProfile, '/settings'),
        '/create-profile',
      ),
    );
    test(
      'public profile → create-profile',
      () => expect(
        authRedirect(AuthStatus.needsProfile, '/u/ivan'),
        '/create-profile',
      ),
    );
    test(
      'create-profile stays',
      () => expect(
        authRedirect(AuthStatus.needsProfile, '/create-profile'),
        isNull,
      ),
    );
  });

  group('signed in', () {
    test(
      'login → profile',
      () => expect(authRedirect(AuthStatus.signedIn, '/login'), '/profile'),
    );
    test(
      'join → profile',
      () => expect(authRedirect(AuthStatus.signedIn, '/join'), '/profile'),
    );
    test(
      'code → profile',
      () => expect(authRedirect(AuthStatus.signedIn, '/code'), '/profile'),
    );
    test(
      'create-profile → profile',
      () => expect(
        authRedirect(AuthStatus.signedIn, '/create-profile'),
        '/profile',
      ),
    );
    test(
      'settings stays',
      () => expect(authRedirect(AuthStatus.signedIn, '/settings'), isNull),
    );
    test(
      'forgot → profile',
      () => expect(authRedirect(AuthStatus.signedIn, '/forgot'), '/profile'),
    );
  });
}
