import 'package:flutter/material.dart';
import '../theme.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../widgets.dart';

/// The KDS board — active orders sorted by ready-time (GET /api/v1/vendor/board), keyset-paginated
/// and refreshed live whenever the realtime gateway pushes an order-lifecycle event.
class QueueScreen extends StatefulWidget {
  const QueueScreen({super.key});
  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  // Bumped to force a fresh board after a manual Advance (resets pagination).
  final ValueNotifier<int> _manual = ValueNotifier<int>(0);
  late final Listenable _refresh =
      Listenable.merge([RealtimeClient.instance.orderTick, _manual]);

  @override
  void dispose() {
    _manual.dispose();
    super.dispose();
  }

  Future<void> _advance() async {
    try {
      final id = await RasapApi.instance.advanceQueue();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(id == null ? 'Queue is empty' : 'Now serving order $id')),
      );
      _manual.value++;
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Zenith.canvas,
      body: OrderBoard(
        loader: ({cursor}) => RasapApi.instance.board(cursor: cursor),
        refreshSignal: _refresh,
        emptyText: 'No active orders on the board',
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _advance,
        backgroundColor: Zenith.ink,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.skip_next),
        label: const Text('Advance', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
    );
  }
}
