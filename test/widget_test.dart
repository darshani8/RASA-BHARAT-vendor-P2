import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rasap2_vendor/api/rasap_api.dart';
import 'package:rasap2_vendor/theme.dart';
import 'package:rasap2_vendor/widgets.dart';

void main() {
  test('paiseToRupees formats integer paise strings as rupees', () {
    expect(RasapApi.paiseToRupees('12000'), '₹120.00');
    expect(RasapApi.paiseToRupees(0), '₹0.00');
    expect(RasapApi.paiseToRupees(null), '₹0.00');
  });

  test('PageResult.hasMore reflects a non-null cursor', () {
    expect(const PageResult([], null).hasMore, isFalse);
    expect(const PageResult(<dynamic>[], 'cursor-token').hasMore, isTrue);
  });

  test('statusStyle maps known order states to their pill labels', () {
    expect(statusStyle('created').label, 'New');
    expect(statusStyle('paid').label, 'Paid');
    expect(statusStyle('ready').label, 'Ready');
    expect(statusStyle('collected').label, 'Collected');
    expect(statusStyle('completed').label, 'Completed');
    expect(statusStyle('cancelled').label, 'Cancelled');
  });

  testWidgets('statusPill renders the status label', (tester) async {
    await tester.pumpWidget(MaterialApp(home: Scaffold(body: statusPill('ready'))));
    expect(find.text('Ready'), findsOneWidget);
  });
}
