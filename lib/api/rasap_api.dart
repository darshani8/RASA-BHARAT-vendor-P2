import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final String message;
  final int? status;
  final String? code;
  ApiException(this.message, [this.status, this.code]);
  @override
  String toString() => message;
}

/// One keyset page from a backend list endpoint: the rows plus the opaque cursor for the next
/// page (`null` when there are no more rows). Mirrors `{ data, page: { limit, nextCursor } }`.
class Page {
  final List items;
  final String? nextCursor;
  const Page(this.items, this.nextCursor);
  bool get hasMore => nextCursor != null;
}

/// RASAP2 vendor API client. Mirrors the contract in backend/src (app.ts mounts under /api/v1).
/// Base URL is the server ORIGIN (e.g. http://localhost:3000); this client adds /api/v1.
class RasapApi {
  RasapApi._();
  static final RasapApi instance = RasapApi._();
  static const _prefix = '/api/v1';
  late SharedPreferences _p;

  /// Bumped on every session change (login / silent refresh / logout) so the realtime client can
  /// reconnect its socket with the fresh access token. Avoids an api→realtime import cycle.
  final ValueNotifier<int> sessionEpoch = ValueNotifier<int>(0);

  Future<void> init() async {
    _p = await SharedPreferences.getInstance();
  }

  String get baseUrl => _p.getString('rasap2.apiBase') ?? '';
  set baseUrl(String v) =>
      _p.setString('rasap2.apiBase', v.trim().replaceAll(RegExp(r'/+$'), ''));
  String get token => _p.getString('rasap2.token') ?? '';
  String get refreshToken => _p.getString('rasap2.refresh') ?? '';
  String get vendorId => _p.getString('rasap2.vendorId') ?? '';
  String get vendorPhone => _p.getString('rasap2.vendorPhone') ?? '';
  bool get isAuthed => token.isNotEmpty && vendorId.isNotEmpty;

  Future<void> _saveSession(Map s) async {
    if (s['token'] != null) await _p.setString('rasap2.token', '${s['token']}');
    if (s['refreshToken'] != null) await _p.setString('rasap2.refresh', '${s['refreshToken']}');
    if (s['vendorId'] != null) await _p.setString('rasap2.vendorId', '${s['vendorId']}');
    sessionEpoch.value++;
  }

  Future<void> logout() async {
    await _p.remove('rasap2.token');
    await _p.remove('rasap2.refresh');
    await _p.remove('rasap2.vendorId');
    await _p.remove('rasap2.vendorPhone');
    sessionEpoch.value++;
  }

  Uri _uri(String path, {bool prefixed = true, Map<String, String>? query}) {
    final u = Uri.parse('$baseUrl${prefixed ? _prefix : ''}$path');
    return query == null ? u : u.replace(queryParameters: {...u.queryParameters, ...query});
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Object? body,
    bool auth = true,
    bool prefixed = true,
    Map<String, String>? query,
    bool retryOn401 = true,
  }) async {
    if (baseUrl.isEmpty) throw ApiException('No API base URL configured');
    final headers = <String, String>{};
    if (body != null) headers['Content-Type'] = 'application/json';
    if (auth && token.isNotEmpty) headers['Authorization'] = 'Bearer $token';
    http.Response res;
    try {
      final req = http.Request(method, _uri(path, prefixed: prefixed, query: query))
        ..headers.addAll(headers);
      if (body != null) req.body = jsonEncode(body);
      res = await http.Response.fromStream(await req.send());
    } catch (_) {
      throw ApiException('Network error — is the backend running and CORS-enabled for this origin?');
    }
    // Access token expired/revoked → try ONE silent refresh, then replay the request once.
    if (res.statusCode == 401 && auth && retryOn401 && refreshToken.isNotEmpty) {
      if (await _tryRefresh()) {
        return _send(method, path,
            body: body, auth: auth, prefixed: prefixed, query: query, retryOn401: false);
      }
    }
    dynamic json;
    try {
      json = res.body.isEmpty ? null : jsonDecode(res.body);
    } catch (_) {
      json = res.body;
    }
    if (res.statusCode >= 400) {
      final err = (json is Map && json['error'] is Map) ? json['error'] as Map : null;
      throw ApiException(
        err?['message']?.toString() ?? 'HTTP ${res.statusCode}',
        res.statusCode,
        err?['code']?.toString(),
      );
    }
    return json;
  }

  // Rotate the access token with the stored refresh token (backend rotates the refresh token too).
  Future<bool> _tryRefresh() async {
    final rt = refreshToken;
    if (rt.isEmpty) return false;
    try {
      final s = await _send('POST', '/vendors/refresh',
          auth: false, body: {'refreshToken': rt}, retryOn401: false) as Map;
      await _saveSession(s);
      return s['token'] != null;
    } catch (_) {
      return false;
    }
  }

  // health (server root, no auth, no /api/v1 prefix)
  Future<Map> health() async => await _send('GET', '/health', auth: false, prefixed: false) as Map;
  Future<Map> ready() async => await _send('GET', '/ready', auth: false, prefixed: false) as Map;

  // auth — POST /api/v1/vendors/login → { token, expiresIn, refreshToken, vendorId }
  Future<void> login(String phone, String password) async {
    final s = await _send('POST', '/vendors/login',
        auth: false, body: {'phone': phone, 'password': password}) as Map;
    await _saveSession(s);
    await _p.setString('rasap2.vendorPhone', phone);
  }

  // shop open/close — GET /vendors/:id returns the Vendor with the `acceptingOrders` boolean.
  Future<bool> getAccepting() async {
    final v = await _send('GET', '/vendors/$vendorId') as Map;
    return v['acceptingOrders'] == true;
  }

  Future<void> setAccepting(bool v) async =>
      _send('PATCH', '/vendors/$vendorId/accepting-orders', body: {'accepting': v});

  // KDS board (active orders by ready-time). vendorId is taken from the token server-side — the
  // endpoint accepts only { limit?, cursor? }. → { data, page:{ limit, nextCursor } }
  Future<Page> board({int limit = 50, String? cursor}) async {
    final r = await _send('GET', '/vendor/board',
        query: {'limit': '$limit', if (cursor != null) 'cursor': cursor}) as Map;
    return _page(r);
  }

  // incoming orders (vendor token scopes to own vendor). status ∈
  // created|paid|ready|collected|completed|cancelled. → { data, page }
  Future<Page> orders({String? status, int limit = 50, String? cursor}) async {
    final r = await _send('GET', '/vendors/me/orders', query: {
      'limit': '$limit',
      if (status != null) 'status': status,
      if (cursor != null) 'cursor': cursor,
    }) as Map;
    return _page(r);
  }

  Page _page(Map r) {
    final data = (r['data'] as List?) ?? const [];
    final pg = r['page'];
    final next = pg is Map ? pg['nextCursor'] as String? : null;
    return Page(data, next);
  }

  Future<void> markReady(String id) async => _send('POST', '/orders/$id/ready');
  Future<void> markComplete(String id) async => _send('POST', '/orders/$id/complete');
  Future<void> reject(String id) async => _send('POST', '/orders/$id/reject');

  Future<String?> advanceQueue() async {
    final r = await _send('POST', '/queue/advance', query: {'vendor_id': vendorId}) as Map;
    return r['nowServingOrderId'] as String?;
  }

  // menu (vendor-owned). Prices are POSITIVE integer paise as STRINGS.
  // availableOnly=false asks the backend for ALL items (incl. sold-out) for the management view —
  // uses the owner-scoped `available_only=false` query the backend menu endpoint supports.
  Future<List> listMenu({bool availableOnly = false}) async {
    final r = await _send('GET', '/menu',
        query: {'vendor_id': vendorId, 'available_only': '$availableOnly'}) as Map;
    return (r['items'] as List?) ?? const [];
  }

  Future<Map> createMenuItem({
    required String name,
    required String pricePaise,
    int? prepMinutes,
    bool? isAvailable,
  }) async =>
      await _send('POST', '/menu', body: {
        'vendorId': vendorId,
        'name': name,
        'pricePaise': pricePaise,
        if (prepMinutes != null) 'prepMinutes': prepMinutes,
        if (isAvailable != null) 'isAvailable': isAvailable,
      }) as Map;

  Future<Map> updateMenuItem(String id, Map<String, dynamic> patch) async =>
      await _send('PUT', '/menu/$id', body: patch) as Map;

  // DELETE returns 204 No Content (empty body) — _send tolerates the empty body.
  Future<void> deleteMenuItem(String id) async => _send('DELETE', '/menu/$id');

  // daily analytics for one UTC day (YYYY-MM-DD) → { orderCount, grossRevenuePaise, hourly[] }
  Future<Map> analytics(String date) async =>
      await _send('GET', '/vendor/analytics', query: {'date': date}) as Map;

  static String paiseToRupees(dynamic paise) {
    final n = int.tryParse('${paise ?? 0}') ?? 0;
    return '₹${(n / 100).toStringAsFixed(2)}';
  }
}
