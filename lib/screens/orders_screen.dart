import 'package:flutter/material.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../theme.dart';
import '../ui/components.dart';
import '../widgets.dart';

/// Incoming orders with a status filter (GET /vendors/me/orders), live + keyset-paginated.
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  static const _filters = ['paid', 'ready', 'collected', 'completed', 'cancelled'];
  static const _labels = {
    'paid': 'New',
    'ready': 'Ready',
    'collected': 'Collected',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  String? _status = 'paid';
  Key _key = UniqueKey();

  void _select(String? s) => setState(() {
        _status = s;
        _key = UniqueKey();
      });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const PageHeader(title: 'Orders', subtitle: 'Every order placed with your counter'),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _chip('All', _status == null, () => _select(null)),
                for (final f in _filters)
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: _chip(_labels[f]!, _status == f, () => _select(f)),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: OrderBoard(
              key: _key,
              loader: ({cursor}) => RasapApi.instance.orders(status: _status, cursor: cursor),
              refreshSignal: RealtimeClient.instance.orderTick,
              emptyText: 'No orders in this view',
            ),
          ),
        ],
      ),
    );
  }

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
              style: TextStyle(
                  color: selected ? Colors.white : Zenith.text, fontWeight: FontWeight.w700, fontSize: 13)),
        ),
      );
}
