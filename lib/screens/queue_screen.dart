import 'package:flutter/material.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../theme.dart';
import '../ui/components.dart';
import '../widgets.dart';

/// KDS board — active orders by ready-time (GET /vendor/board), live + keyset-paginated.
class QueueScreen extends StatefulWidget {
  const QueueScreen({super.key});
  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  final ValueNotifier<int> _manual = ValueNotifier<int>(0);
  late final Listenable _refresh = Listenable.merge([RealtimeClient.instance.orderTick, _manual]);

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
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 0),
      child: Column(
        children: [
          PageHeader(
            title: 'Live Queue',
            subtitle: 'Active orders sorted by ready-time',
            actions: [PrimaryButton('Advance', icon: Icons.skip_next, color: Zenith.ink, onPressed: _advance)],
          ),
          Expanded(
            child: OrderBoard(
              loader: ({cursor}) => RasapApi.instance.board(cursor: cursor),
              refreshSignal: _refresh,
              emptyText: 'No active orders on the board',
            ),
          ),
        ],
      ),
    );
  }
}
