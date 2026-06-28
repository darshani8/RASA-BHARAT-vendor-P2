import 'package:flutter/material.dart';
import '../theme.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../widgets.dart';

/// Vendor-owned menu (GET/POST/PUT/DELETE /api/v1/menu). Prices are POSITIVE integer paise strings.
/// Lists ALL items (incl. sold-out) via `available_only=false` so a hidden item can be brought
/// back, and refreshes live when the realtime gateway pushes a MenuItemAvailabilityChanged event.
class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});
  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  late Future<List> _future;

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

  Future<List> _load() => RasapApi.instance.listMenu(availableOnly: false);
  void _reload() {
    if (mounted) setState(() => _future = _load());
  }

  Future<void> _toggle(Map item, bool value) async {
    try {
      await RasapApi.instance.updateMenuItem('${item['id']}', {'isAvailable': value});
      _reload();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _delete(Map item) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete item?'),
        content: Text('Remove "${item['name']}" from the menu? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Zenith.neg),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await RasapApi.instance.deleteMenuItem('${item['id']}');
      _reload();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  // One sheet drives both create (item == null) and edit. Returns true if the list should reload.
  Future<void> _editSheet({Map? item}) async {
    final isEdit = item != null;
    final name = TextEditingController(text: isEdit ? '${item['name']}' : '');
    final rupees = (int.tryParse('${item?['pricePaise'] ?? ''}') ?? 0) / 100;
    final price = TextEditingController(text: isEdit ? rupees.toStringAsFixed(2) : '');
    final prep = TextEditingController(
        text: item?['prepMinutes'] != null ? '${item!['prepMinutes']}' : '');

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Zenith.card,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(isEdit ? 'Edit menu item' : 'Add menu item',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Zenith.ink)),
            const SizedBox(height: 16),
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Item name')),
            const SizedBox(height: 12),
            TextField(
                controller: price,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Price (₹)')),
            const SizedBox(height: 12),
            TextField(
                controller: prep,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Prep minutes (optional)')),
            const SizedBox(height: 20),
            FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(isEdit ? 'Save changes' : 'Save item')),
          ],
        ),
      ),
    );
    if (ok != true) return;

    final paise = ((double.tryParse(price.text.trim()) ?? 0) * 100).round();
    final trimmedName = name.text.trim();
    if (trimmedName.isEmpty) {
      _snack('Item name is required');
      return;
    }
    if (paise <= 0) {
      _snack('Price must be greater than ₹0');
      return;
    }
    final prepMinutes = int.tryParse(prep.text.trim());

    try {
      if (isEdit) {
        await RasapApi.instance.updateMenuItem('${item['id']}', {
          'name': trimmedName,
          'pricePaise': '$paise',
          if (prepMinutes != null) 'prepMinutes': prepMinutes,
        });
      } else {
        await RasapApi.instance.createMenuItem(
          name: trimmedName,
          pricePaise: '$paise',
          prepMinutes: prepMinutes,
        );
      }
      _reload();
    } catch (e) {
      _snack('$e');
    }
  }

  void _snack(String msg) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Zenith.canvas,
      body: RefreshIndicator(
        onRefresh: () async {
          _reload();
          await _future;
        },
        child: FutureBuilder<List>(
          future: _future,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(
                  child: Padding(padding: EdgeInsets.all(48), child: CircularProgressIndicator()));
            }
            if (snap.hasError) {
              return ListView(children: [errorBox(context, '${snap.error}', _reload)]);
            }
            final items = snap.data ?? const [];
            if (items.isEmpty) return ListView(children: [emptyBox('No menu items yet')]);
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final m = items[i] as Map;
                final available = m['isAvailable'] != false;
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 6, 4, 6),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${m['name']}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700, fontSize: 14, color: Zenith.ink)),
                              const SizedBox(height: 3),
                              Text(
                                '${RasapApi.paiseToRupees(m['pricePaise'])}'
                                '${m['prepMinutes'] != null ? '  ·  ${m['prepMinutes']}m' : ''}'
                                '${available ? '' : '  ·  Sold out'}',
                                style: TextStyle(
                                    color: available ? Zenith.muted : Zenith.neg, fontSize: 12.5),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: available,
                          activeColor: Zenith.accent,
                          onChanged: (v) => _toggle(m, v),
                        ),
                        PopupMenuButton<String>(
                          onSelected: (v) {
                            if (v == 'edit') _editSheet(item: m);
                            if (v == 'delete') _delete(m);
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem(value: 'edit', child: Text('Edit')),
                            PopupMenuItem(value: 'delete', child: Text('Delete')),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _editSheet(),
        backgroundColor: Zenith.ink,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add item', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
    );
  }
}
