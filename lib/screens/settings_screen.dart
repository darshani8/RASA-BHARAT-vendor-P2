import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme.dart';
import '../api/rasap_api.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool? _accepting;
  Map? _analytics;
  String? _err;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final today = DateFormat('yyyy-MM-dd').format(DateTime.now().toUtc());
      final a = await RasapApi.instance.analytics(today);
      final acc = await RasapApi.instance.getAccepting();
      if (!mounted) return;
      setState(() {
        _analytics = a;
        _accepting = acc;
        _err = null;
      });
    } catch (e) {
      if (mounted) setState(() => _err = '$e');
    }
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
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (r) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final api = RasapApi.instance;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _card([
          _row('Connected to', api.baseUrl.isEmpty ? '—' : api.baseUrl),
          const Divider(height: 20, color: Zenith.border),
          _row('Vendor phone', api.vendorPhone.isEmpty ? '—' : api.vendorPhone),
          const Divider(height: 20, color: Zenith.border),
          _row('Vendor ID', api.vendorId.isEmpty ? '—' : api.vendorId, mono: true),
        ]),
        const SizedBox(height: 14),
        _card([
          Row(children: [
            const Expanded(
              child: Text('Accepting orders',
                  style: TextStyle(fontWeight: FontWeight.w700, color: Zenith.ink)),
            ),
            Switch(
              value: _accepting ?? false,
              activeColor: Zenith.accent,
              onChanged: _accepting == null ? null : _setAccepting,
            ),
          ]),
          const Text('Close the shop to stop new orders landing on your queue.',
              style: TextStyle(color: Zenith.muted, fontSize: 12)),
        ]),
        const SizedBox(height: 14),
        _card([
          const Text("Today's performance",
              style: TextStyle(fontWeight: FontWeight.w800, color: Zenith.ink, fontSize: 14)),
          const SizedBox(height: 14),
          if (_err != null)
            Text(_err!, style: const TextStyle(color: Zenith.neg, fontSize: 12.5))
          else if (_analytics == null)
            const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()))
          else
            Row(children: [
              _stat('Orders', '${_analytics!['orderCount'] ?? 0}'),
              const SizedBox(width: 12),
              _stat('Revenue', RasapApi.paiseToRupees(_analytics!['grossRevenuePaise'])),
            ]),
        ]),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: _logout,
          style: OutlinedButton.styleFrom(
            foregroundColor: Zenith.neg,
            side: const BorderSide(color: Zenith.border),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          icon: const Icon(Icons.logout, size: 18),
          label: const Text('Sign out', style: TextStyle(fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }

  Widget _card(List<Widget> children) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Zenith.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Zenith.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
      );

  Widget _row(String k, String v, {bool mono = false}) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 120,
              child: Text(k, style: const TextStyle(color: Zenith.muted, fontSize: 12.5, fontWeight: FontWeight.w600))),
          Expanded(
            child: Text(v,
                style: TextStyle(
                    color: Zenith.ink,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    fontFamily: mono ? 'monospace' : null)),
          ),
        ],
      );

  Widget _stat(String label, String value) => Expanded(
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Zenith.canvas,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Zenith.ink)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: Zenith.muted, fontSize: 12)),
          ]),
        ),
      );
}
