import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../theme.dart';
import '../ui/components.dart';

typedef _Data = ({int active, int paid, int todayOrders, String revenue, List recent});

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<_Data> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
    RealtimeClient.instance.orderTick.addListener(_reload);
  }

  @override
  void dispose() {
    RealtimeClient.instance.orderTick.removeListener(_reload);
    super.dispose();
  }

  void _reload() {
    if (mounted) setState(() => _future = _load());
  }

  Future<_Data> _load() async {
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now().toUtc());
    final board = await RasapApi.instance.board(limit: 100);
    final paid = await RasapApi.instance.orders(status: 'paid', limit: 100);
    final a = await RasapApi.instance.analytics(today);
    return (
      active: board.items.length,
      paid: paid.items.length,
      todayOrders: int.tryParse('${a['orderCount'] ?? 0}') ?? 0,
      revenue: rupees(a['grossRevenuePaise']),
      recent: board.items.take(6).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => _reload(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 22, 24, 32),
        children: [
          const PageHeader(title: 'Dashboard', subtitle: 'Your counter at a glance, live'),
          FutureBuilder<_Data>(
            future: _future,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) return loadingBox();
              if (snap.hasError) return errorView('${snap.error}', _reload);
              final d = snap.data!;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  LayoutBuilder(builder: (context, c) {
                    final cols = c.maxWidth >= 1040 ? 4 : (c.maxWidth >= 560 ? 2 : 1);
                    const gap = 16.0;
                    final w = (c.maxWidth - gap * (cols - 1)) / cols;
                    final tiles = [
                      StatTile(label: 'Active on board', value: '${d.active}', icon: Icons.pending_actions_outlined, accent: Zenith.violet),
                      StatTile(label: 'New (awaiting prep)', value: '${d.paid}', icon: Icons.fiber_new_outlined, accent: Zenith.amber),
                      StatTile(label: "Today's orders", value: '${d.todayOrders}', icon: Icons.receipt_long_outlined, accent: Zenith.accent),
                      StatTile(label: "Today's revenue", value: d.revenue, icon: Icons.payments_outlined, accent: Zenith.accentInk),
                    ];
                    return Wrap(
                      spacing: gap,
                      runSpacing: gap,
                      children: [for (final t in tiles) SizedBox(width: w, child: t)],
                    );
                  }),
                  const SizedBox(height: 22),
                  const Text('On the board now',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Zenith.ink)),
                  const SizedBox(height: 12),
                  if (d.recent.isEmpty)
                    ZCard(child: emptyState('No active orders right now'))
                  else
                    ZCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          for (var i = 0; i < d.recent.length; i++) ...[
                            if (i > 0) const Divider(height: 1, color: Zenith.border),
                            _recentRow(d.recent[i] as Map),
                          ],
                        ],
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _recentRow(Map o) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        child: Row(
          children: [
            Text('#${o['orderNumber'] ?? o['orderId'] ?? ''}',
                style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink, fontSize: 14)),
            const SizedBox(width: 12),
            statusPill('${o['status']}'),
            const Spacer(),
            Text(rupees(o['totalPaise']),
                style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink, fontSize: 14)),
          ],
        ),
      );
}
