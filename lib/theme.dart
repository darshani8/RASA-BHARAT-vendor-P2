import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Zenith palette — mirrors the HTML vendor suite so the Flutter app shares the brand.
class Zenith {
  static const ink = Color(0xFF0E1116);
  static const ink2 = Color(0xFF11151B);
  static const accent = Color(0xFF128A63);
  static const accentInk = Color(0xFF0C6347);
  static const accentSoft = Color(0x1A128A63);
  static const canvas = Color(0xFFF4F5F7);
  static const card = Color(0xFFFFFFFF);
  static const border = Color(0xFFE9EBEE);
  static const text = Color(0xFF3D434C);
  static const muted = Color(0xFF7B828C);
  static const faint = Color(0xFFA6ACB4);
  static const amber = Color(0xFFB7791F);
  static const amberSoft = Color(0x1FB7791F);
  static const neg = Color(0xFFC5413A);
  static const negSoft = Color(0x1AC5413A);

  static ThemeData theme() {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: accent,
        primary: accent,
        surface: card,
      ),
      scaffoldBackgroundColor: canvas,
    );
    return base.copyWith(
      textTheme: GoogleFonts.manropeTextTheme(base.textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: card,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
      ),
      // Flutter 3.27+ types the `cardTheme` slot as CardThemeData (not CardTheme).
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: ink,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
        ),
      ),
    );
  }
}

/// Status → (label, fg, bg) for order pills.
({String label, Color fg, Color bg}) statusStyle(String status) {
  switch (status) {
    case 'created':
      return (label: 'New', fg: Zenith.muted, bg: const Color(0xFFF1F2F4));
    case 'paid':
      return (label: 'Paid', fg: Zenith.amber, bg: Zenith.amberSoft);
    case 'ready':
      return (label: 'Ready', fg: Zenith.accentInk, bg: Zenith.accentSoft);
    case 'collected':
      return (label: 'Collected', fg: Zenith.accentInk, bg: Zenith.accentSoft);
    case 'completed':
      return (label: 'Completed', fg: Zenith.accentInk, bg: Zenith.accentSoft);
    case 'cancelled':
      return (label: 'Cancelled', fg: Zenith.neg, bg: Zenith.negSoft);
    default:
      return (label: status, fg: Zenith.muted, bg: const Color(0xFFF1F2F4));
  }
}
