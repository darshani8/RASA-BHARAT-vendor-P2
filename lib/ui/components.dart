import 'package:flutter/material.dart';
import '../theme.dart';

/// White hairline card (Zenith content surface).
class ZCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  const ZCard({super.key, required this.child, this.padding = const EdgeInsets.all(18)});
  @override
  Widget build(BuildContext context) => Container(
        padding: padding,
        decoration: BoxDecoration(
          color: Zenith.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Zenith.border),
        ),
        child: child,
      );
}

/// Page header: big title + optional subtitle + trailing actions.
class PageHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget> actions;
  const PageHeader({super.key, required this.title, this.subtitle, this.actions = const []});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Zenith.ink)),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(subtitle!, style: const TextStyle(color: Zenith.muted, fontSize: 13.5)),
                  ],
                ],
              ),
            ),
            ...actions,
          ],
        ),
      );
}

/// KPI tile.
class StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color accent;
  final String? delta;
  const StatTile({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.accent = Zenith.accent,
    this.delta,
  });
  @override
  Widget build(BuildContext context) => ZCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, size: 19, color: accent),
                ),
                const Spacer(),
                if (delta != null)
                  Text(delta!, style: const TextStyle(color: Zenith.muted, fontSize: 12, fontWeight: FontWeight.w700)),
              ],
            ),
            const SizedBox(height: 14),
            Text(value,
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Zenith.ink)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: Zenith.muted, fontSize: 12.5, fontWeight: FontWeight.w600)),
          ],
        ),
      );
}

/// Status / count pill.
Widget pill(String label, {Color? fg, Color? bg}) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg ?? Zenith.accentSoft, borderRadius: BorderRadius.circular(999)),
      child: Text(label,
          style: TextStyle(color: fg ?? Zenith.accentInk, fontSize: 11, fontWeight: FontWeight.w800)),
    );

Widget statusPill(String status) {
  final s = statusStyle(status);
  return pill(s.label, fg: s.fg, bg: s.bg);
}

/// Filled button with an explicit label color (works around CanvasKit's unresolved label color).
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color color;
  final Color fg;
  final bool busy;
  const PrimaryButton(
    this.label, {
    super.key,
    required this.onPressed,
    this.icon,
    this.color = Zenith.ink,
    this.fg = Colors.white,
    this.busy = false,
  });
  @override
  Widget build(BuildContext context) {
    return Material(
      color: onPressed == null ? color.withValues(alpha: 0.45) : color,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: busy ? null : onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (busy)
                SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: fg))
              else if (icon != null) ...[
                Icon(icon, size: 17, color: fg),
                const SizedBox(width: 8),
              ],
              if (!busy)
                Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: 14)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Outlined / ghost button.
class GhostButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color color;
  const GhostButton(this.label, {super.key, required this.onPressed, this.icon, this.color = Zenith.text});
  @override
  Widget build(BuildContext context) => OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: const BorderSide(color: Zenith.border),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[Icon(icon, size: 16, color: color), const SizedBox(width: 7)],
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13.5)),
          ],
        ),
      );
}

Widget loadingBox() => const Center(
    child: Padding(padding: EdgeInsets.all(48), child: CircularProgressIndicator()));

Widget emptyState(String text, {IconData icon = Icons.inbox_outlined}) => Container(
      padding: const EdgeInsets.symmetric(vertical: 56),
      alignment: Alignment.center,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 44, color: Zenith.faint),
        const SizedBox(height: 12),
        Text(text, style: const TextStyle(color: Zenith.muted, fontWeight: FontWeight.w700)),
      ]),
    );

Widget errorView(String message, VoidCallback onRetry) => Container(
      margin: const EdgeInsets.symmetric(vertical: 32),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Zenith.negSoft,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x33C5413A)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.cloud_off, color: Zenith.neg),
        const SizedBox(height: 10),
        Text(message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Zenith.neg, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        GhostButton('Retry', onPressed: onRetry, icon: Icons.refresh, color: Zenith.neg),
      ]),
    );

String rupees(dynamic paise) {
  final n = int.tryParse('${paise ?? 0}') ?? 0;
  return '₹${(n / 100).toStringAsFixed(2)}';
}
