import 'package:flutter/material.dart';
import 'theme.dart';
import 'api/rasap_api.dart';
import 'screens/login_screen.dart';
import 'screens/home_shell.dart';

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
      title: 'RASAP2 Vendor',
      debugShowCheckedModeBanner: false,
      theme: Zenith.theme(),
      home: RasapApi.instance.isAuthed ? const HomeShell() : const LoginScreen(),
    );
  }
}
