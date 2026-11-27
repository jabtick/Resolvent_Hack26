import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/app.dart';
import 'core/config.dart';
import 'core/services.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  usePathUrlStrategy(); // /u/ivan, not /#/u/ivan

  final Services services;
  if (kFake) {
    services = Services.fake();
  } else {
    await Supabase.initialize(
      url: kSupabaseUrl,
      publishableKey: kSupabasePublishableKey,
    );
    services = Services.live(Supabase.instance.client);
    await services.auth.restore();
  }
  await services.theme.load();

  runApp(NoFutureApp(services: services));
}
