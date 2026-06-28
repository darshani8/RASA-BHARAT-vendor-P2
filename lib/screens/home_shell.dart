import 'package:flutter/material.dart';
import '../theme.dart';
import '../realtime/realtime_client.dart';
import 'queue_screen.dart';
import 'orders_screen.dart';
import 'menu_screen.dart';
import 'settings_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  static const _titles = ['Live Queue', 'Orders', 'Menu', 'Settings'];
  final _screens = const [QueueScreen(), OrdersScreen(), MenuScreen(), SettingsScreen()];

  @override
  void initState() {
    super.initState();
    // Open the realtime socket once authenticated; it auto-joins the vendor's room server-side.
    RealtimeClient.instance.connect();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index],
            style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink)),
        actions: const [_LiveBadge(), SizedBox(width: 12)],
      ),
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Zenith.card,
        indicatorColor: Zenith.accentSoft,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.pending_actions_outlined), selectedIcon: Icon(Icons.pending_actions), label: 'Queue'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Menu'),
          NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}

/// Small live/offline dot reflecting the realtime socket connection.
class _LiveBadge extends StatelessWidget {
  const _LiveBadge();
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: RealtimeClient.instance.connected,
      builder: (context, live, _) {
        final color = live ? Zenith.accent : Zenith.faint;
        return Row(
          children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(live ? 'Live' : 'Offline',
                style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700)),
          ],
        );
      },
    );
  }
}
