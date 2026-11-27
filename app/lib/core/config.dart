/// The team's Supabase project. Both values are public by design: the
/// publishable key only lets the app do what the database's own rules allow
/// (RLS and column grants in supabase/migrations). The secret key and the
/// database password never go in the app.
const String kSupabaseUrl = 'https://tjkwpebrakwfkhenpayl.supabase.co';
const String kSupabasePublishableKey =
    'sb_publishable_qe6kOIYNHExsXCIEFWVGZg_jcnDcahj';

/// `--dart-define=FAKE=true` runs the whole app on sample data (demos, work
/// without the server) instead of the live project.
const bool kFake = bool.fromEnvironment('FAKE');

/// The product name, in one place so it is easy to rename.
const String kBrand = 'NO FUTURE?';
