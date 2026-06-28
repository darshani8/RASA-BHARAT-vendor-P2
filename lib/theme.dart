import 'package:flutter/material.dart';

/// Zenith palette — "Retail Cloud": a dark ink sidebar, emerald brand, violet active-nav accent,
/// and a light hairline-card content area.
class Zenith {
  // Brand
  static const accent = Color(0xFF128A63); // emerald
  static const accentInk = Color(0xFF0C6347);
  static const accentSoft = Color(0x1A128A63);
  static const accentBright = Color(0xFF1BA576);
  static const violet = Color(0xFF8B7CF6); // active-nav accent (matches the screenshot)
  static const violetSoft = Color(0x1F8B7CF6);

  // Sidebar (dark)
  static const sidebar = Color(0xFF0B0E13);
  static const sidebarItem = Color(0xFF161B22); // active item pill
  static const sidebarBorder = Color(0xFF1E242D);
  static const sidebarText = Color(0xFF9BA3AE);
  static const sidebarMuted = Color(0xFF6B7280);
  static const badge = Color(0xFF222932);

  // Content (light)
  static const ink = Color(0xFF0E1116);
  static const canvas = Color(0xFFF4F5F7);
  static const card = Color(0xFFFFFFFF);
  static const border = Color(0xFFE9EBEE);
  static const text = Color(0xFF3D434C);
  static const muted = Color(0xFF7B828C);
  static const faint = Color(0xFFA6ACB4);

  // Status
  static const amber = Color(0xFFB7791F);
  static const amberSoft = Color(0x1FB7791F);
  static const neg = Color(0xFFC5413A);
  static const negSoft = Color(0x1AC5413A);

  static ThemeData theme() {
    final base = ThemeData(
      useMaterial3: true,
      // Manrope is bundled (assets/fonts) — offline-capable, no runtime fetch from gstatic.
      fontFamily: 'Manrope',
      colorScheme: ColorScheme.fromSeed(seedColor: accent, primary: accent, surface: card),
      scaffoldBackgroundColor: canvas,
    );
    return base.copyWith(
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
      ),
      // Explicit white foreground so filled-button labels are always visible (a bare textStyle in
      // the theme leaves the label color unresolved on CanvasKit web → invisible text).
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: ink,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
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
