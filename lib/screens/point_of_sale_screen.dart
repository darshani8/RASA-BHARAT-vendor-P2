import 'package:flutter/material.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../theme.dart';
import '../ui/components.dart';

/// Point of Sale — build a counter order from the menu and charge it (creates a paid order on the
/// board via create-order + confirm-offline).
class PointOfSaleScreen extends StatefulWidget {
  const PointOfSaleScreen({super.key});
  @override
  State<PointOfSaleScreen> createState() => _PointOfSaleScreenState();
}

class _PointOfSaleScreenState extends State<PointOfSaleScreen> {
  late Future<List> _future;
  final Map<String, int> _cart = {}; // menuItemId -> qty
  final Map<String, Map> _byId = {};
  bool _charging = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
    RealtimeClient.instance.menuTick.addListener(_reload);
  }

  @override
  void dispose() {
    RealtimeClient.instance.menuTick.removeListener(_reload);
    super.dispose();
  }

  Future<List> _load() async {
    final items = await RasapApi.instance.listMenu(availableOnly: true);
    _byId
      ..clear()
      ..addEntries(items.map((e) => MapEntry('${(e as Map)['id']}', e)));
    return items;
  }

  void _reload() {
    if (mounted) setState(() => _future = _load());
  }

  int get _cartTotalPaise => _cart.entries
      .fold(0, (sum, e) => sum + (int.tryParse('${_byId[e.key]?['pricePaise'] ?? 0}') ?? 0) * e.value);
  int get _cartCount => _cart.values.fold(0, (a, b) => a + b);

  void _add(String id) => setState(() => _cart[id] = (_cart[id] ?? 0) + 1);
  void _remove(String id) => setState(() {
        final n = (_cart[id] ?? 0) - 1;
        if (n <= 0) {
          _cart.remove(id);
        } else {
          _cart[id] = n;
        }
      });

  Future<void> _charge() async {
    if (_cart.isEmpty) return;
    setState(() => _charging = true);
    try {
      final lines = _cart.entries.map((e) => {'menuItemId': e.key, 'quantity': e.value}).toList();
      final order = await RasapApi.instance.createOrder(lines);
      final orderId = '${order['orderId'] ?? order['id']}';
      await RasapApi.instance.confirmOfflinePayment(orderId);
      if (!mounted) return;
      setState(() => _cart.clear());
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Order placed & paid — sent to the queue')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _charging = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PageHeader(title: 'Point of Sale', subtitle: 'Ring up a walk-in order'),
          Expanded(
            child: LayoutBuilder(builder: (context, c) {
              final wide = c.maxWidth >= 820;
              final grid = _itemsGrid();
              final cart = _cartPanel();
              if (wide) {
                return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(child: grid),
                  const SizedBox(width: 18),
                  SizedBox(width: 330, child: cart),
                ]);
              }
              return ListView(padding: const EdgeInsets.only(bottom: 24), children: [
                SizedBox(height: 320, child: grid),
                const SizedBox(height: 16),
                cart,
              ]);
            }),
          ),
        ],
      ),
    );
  }

  Widget _itemsGrid() => FutureBuilder<List>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) return loadingBox();
          if (snap.hasError) return errorView('${snap.error}', _reload);
          final items = snap.data ?? const [];
          if (items.isEmpty) return emptyState('No available items — add some in Inventory');
          return GridView.builder(
            padding: const EdgeInsets.only(bottom: 24),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 210,
              mainAxisExtent: 116,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final m = items[i] as Map;
              final id = '${m['id']}';
              final qty = _cart[id] ?? 0;
              return InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => _add(id),
                child: ZCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(
                          child: Text('${m['name']}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700, color: Zenith.ink, fontSize: 14)),
                        ),
                        if (qty > 0) pill('$qty', fg: Colors.white, bg: Zenith.accent),
                      ]),
                      const Spacer(),
                      Text(rupees(m['pricePaise']),
                          style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.accentInk, fontSize: 15)),
                    ],
                  ),
                ),
              );
            },
          );
        },
      );

  Widget _cartPanel() => ZCard(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              const Text('Cart', style: TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink, fontSize: 16)),
              const Spacer(),
              if (_cart.isNotEmpty)
                GestureDetector(
                    onTap: () => setState(_cart.clear),
                    child: const Text('Clear', style: TextStyle(color: Zenith.neg, fontWeight: FontWeight.w700, fontSize: 13))),
            ]),
            const SizedBox(height: 12),
            if (_cart.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Text('Tap items to add them', style: TextStyle(color: Zenith.muted)),
              )
            else
              ..._cart.entries.map((e) {
                final m = _byId[e.key];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(children: [
                    Expanded(
                      child: Text('${m?['name'] ?? e.key}',
                          style: const TextStyle(fontWeight: FontWeight.w600, color: Zenith.ink, fontSize: 13.5)),
                    ),
                    _qtyButton(Icons.remove, () => _remove(e.key)),
                    SizedBox(
                        width: 26,
                        child: Text('${e.value}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink))),
                    _qtyButton(Icons.add, () => _add(e.key)),
                    SizedBox(
                      width: 70,
                      child: Text(
                          rupees((int.tryParse('${m?['pricePaise'] ?? 0}') ?? 0) * e.value),
                          textAlign: TextAlign.right,
                          style: const TextStyle(fontWeight: FontWeight.w700, color: Zenith.ink, fontSize: 13)),
                    ),
                  ]),
                );
              }),
            const Divider(height: 24, color: Zenith.border),
            Row(children: [
              const Text('Total', style: TextStyle(fontWeight: FontWeight.w700, color: Zenith.muted)),
              const Spacer(),
              Text(rupees(_cartTotalPaise),
                  style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink, fontSize: 18)),
            ]),
            const SizedBox(height: 14),
            PrimaryButton(
              _cart.isEmpty ? 'Charge' : 'Charge ${rupees(_cartTotalPaise)} · $_cartCount item${_cartCount == 1 ? '' : 's'}',
              color: Zenith.accent,
              busy: _charging,
              onPressed: _cart.isEmpty ? null : _charge,
            ),
          ],
        ),
      );

  Widget _qtyButton(IconData icon, VoidCallback onTap) => InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(color: Zenith.canvas, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 16, color: Zenith.ink),
        ),
      );
}
