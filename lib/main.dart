import 'package:flutter/material.dart';
import 'theme.dart';
import 'api/rasap_api.dart';
import 'ui/app_shell.dart';
import 'screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await RasapApi.instance.init();
  runApp(const RasapVendorApp());
}

class RasapVendorApp extends StatelessWidget {
  const RasapVendorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zenith Retail Cloud — Vendor',
      debugShowCheckedModeBanner: false,
      theme: Zenith.theme(),
      home: RasapApi.instance.isAuthed ? const AppShell() : const LoginScreen(),
    );
  }
}
