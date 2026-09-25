import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../utils/constants.dart';

enum ConnectionStateStatus {
  connected,
  connecting,
  disconnected,
}

class SocketService extends ChangeNotifier {
  io.Socket? _socket;
  ConnectionStateStatus _status = ConnectionStateStatus.disconnected;
  late String _serverUrl;
  bool _isInitialized = false;

  int? _latencyMs;
  Timer? _pingTimer;

  ConnectionStateStatus get status => _status;
  bool get isConnected => _status == ConnectionStateStatus.connected;
  io.Socket? get socket => _socket;
  String get serverUrl => _serverUrl;
  bool get isInitialized => _isInitialized;
  int? get latencyMs => _latencyMs;

  static String get initialServerUrl {
    if (kIsWeb) {
      final origin = Uri.base.origin;
      // If running on local web dev with a random debug port (e.g. localhost:54321), target backend on 3000
      if ((origin.contains('localhost:') || origin.contains('127.0.0.1:')) &&
          !origin.endsWith(':3000')) {
        return 'http://localhost:3000';
      }
      // For all other web scenarios (e.g. http://10.14.241.188:3000, https://*.trycloudflare.com, etc.):
      // The socket server is hosted right at the web app origin!
      return origin;
    }
    return AppConstants.defaultServerUrl;
  }

  SocketService() {
    _serverUrl = initialServerUrl;
    _initAndConnect();
  }

  static String formatUrl(String raw) {
    String formatted = raw.trim();
    if (formatted.isEmpty) return AppConstants.defaultServerUrl;
    if (formatted.startsWith('http://') || formatted.startsWith('https://')) {
      return formatted;
    }
    // If it's a domain name (contains . and no port under 1024 or letters like .com, .net, etc.)
    if (formatted.contains('.com') ||
        formatted.contains('.net') ||
        formatted.contains('.org') ||
        formatted.contains('.life') ||
        formatted.contains('.io') ||
        formatted.contains('serveo') ||
        formatted.contains('loca.lt')) {
      return 'https://$formatted';
    }
    return 'http://$formatted';
  }

  int _consecutiveErrors = 0;

  Future<void> _initAndConnect() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedUrl = prefs.getString('custom_server_url');

      if (kIsWeb) {
        final origin = Uri.base.origin;
        // On local debug port (e.g. Flutter Chrome on 50000+), target localhost:3000
        if ((origin.contains('localhost:') || origin.contains('127.0.0.1:')) &&
            !origin.endsWith(':3000')) {
          _serverUrl = 'http://localhost:3000';
        } else {
          // On student mobile phones and any device opening http://10.14.241.188:3000 or tunnel:
          // Always use origin directly so student connects to host, not their own phone!
          _serverUrl = origin;
        }

        // Clean up stale trycloudflare URLs from browser storage if different from current origin
        if (savedUrl != null &&
            savedUrl.contains('trycloudflare.com') &&
            !origin.contains(savedUrl)) {
          await prefs.remove('custom_server_url');
        }
      } else {
        // Native mobile app / desktop app
        // Use the appropriate default URL (localhost for desktop, tunnel for mobile)
        _serverUrl = AppConstants.defaultServerUrl;
        
        // Clear any stale cached URLs (old tunnels, local IPs) if it differs from current default
        if (savedUrl != null && savedUrl != _serverUrl) {
          await prefs.setString('custom_server_url', _serverUrl);
          if (kDebugMode) {
            print('🧹 Cleared stale cached URL: $savedUrl → $_serverUrl');
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error reading saved server URL: $e');
      }
    }
    _isInitialized = true;
    connect();
  }

  Future<void> updateServerUrl(String newUrl) async {
    final formatted = formatUrl(newUrl);
    if (formatted == _serverUrl && _socket != null && _socket!.connected) {
      return;
    }

    final oldUrl = _serverUrl;
    _serverUrl = formatted;

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('custom_server_url', formatted);
    } catch (e) {
      if (kDebugMode) {
        print('Error saving server URL: $e');
      }
    }

    if (kDebugMode) {
      print('🔄 Switching server from $oldUrl to $formatted');
    }

    if (_socket != null) {
      _socket!.off('disconnect');
      disconnect();
    }
    connect();
  }

  Future<void> resetToDefault() async {
    _serverUrl = AppConstants.defaultServerUrl;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('custom_server_url');
    } catch (_) {}

    disconnect();
    connect();
  }

  Future<bool> testConnection(String testUrl) async {
    final formatted = formatUrl(testUrl);
    final completer = Completer<bool>();

    try {
      final testSocket = io.io(
        formatted,
        io.OptionBuilder()
            .disableAutoConnect()
            .setReconnectionAttempts(0)
            .build(),
      );

      testSocket.onConnect((_) {
        testSocket.disconnect();
        testSocket.dispose();
        if (!completer.isCompleted) completer.complete(true);
      });

      testSocket.onConnectError((_) {
        testSocket.disconnect();
        testSocket.dispose();
        if (!completer.isCompleted) completer.complete(false);
      });

      testSocket.connect();

      return await completer.future.timeout(
        const Duration(seconds: 4),
        onTimeout: () {
          testSocket.disconnect();
          testSocket.dispose();
          return false;
        },
      );
    } catch (_) {
      return false;
    }
  }

  void _startPingMeasurement() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_socket != null && _socket!.connected) {
        final sendTime = DateTime.now().millisecondsSinceEpoch;
        _socket!.emitWithAck('latency_ping', sendTime, ack: (response) {
          final rtt = DateTime.now().millisecondsSinceEpoch - sendTime;
          _latencyMs = rtt;
          notifyListeners();
        });
      }
    });
  }

  void connect() {
    if (_socket != null) {
      if (_socket!.connected) {
        return;
      }
      _status = ConnectionStateStatus.connecting;
      notifyListeners();
      _socket!.connect();
      return;
    }

    _status = ConnectionStateStatus.connecting;
    notifyListeners();

    // Pure persistent WebSocket: zero HTTP polling, zero xhr poll error, zero reconnect loop
    _socket = io.io(
      _serverUrl,
      io.OptionBuilder()
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(999999)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(3000)
          .build(),
    );

    final socketTargetUrl = _serverUrl;

    _socket!.onConnect((_) {
      _consecutiveErrors = 0;
      if (kDebugMode) {
        print('✅ Connected to server: $socketTargetUrl');
      }
      _status = ConnectionStateStatus.connected;
      _startPingMeasurement();
      notifyListeners();
    });

    _socket!.on('latency_pong', (data) {
      if (data is Map && data['clientTimestamp'] is int) {
        final sendTime = data['clientTimestamp'] as int;
        _latencyMs = DateTime.now().millisecondsSinceEpoch - sendTime;
        notifyListeners();
      }
    });

    _socket!.onDisconnect((_) {
      if (kDebugMode) {
        print('❌ Disconnected from server: $socketTargetUrl');
      }
      _status = ConnectionStateStatus.disconnected;
      _latencyMs = null;
      _pingTimer?.cancel();
      notifyListeners();
    });

    _socket!.onConnectError((err) {
      _consecutiveErrors++;
      if (kDebugMode) {
        print('⚠️ Connect error for $socketTargetUrl: $err');
      }
      _status = ConnectionStateStatus.disconnected;
      _latencyMs = null;
      _pingTimer?.cancel();
      notifyListeners();

      // Always retry the public tunnel URL — NEVER fall back to local/private IPs
      if (_consecutiveErrors >= 5) {
        _consecutiveErrors = 0;
        if (_serverUrl != AppConstants.defaultPublicTunnelUrl && !kIsWeb) {
          if (kDebugMode) {
            print('🚨 Server $socketTargetUrl failed. Reverting to public tunnel: ${AppConstants.defaultPublicTunnelUrl}');
          }
          updateServerUrl(AppConstants.defaultPublicTunnelUrl);
        } else {
          if (kDebugMode) {
            print('🔄 Retrying public tunnel connection...');
          }
        }
      }
    });

    _socket!.onReconnectAttempt((_) {
      _status = ConnectionStateStatus.connecting;
      notifyListeners();
    });
  }

  void disconnect() {
    _pingTimer?.cancel();
    _latencyMs = null;
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _status = ConnectionStateStatus.disconnected;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _pingTimer?.cancel();
    disconnect();
    super.dispose();
  }
}
