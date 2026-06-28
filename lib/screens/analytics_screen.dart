import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/rasap_api.dart';
import '../theme.dart';
import '../ui/components.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});
  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  DateTime _date = DateTime.now().toUtc();
  late Future<Map> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  String get _dateStr => DateFormat('yyyy-MM-dd').format(_date);
  Future<Map> _load() => RasapApi.instance.analytics(_dateStr);
  void _reload() => setState(() => _future = _load());

  Future<void> _pick() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2024),
      lastDate: DateTime.now().toUtc().add(const Duration(days: 1)),
    );
    if (picked != null) {
      _date = picked;
      _reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 32),
      children: [
        PageHeader(
          title: 'Analytics',
          subtitle: 'Performance for $_dateStr (UTC)',
          actions: [GhostButton(_dateStr, icon: Icons.calendar_today_outlined, onPressed: _pick)],
        ),
        FutureBuilder<Map>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) return loadingBox();
            if (snap.hasError) return errorView('${snap.error}', _reload);
            final a = snap.data!;
            final hourly = (a['hourly'] as List?) ?? const [];
            final orders = int.tryParse('${a['orderCount'] ?? 0}') ?? 0;
            int busyHour = -1;
            int busyCount = 0;
            for (final h in hourly) {
              final c = int.tryParse('${(h as Map)['orderCount'] ?? 0}') ?? 0;
              if (c > busyCount) {
                busyCount = c;
                busyHour = int.tryParse('${h['hour'] ?? 0}') ?? 0;
              }
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LayoutBuilder(builder: (context, c) {
                  final cols = c.maxWidth >= 720 ? 3 : 1;
                  const gap = 16.0;
                  final w = (c.maxWidth - gap * (cols - 1)) / cols;
                  final tiles = [
                    StatTile(label: 'Orders', value: '$orders', icon: Icons.receipt_long_outlined, accent: Zenith.accent),
                    StatTile(label: 'Gross revenue', value: rupees(a['grossRevenuePaise']), icon: Icons.payments_outlined, accent: Zenith.accentInk),
                    StatTile(
                        label: 'Busiest hour',
                        value: busyHour < 0 ? '—' : '${busyHour.toString().padLeft(2, '0')}:00',
                        icon: Icons.schedule_outlined,
                        accent: Zenith.violet),
                  ];
                  return Wrap(spacing: gap, runSpacing: gap, children: [for (final t in tiles) SizedBox(width: w, child: t)]);
                }),
                const SizedBox(height: 22),
                const Text('Orders by hour',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Zenith.ink)),
                const SizedBox(height: 12),
                ZCard(child: _HourlyBars(hourly: hourly)),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _HourlyBars extends StatelessWidget {
  final List hourly;
  const _HourlyBars({required this.hourly});

  @override
  Widget build(BuildContext context) {
    final counts = List<int>.filled(24, 0);
    for (final h in hourly) {
      final hr = int.tryParse('${(h as Map)['hour'] ?? -1}') ?? -1;
      if (hr >= 0 && hr < 24) counts[hr] = int.tryParse('${h['orderCount'] ?? 0}') ?? 0;
    }
    final maxC = counts.fold(0, (a, b) => a > b ? a : b);
    if (maxC == 0) {
      return SizedBox(height: 140, child: emptyState('No orders on this day', icon: Icons.bar_chart_outlined));
    }
    return SizedBox(
      height: 170,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var hr = 0; hr < 24; hr++)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 1.5),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(counts[hr] > 0 ? '${counts[hr]}' : '',
                        style: const TextStyle(fontSize: 9, color: Zenith.muted, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Container(
                      height: 120 * (counts[hr] / maxC) + (counts[hr] > 0 ? 4 : 0),
                      decoration: BoxDecoration(
                        color: counts[hr] > 0 ? Zenith.accent : Zenith.border,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (hr % 3 == 0)
                      Text(hr.toString().padLeft(2, '0'),
                          style: const TextStyle(fontSize: 8.5, color: Zenith.faint))
                    else
                      const SizedBox(height: 11),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
