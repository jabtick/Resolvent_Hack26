import 'package:flutter/foundation.dart';

import 'profile_models.dart';

/// Profiles for the pages. Fake for demos/tests, Supabase for the live project.
abstract class ProfileRepo extends ChangeNotifier {
  /// The signed-in person's profile.
  Future<MyProfile> loadMine();

  /// Changes only the fields given. Student-only and organizer-only fields
  /// are ignored for the other account type.
  Future<void> updateMine({
    String? displayName,
    String? city,
    String? school,
    int? grade,
    String? bio,
    bool? isPublic,
    String? orgName,
    String? website,
  });

  /// Anyone's public profile, or null if it doesn't exist or is hidden.
  /// Case-insensitive.
  Future<PublicProfile?> loadPublic(String username);
}
