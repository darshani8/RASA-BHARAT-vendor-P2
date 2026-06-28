import 'package:flutter/material.dart';
import '../theme.dart';
import '../api/rasap_api.dart';
import '../ui/app_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _base = TextEditingController(text: RasapApi.instance.baseUrl);
  final _phone = TextEditingController(text: RasapApi.instance.vendorPhone);
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  Future<void> _login() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      RasapApi.instance.baseUrl = _base.text;
      await RasapApi.instance.login(_phone.text.trim(), _password.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AppShell()),
      );
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF1BA576), Zenith.accentInk]),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const Text('Z',
                        style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 20),
                  const Text('RASAP2 Vendor',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Zenith.ink)),
                  const SizedBox(height: 4),
                  const Text('Sign in to your counter',
                      style: TextStyle(color: Zenith.muted, fontSize: 14)),
                  const SizedBox(height: 28),
                  _field(_base, 'API base URL', hint: 'https://your-backend.example.com',
                      keyboard: TextInputType.url),
                  const SizedBox(height: 14),
                  _field(_phone, 'Phone', hint: '+9198xxxxxxxx', keyboard: TextInputType.phone),
                  const SizedBox(height: 14),
                  _field(_password, 'Password', obscure: true),
                  if (_error != null) ...[
                    const SizedBox(height: 14),
                    Text(_error!, style: const TextStyle(color: Zenith.neg, fontWeight: FontWeight.w600)),
                  ],
                  const SizedBox(height: 22),
                  FilledButton(
                    onPressed: _busy ? null : _login,
                    child: _busy
                        ? const SizedBox(
                            height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Sign in', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label,
      {String? hint, bool obscure = false, TextInputType? keyboard}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: Zenith.text)),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          obscureText: obscure,
          keyboardType: keyboard,
          decoration: InputDecoration(
            hintText: hint,
            isDense: true,
            filled: true,
            fillColor: const Color(0xFFFAFBFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Zenith.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Zenith.border),
            ),
          ),
        ),
      ],
    );
  }
}
