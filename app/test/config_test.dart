import 'package:flutter_test/flutter_test.dart';
import 'package:nofuture/core/config.dart';

void main() {
  test('points at the team Supabase project', () {
    expect(kSupabaseUrl, 'https://tjkwpebrakwfkhenpayl.supabase.co');
  });

  test('uses the public publishable key, never a secret one', () {
    expect(kSupabasePublishableKey.startsWith('sb_publishable_'), isTrue);
  });

  test('runs on the live project unless FAKE is defined', () {
    expect(kFake, isFalse);
  });

  test('brand name lives in one constant', () {
    expect(kBrand, 'NO FUTURE?');
  });
}
