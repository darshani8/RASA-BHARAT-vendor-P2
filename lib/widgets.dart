import 'package:flutter/material.dart';
import 'theme.dart';
import 'api/rasap_api.dart';
import 'ui/components.dart';

/// One order card with lifecycle actions driven by the order's status.
Widget orderCard(
  BuildContext context,
  Map o, {
  VoidCallback? onReady,
  VoidCallback? onComplete,
  VoidCallback? onReject,
}) {
  final status = '${o['status']}';
  final orderNo = '${o['orderNumber'] ?? o['orderId'] ?? ''}';
  final total = RasapApi.paiseToRupees(o['totalPaise']);
  final prep = o['prepMinutes']; // number|null — only stamped once an order is ready

  final actions = <Widget>[];
  if (status == 'paid') {
    actions.addAll([
      OutlinedButton.icon(
        onPressed: onReject,
        icon: const Icon(Icons.close, size: 16, color: Zenith.neg),
        label: const Text('Reject', style: TextStyle(color: Zenith.neg)),
      ),
      const SizedBox(width: 8),
      FilledButton.icon(
        onPressed: onReady,
        style: FilledButton.styleFrom(backgroundColor: Zenith.accent, foregroundColor: Colors.white),
        icon: const Icon(Icons.restaurant, size: 16),
        label: const Text('Mark Ready', style: TextStyle(color: Colors.white)),
      ),
    ]);
  } else if (status == 'ready') {
    actions.add(FilledButton.icon(
      onPressed: onComplete,
      icon: const Icon(Icons.done_all, size: 16),
      label: const Text('Complete', style: TextStyle(color: Colors.white)),
    ));
  }

  return Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('#$orderNo',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w800, color: Zenith.ink)),
              const Spacer(),
              statusPill(status),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(total,
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w800, color: Zenith.ink)),
              if (prep != null) ...[
                const SizedBox(width: 10),
                Text('· ${prep}m prep',
                    style: const TextStyle(color: Zenith.muted, fontSize: 12.5)),
              ],
            ],
          ),
          if (actions.isNotEmpty) ...[
            const SizedBox(height: 14),
            Row(mainAxisAlignment: MainAxisAlignment.end, children: actions),
          ],
        ],
      ),
    ),
  );
}

/// Loads one keyset page; `cursor` is null for the first page and `Page.nextCursor` thereafter.
typedef PageLoader = Future<PageResult> Function({String? cursor});

/// Reusable, keyset-paginated, refreshable order list used by the Queue board and Orders screens.
/// Pulls more pages as the user scrolls; pull-to-refresh and [refreshSignal] (a realtime tick)
/// both reload from the first page.
class OrderBoard extends StatefulWidget {
  final PageLoader loader;
  final String emptyText;
  final Listenable? refreshSignal;
  const OrderBoard({
    super.key,
    required this.loader,
    this.emptyText = 'No orders right now',
    this.refreshSignal,
  });

  @override
  State<OrderBoard> createState() => _OrderBoardState();
}

class _OrderBoardState extends State<OrderBoard> {
  final _scroll = ScrollController();
  final List _items = [];
  String? _cursor;
  bool _hasMore = false;
  bool _loading = true;
  bool _loadingMore = false;
  Object? _error;
  // Monotonic load generation: each (re)load captures it before awaiting and discards its result
  // if a newer load started meanwhile — prevents a stale _loadMore from corrupting a fresh reload
  // (duplicate/out-of-order rows or a stale cursor) when a realtime tick / refresh / action fires.
  int _gen = 0;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    widget.refreshSignal?.addListener(_reloadFromSignal);
    _loadFirst();
  }

  @override
  void didUpdateWidget(covariant OrderBoard old) {
    super.didUpdateWidget(old);
    if (old.refreshSignal != widget.refreshSignal) {
      old.refreshSignal?.removeListener(_reloadFromSignal);
      widget.refreshSignal?.addListener(_reloadFromSignal);
    }
  }

  @override
  void dispose() {
    _scroll.removeListener(_onScroll);
    widget.refreshSignal?.removeListener(_reloadFromSignal);
    _scroll.dispose();
    super.dispose();
  }

  void _reloadFromSignal() {
    if (mounted) _loadFirst();
  }

  Future<void> _loadFirst() async {
    final gen = ++_gen; // supersedes any in-flight load
    setState(() {
      _loading = true;
      _loadingMore = false;
      _error = null;
    });
    try {
      final page = await widget.loader(cursor: null);
      if (!mounted || gen != _gen) return;
      setState(() {
        _items
          ..clear()
          ..addAll(page.items);
        _cursor = page.nextCursor;
        _hasMore = page.hasMore;
        _loading = false;
      });
    } catch (e) {
      if (!mounted || gen != _gen) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || _cursor == null) return;
    final gen = _gen;
    setState(() => _loadingMore = true);
    try {
      final page = await widget.loader(cursor: _cursor);
      if (!mounted || gen != _gen) return; // a reload happened — drop this stale page
      setState(() {
        _items.addAll(page.items);
        _cursor = page.nextCursor;
        _hasMore = page.hasMore;
        _loadingMore = false;
      });
    } catch (e) {
      if (!mounted || gen != _gen) return;
      setState(() => _loadingMore = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 320) _loadMore();
  }

  Future<void> _act(Future<void> Function() fn) async {
    try {
      await fn();
      await _loadFirst();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
          child: Padding(padding: EdgeInsets.all(48), child: CircularProgressIndicator()));
    }
    if (_error != null) {
      return RefreshIndicator(
        onRefresh: _loadFirst,
        child: ListView(children: [errorBox(context, '$_error', _loadFirst)]),
      );
    }
    if (_items.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadFirst,
        child: ListView(children: [emptyBox(widget.emptyText)]),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadFirst,
      child: ListView.separated(
        controller: _scroll,
        padding: const EdgeInsets.all(16),
        itemCount: _items.length + (_hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          if (i >= _items.length) {
            return const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(child: CircularProgressIndicator()));
          }
          final o = _items[i] as Map;
          return orderCard(
            context,
            o,
            onReady: () => _act(() => RasapApi.instance.markReady('${o['orderId']}')),
            onComplete: () => _act(() => RasapApi.instance.markComplete('${o['orderId']}')),
            onReject: () => _act(() => RasapApi.instance.reject('${o['orderId']}')),
          );
        },
      ),
    );
  }
}

Widget emptyBox(String text) => Container(
      margin: const EdgeInsets.fromLTRB(16, 80, 16, 16),
      alignment: Alignment.center,
      child: Column(children: [
        const Icon(Icons.inbox_outlined, size: 44, color: Zenith.faint),
        const SizedBox(height: 12),
        Text(text, style: const TextStyle(color: Zenith.muted, fontWeight: FontWeight.w700)),
      ]),
    );

Widget errorBox(BuildContext context, String message, VoidCallback onRetry) => Container(
      margin: const EdgeInsets.fromLTRB(16, 60, 16, 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Zenith.negSoft,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x33C5413A)),
      ),
      child: Column(children: [
        const Icon(Icons.cloud_off, color: Zenith.neg),
        const SizedBox(height: 10),
        Text(message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Zenith.neg, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
      ]),
    );
