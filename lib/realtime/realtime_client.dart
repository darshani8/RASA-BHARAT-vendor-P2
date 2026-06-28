import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api/rasap_api.dart';

/// Socket.IO client for the RASAP2 realtime gateway (backend `realtime/` module, socket.io v4).
///
/// The gateway authenticates the handshake with the access token (`socket.handshake.auth.token`)
/// and, on connect, auto-joins a vendor socket to its `vendor:{vendorId}` room. So this client
/// just connects with the token and listens — every order-lifecycle event for the vendor's own
/// orders arrives without an explicit subscribe. Events are surfaced as monotonically increasing
/// "ticks" that screens listen to in order to reload.
class RealtimeClient {
  RealtimeClient._();
  static final RealtimeClient instance = RealtimeClient._();

  io.Socket? _socket;
  String _connectedToken = '';
  bool _attached = false;

  /// Bumped whenever an order-lifecycle event arrives (the board / orders lists should reload).
  final ValueNotifier<int> orderTick = ValueNotifier<int>(0);

  /// Bumped whenever a menu-availability event arrives (the menu list should reload).
  final ValueNotifier<int> menuTick = ValueNotifier<int>(0);

  /// Live connection state, for a status indicator.
  final ValueNotifier<bool> connected = ValueNotifier<bool>(false);

  // Order-lifecycle events the backend broadcasts to the vendor room (container.ts wiring).
  static const _orderEvents = <String>[
    'OrderCreated',
    'OrderPaid',
    'OrderReady',
    'OrderCompleted',
    'OrderCollected',
  ];

  /// Connect (idempotent). Also wires a one-time listener so a login / silent token refresh
  /// transparently reconnects the socket with the fresh token.
  void connect() {
    if (!_attached) {
      _attached = true;
      RasapApi.instance.sessionEpoch.addListener(_onSession);
    }
    _open();
  }

  void _onSession() {
    final api = RasapApi.instance;
    if (api.token.isEmpty) {
      disconnect(); // logged out
    } else if (api.token != _connectedToken) {
      _open(); // token rotated → reconnect with it
    }
  }

  void _open() {
    final api = RasapApi.instance;
    if (api.baseUrl.isEmpty || api.token.isEmpty) return;
    if (_socket != null && api.token == _connectedToken) return; // already on this token
    _teardownSocket();
    _connectedToken = api.token;
    final socket = io.io(
      api.baseUrl, // origin — Socket.IO connects on its default /socket.io path
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': api.token})
          .enableReconnection()
          .disableAutoConnect()
          .build(),
    );
    _socket = socket;
    socket.onConnect((_) => connected.value = true);
    socket.onDisconnect((_) => connected.value = false);
    socket.onConnectError((_) => connected.value = false);
    socket.onError((_) {});
    for (final event in _orderEvents) {
      socket.on(event, (_) => orderTick.value++);
    }
    socket.on('MenuItemAvailabilityChanged', (_) => menuTick.value++);
    socket.connect();
  }

  void disconnect() {
    _teardownSocket();
    _connectedToken = '';
    connected.value = false;
  }

  void _teardownSocket() {
    _socket?.dispose();
    _socket = null;
  }
}
