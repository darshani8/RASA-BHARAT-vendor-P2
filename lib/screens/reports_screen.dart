import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../api/rasap_api.dart';
import '../theme.dart';
import '../ui/components.dart';

typedef _Row = ({String date, int orders, int revenuePaise});

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});
  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  int _days = 7;
  late Future<List<_Row>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  void _reload() => setState(() => _future = _load());

  Future<List<_Row>> _load() async {
    final today = DateTime.now().toUtc();
    final dates = List.generate(_days, (i) => today.subtract(Duration(days: _days - 1 - i)));
    final results = await Future.wait(dates.map((d) async {
      final ds = DateFormat('yyyy-MM-dd').format(d);
      try {
        final a = await RasapApi.instance.analytics(ds);
        return (
          date: ds,
          orders: int.tryParse('${a['orderCount'] ?? 0}') ?? 0,
          revenuePaise: int.tryParse('${a['grossRevenuePaise'] ?? 0}') ?? 0,
        );
      } catch (_) {
        return (date: ds, orders: 0, revenuePaise: 0);
      }
    }));
    return results;
  }

  Future<void> _copyCsv(List<_Row> rows) async {
    final buf = StringBuffer('date,orders,revenue_paise,revenue_rupees\n');
    for (final r in rows) {
      buf.writeln('${r.date},${r.orders},${r.revenuePaise},${(r.revenuePaise / 100).toStringAsFixed(2)}');
    }
    await Clipboard.setData(ClipboardData(text: buf.toString()));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('CSV copied to clipboard')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 32),
      children: [
        const PageHeader(title: 'Reports', subtitle: 'Daily totals over a date range (UTC)'),
        Row(
          children: [
            for (final d in [7, 14, 30])
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: _chip('$d days', _days == d, () {
                  _days = d;
                  _reload();
                }),
              ),
          ],
        ),
        const SizedBox(height: 16),
        FutureBuilder<List<_Row>>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) return loadingBox();
            if (snap.hasError) return errorView('${snap.error}', _reload);
            final rows = snap.data ?? const [];
            final totalOrders = rows.fold(0, (a, r) => a + r.orders);
            final totalRev = rows.fold(0, (a, r) => a + r.revenuePaise);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LayoutBuilder(builder: (context, c) {
                  final cols = c.maxWidth >= 560 ? 2 : 1;
                  const gap = 16.0;
                  final w = (c.maxWidth - gap * (cols - 1)) / cols;
                  return Wrap(spacing: gap, runSpacing: gap, children: [
                    SizedBox(width: w, child: StatTile(label: 'Total orders ($_days days)', value: '$totalOrders', icon: Icons.receipt_long_outlined)),
                    SizedBox(width: w, child: StatTile(label: 'Total revenue', value: rupees(totalRev), icon: Icons.payments_outlined, accent: Zenith.accentInk)),
                  ]);
                }),
                const SizedBox(height: 18),
                Row(children: [
                  const Text('Daily breakdown',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Zenith.ink)),
                  const Spacer(),
                  GhostButton('Copy CSV', icon: Icons.download_outlined, onPressed: () => _copyCsv(rows)),
                ]),
                const SizedBox(height: 12),
                ZCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _headerRow(),
                      for (final r in rows.reversed) ...[
                        const Divider(height: 1, color: Zenith.border),
                        _dataRow(r),
                      ],
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _headerRow() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        child: const Row(children: [
          Expanded(flex: 3, child: Text('Date', style: TextStyle(fontWeight: FontWeight.w800, color: Zenith.muted, fontSize: 12))),
          Expanded(flex: 2, child: Text('Orders', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.w800, color: Zenith.muted, fontSize: 12))),
          Expanded(flex: 3, child: Text('Revenue', textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.w800, color: Zenith.muted, fontSize: 12))),
        ]),
      );

  Widget _dataRow(_Row r) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
        child: Row(children: [
          Expanded(flex: 3, child: Text(r.date, style: const TextStyle(fontWeight: FontWeight.w600, color: Zenith.ink, fontSize: 13.5))),
          Expanded(flex: 2, child: Text('${r.orders}', textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w700, color: Zenith.ink, fontSize: 13.5))),
          Expanded(flex: 3, child: Text(rupees(r.revenuePaise), textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink, fontSize: 13.5))),
        ]),
      );

  Widget _chip(String label, bool selected, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? Zenith.ink : Zenith.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: selected ? Zenith.ink : Zenith.border),
          ),
          child: Text(label,
              style: TextStyle(color: selected ? Colors.white : Zenith.text, fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      );
}
