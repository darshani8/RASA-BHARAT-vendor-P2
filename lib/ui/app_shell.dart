import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../theme.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/point_of_sale_screen.dart';
import '../screens/orders_screen.dart';
import '../screens/queue_screen.dart';
import '../screens/inventory_screen.dart';
import '../screens/analytics_screen.dart';
import '../screens/reports_screen.dart';

class NavDest {
  final String label;
  final IconData icon;
  final String group;
  const NavDest(this.label, this.icon, this.group);
}

const kDests = <NavDest>[
  NavDest('Dashboard', Icons.space_dashboard_outlined, 'OVERVIEW'),
  NavDest('Point of Sale', Icons.point_of_sale_outlined, 'OPERATIONS'),
  NavDest('Orders', Icons.receipt_long_outlined, 'OPERATIONS'),
  NavDest('Queue', Icons.pending_actions_outlined, 'OPERATIONS'),
  NavDest('Inventory', Icons.inventory_2_outlined, 'OPERATIONS'),
  NavDest('Analytics', Icons.insights_outlined, 'INSIGHTS'),
  NavDest('Reports', Icons.workspace_premium_outlined, 'INSIGHTS'),
];

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  final ValueNotifier<int> _ordersBadge = ValueNotifier<int>(0);

  late final List<Widget> _screens = const [
    DashboardScreen(),
    PointOfSaleScreen(),
    OrdersScreen(),
    QueueScreen(),
    InventoryScreen(),
    AnalyticsScreen(),
    ReportsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    RealtimeClient.instance.connect();
    RealtimeClient.instance.orderTick.addListener(_loadBadge);
    _loadBadge();
  }

  @override
  void dispose() {
    RealtimeClient.instance.orderTick.removeListener(_loadBadge);
    _ordersBadge.dispose();
    super.dispose();
  }

  Future<void> _loadBadge() async {
    try {
      final p = await RasapApi.instance.orders(status: 'paid', limit: 100);
      if (mounted) _ordersBadge.value = p.items.length;
    } catch (_) {/* ignore badge errors */}
  }

  void _select(int i) {
    setState(() => _index = i);
    if (_scaffoldKey.currentState?.hasDrawer ?? false) {
      Navigator.of(context).maybePop(); // close the mobile drawer
    }
  }

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.of(context).size.width >= 900;
    final sidebar = _Sidebar(index: _index, onSelect: _select, ordersBadge: _ordersBadge);
    final content = Column(
      children: [
        _TopBar(scaffoldKey: _scaffoldKey, wide: wide, title: kDests[_index].label),
        Expanded(
          child: Container(
            color: Zenith.canvas,
            child: IndexedStack(index: _index, children: _screens),
          ),
        ),
      ],
    );

    if (wide) {
      return Scaffold(
        body: Row(children: [sidebar, Expanded(child: content)]),
      );
    }
    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(width: 264, backgroundColor: Zenith.sidebar, child: sidebar),
      body: content,
    );
  }
}

class _Sidebar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onSelect;
  final ValueListenable<int> ordersBadge;
  const _Sidebar({required this.index, required this.onSelect, required this.ordersBadge});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    String? lastGroup;
    for (var i = 0; i < kDests.length; i++) {
      final d = kDests[i];
      if (d.group != lastGroup) {
        rows.add(Padding(
          padding: EdgeInsets.fromLTRB(20, lastGroup == null ? 8 : 22, 20, 10),
          child: Text(d.group,
              style: const TextStyle(
                  color: Zenith.sidebarMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
        ));
        lastGroup = d.group;
      }
      rows.add(_NavRow(
        dest: d,
        active: i == index,
        onTap: () => onSelect(i),
        badge: d.label == 'Orders' ? ordersBadge : null,
      ));
    }
    return Container(
      width: 264,
      color: Zenith.sidebar,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Brand
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Zenith.accentBright, Zenith.accentInk]),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    alignment: Alignment.center,
                    child: const Text('Z',
                        style: TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Zenith',
                          style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800)),
                      SizedBox(height: 1),
                      Text('RETAIL CLOUD',
                          style: TextStyle(
                              color: Zenith.sidebarMuted, fontSize: 9.5, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(child: ListView(padding: EdgeInsets.zero, children: rows)),
            const Divider(height: 1, color: Zenith.sidebarBorder),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Signed in · ${RasapApi.instance.vendorPhone}',
                  style: const TextStyle(color: Zenith.sidebarMuted, fontSize: 11.5, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavRow extends StatelessWidget {
  final NavDest dest;
  final bool active;
  final VoidCallback onTap;
  final ValueListenable<int>? badge;
  const _NavRow({required this.dest, required this.active, required this.onTap, this.badge});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
      child: Stack(
        children: [
          if (active)
            Positioned(
              left: 0,
              top: 8,
              bottom: 8,
              child: Container(
                width: 3,
                decoration: BoxDecoration(color: Zenith.violet, borderRadius: BorderRadius.circular(3)),
              ),
            ),
          Material(
            color: active ? Zenith.sidebarItem : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                child: Row(
                  children: [
                    Icon(dest.icon, size: 20, color: active ? Zenith.violet : Zenith.sidebarText),
                    const SizedBox(width: 13),
                    Expanded(
                      child: Text(dest.label,
                          style: TextStyle(
                              color: active ? Colors.white : Zenith.sidebarText,
                              fontSize: 14.5,
                              fontWeight: active ? FontWeight.w700 : FontWeight.w600)),
                    ),
                    if (badge != null)
                      ValueListenableBuilder<int>(
                        valueListenable: badge!,
                        builder: (_, n, __) => n <= 0
                            ? const SizedBox.shrink()
                            : Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration:
                                    BoxDecoration(color: Zenith.badge, borderRadius: BorderRadius.circular(999)),
                                child: Text('$n',
                                    style: const TextStyle(
                                        color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.w800)),
                              ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TopBar extends StatefulWidget {
  final GlobalKey<ScaffoldState> scaffoldKey;
  final bool wide;
  final String title;
  const _TopBar({required this.scaffoldKey, required this.wide, required this.title});
  @override
  State<_TopBar> createState() => _TopBarState();
}

class _TopBarState extends State<_TopBar> {
  bool? _accepting;

  @override
  void initState() {
    super.initState();
    _loadAccepting();
  }

  Future<void> _loadAccepting() async {
    try {
      final v = await RasapApi.instance.getAccepting();
      if (mounted) setState(() => _accepting = v);
    } catch (_) {}
  }

  Future<void> _setAccepting(bool v) async {
    setState(() => _accepting = v);
    try {
      await RasapApi.instance.setAccepting(v);
    } catch (e) {
      if (mounted) {
        setState(() => _accepting = !v);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _logout() async {
    await RasapApi.instance.logout();
    RealtimeClient.instance.disconnect();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (r) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      decoration: const BoxDecoration(
        color: Zenith.card,
        border: Border(bottom: BorderSide(color: Zenith.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          if (!widget.wide) ...[
            IconButton(
              icon: const Icon(Icons.menu, color: Zenith.ink),
              onPressed: () => widget.scaffoldKey.currentState?.openDrawer(),
            ),
            Text(widget.title,
                style: const TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink, fontSize: 16)),
          ],
          const Spacer(),
          const _LiveChip(),
          const SizedBox(width: 14),
          Row(children: [
            const Text('Accepting',
                style: TextStyle(color: Zenith.muted, fontSize: 12.5, fontWeight: FontWeight.w700)),
            Switch(
              value: _accepting ?? false,
              activeThumbColor: Zenith.accent,
              onChanged: _accepting == null ? null : _setAccepting,
            ),
          ]),
          const SizedBox(width: 6),
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout, color: Zenith.muted, size: 20),
            onPressed: _logout,
          ),
        ],
      ),
    );
  }
}

class _LiveChip extends StatelessWidget {
  const _LiveChip();
  @override
  Widget build(BuildContext context) => ValueListenableBuilder<bool>(
        valueListenable: RealtimeClient.instance.connected,
        builder: (context, live, _) {
          final c = live ? Zenith.accent : Zenith.faint;
          return Row(children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(live ? 'Live' : 'Offline',
                style: TextStyle(color: c, fontSize: 12.5, fontWeight: FontWeight.w800)),
          ]);
        },
      );
}
