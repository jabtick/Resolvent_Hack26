import 'package:flutter/widgets.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/auth/auth_repo.dart';
import '../features/auth/fake_auth_repo.dart';
import '../features/auth/supabase_auth_repo.dart';
import '../features/profile/fake_profile_repo.dart';
import '../features/profile/profile_repo.dart';
import '../features/profile/supabase_profile_repo.dart';
import 'theme/theme_controller.dart';

/// What the join page learned before the account exists: which side the
/// person picked. Read by create-profile.
class SignupDraft {
  AccountType? side;
}

/// Every repo the pages use, fake or live. Add your feature's repo here.
class Services {
  final AuthRepo auth;
  final ProfileRepo profiles;
  final ThemeController theme;
  final SignupDraft signupDraft = SignupDraft();

  Services({required this.auth, required this.profiles, required this.theme});

  /// Sample data only (`--dart-define=FAKE=true`, tests).
  factory Services.fake() {
    final auth = FakeAuthRepo();
    return Services(
      auth: auth,
      profiles: FakeProfileRepo(auth),
      theme: ThemeController(),
    );
  }

  /// The live Supabase project.
  factory Services.live(SupabaseClient c) => Services(
    auth: SupabaseAuthRepo(c),
    profiles: SupabaseProfileRepo(c),
    theme: ThemeController(),
  );
}

/// Gives pages their [Services]: `ServicesScope.of(context).auth`.
class ServicesScope extends InheritedWidget {
  final Services services;

  const ServicesScope({
    super.key,
    required this.services,
    required super.child,
  });

  static Services of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ServicesScope>()!.services;

  @override
  bool updateShouldNotify(ServicesScope old) => old.services != services;
}
