import 'package:flutter/material.dart';
import '../api/rasap_api.dart';
import '../realtime/realtime_client.dart';
import '../theme.dart';
import '../ui/components.dart';

/// Inventory — the vendor's menu items (GET/POST/PUT/DELETE /menu). Lists all items incl. sold-out.
class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});
  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
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

  void _snack(String m) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  Future<void> _toggle(Map item, bool value) async {
    try {
      await RasapApi.instance.updateMenuItem('${item['id']}', {'isAvailable': value});
      _reload();
    } catch (e) {
      _snack('$e');
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
            style: FilledButton.styleFrom(backgroundColor: Zenith.neg, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await RasapApi.instance.deleteMenuItem('${item['id']}');
      _reload();
    } catch (e) {
      _snack('$e');
    }
  }

  Future<void> _editSheet({Map? item}) async {
    final isEdit = item != null;
    final name = TextEditingController(text: isEdit ? '${item['name']}' : '');
    final rupeesVal = (int.tryParse('${item?['pricePaise'] ?? ''}') ?? 0) / 100;
    final price = TextEditingController(text: isEdit ? rupeesVal.toStringAsFixed(2) : '');
    final prep = TextEditingController(text: item?['prepMinutes'] != null ? '${item!['prepMinutes']}' : '');

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Zenith.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(isEdit ? 'Edit item' : 'Add item',
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
            PrimaryButton(isEdit ? 'Save changes' : 'Save item',
                color: Zenith.accent, onPressed: () => Navigator.pop(ctx, true)),
          ],
        ),
      ),
    );
    if (ok != true) return;

    final paise = ((double.tryParse(price.text.trim()) ?? 0) * 100).round();
    final trimmed = name.text.trim();
    if (trimmed.isEmpty) return _snack('Item name is required');
    if (paise <= 0) return _snack('Price must be greater than ₹0');
    final prepMinutes = int.tryParse(prep.text.trim());

    try {
      if (isEdit) {
        await RasapApi.instance.updateMenuItem('${item['id']}', {
          'name': trimmed,
          'pricePaise': '$paise',
          if (prepMinutes != null) 'prepMinutes': prepMinutes,
        });
      } else {
        await RasapApi.instance.createMenuItem(name: trimmed, pricePaise: '$paise', prepMinutes: prepMinutes);
      }
      _reload();
    } catch (e) {
      _snack('$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 0),
      child: Column(
        children: [
          PageHeader(
            title: 'Inventory',
            subtitle: 'Menu items, prices and availability',
            actions: [PrimaryButton('Add item', icon: Icons.add, color: Zenith.ink, onPressed: () => _editSheet())],
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => _reload(),
              child: FutureBuilder<List>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) return loadingBox();
                  if (snap.hasError) {
                    return ListView(children: [errorView('${snap.error}', _reload)]);
                  }
                  final items = snap.data ?? const [];
                  if (items.isEmpty) return ListView(children: [emptyState('No menu items yet')]);
                  return ListView.separated(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) => _itemRow(items[i] as Map),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _itemRow(Map m) {
    final available = m['isAvailable'] != false;
    return ZCard(
      padding: const EdgeInsets.fromLTRB(16, 8, 6, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${m['name']}',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5, color: Zenith.ink)),
                const SizedBox(height: 3),
                Text(
                  '${rupees(m['pricePaise'])}'
                  '${m['prepMinutes'] != null ? '  ·  ${m['prepMinutes']}m prep' : ''}'
                  '${available ? '' : '  ·  Sold out'}',
                  style: TextStyle(color: available ? Zenith.muted : Zenith.neg, fontSize: 12.5),
                ),
              ],
            ),
          ),
          Switch(value: available, activeThumbColor: Zenith.accent, onChanged: (v) => _toggle(m, v)),
          PopupMenuButton<String>(
            onSelected: (v) => v == 'edit' ? _editSheet(item: m) : _delete(m),
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'edit', child: Text('Edit')),
              PopupMenuItem(value: 'delete', child: Text('Delete')),
            ],
          ),
        ],
      ),
    );
  }
}
