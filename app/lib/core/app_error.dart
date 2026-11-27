/// Something the person should be told. [message] is Bulgarian and is shown
/// as is (SnackBar, form error).
class AppError implements Exception {
  final String message;
  const AppError(this.message);

  @override
  String toString() => message;
}
