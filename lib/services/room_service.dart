import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/room_model.dart';
import '../models/buzzer_result_model.dart';
import '../utils/constants.dart';
import 'socket_service.dart';

class RoomService extends ChangeNotifier {
  final SocketService _socketService;

  RoomModel? _room;
  String? _adminToken;
  String? _currentParticipantId;
  String? _currentParticipantName;
  bool _isAdmin = false;
  bool _isRoomEnded = false;
  String? _hostStatusMessage;
  String? _errorMessage;
  bool _isLoading = false;
  bool _hasBuzzedThisRound = false;
  BuzzerResultModel _lastBuzzerResult = BuzzerResultModel.idle;

  // Rejoin session state
  String? _lastJoinedRoomId;
  String? _lastJoinedName;
  String? _lastJoinedParticipantId;

  // Getters
  RoomModel? get room => _room;
  String? get adminToken => _adminToken;
  String? get currentParticipantId => _currentParticipantId;
  String? get currentParticipantName => _currentParticipantName;
  bool get isAdmin => _isAdmin;
  bool get isRoomEnded => _isRoomEnded;
  String? get hostStatusMessage => _hostStatusMessage;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get hasBuzzedThisRound => _hasBuzzedThisRound;
  BuzzerResultModel get lastBuzzerResult => _lastBuzzerResult;
  List<BuzzEntryModel> get buzzQueue => _room?.buzzQueue ?? [];

  // Rejoin getters
  String? get lastJoinedRoomId => _lastJoinedRoomId;
  String? get lastJoinedName => _lastJoinedName;
  String? get lastJoinedParticipantId => _lastJoinedParticipantId;
  bool get canRejoin =>
      _room == null &&
      _lastJoinedRoomId != null &&
      _lastJoinedRoomId!.isNotEmpty &&
      _lastJoinedName != null &&
      _lastJoinedName!.isNotEmpty;

  int? get myBuzzRank {
    if (_currentParticipantId == null || _room == null) return null;
    for (final entry in _room!.buzzQueue) {
      if (entry.participantId == _currentParticipantId) {
        return entry.rank;
      }
    }
    return null;
  }

  BuzzEntryModel? get myBuzzEntry {
    if (_currentParticipantId == null || _room == null) return null;
    for (final entry in _room!.buzzQueue) {
      if (entry.participantId == _currentParticipantId) {
        return entry;
      }
    }
    return null;
  }

  ConnectionStateStatus _lastKnownStatus = ConnectionStateStatus.disconnected;

  RoomService(this._socketService) {
    _loadSavedSession();
    _socketService.addListener(_onSocketStateChanged);
    _setupSocketListeners();
  }

  Future<void> _loadSavedSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _lastJoinedRoomId = prefs.getString('rejoin_room_id');
      _lastJoinedName = prefs.getString('rejoin_participant_name');
      _lastJoinedParticipantId = prefs.getString('rejoin_participant_id');
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _saveRecentSession(String roomId, String name, String? partId) async {
    _lastJoinedRoomId = roomId;
    _lastJoinedName = name;
    _lastJoinedParticipantId = partId;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('rejoin_room_id', roomId);
      await prefs.setString('rejoin_participant_name', name);
      if (partId != null) {
        await prefs.setString('rejoin_participant_id', partId);
      }
    } catch (_) {}
  }

  Future<void> clearSavedSession() async {
    _lastJoinedRoomId = null;
    _lastJoinedName = null;
    _lastJoinedParticipantId = null;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('rejoin_room_id');
      await prefs.remove('rejoin_participant_name');
      await prefs.remove('rejoin_participant_id');
    } catch (_) {}
  }

  void _onSocketStateChanged() {
    final newStatus = _socketService.status;
    if (newStatus == _lastKnownStatus) {
      return; // Ignore ping/latency measurement ticks to avoid tearing down listeners & spamming reconnect_session
    }

    final wasDisconnected = _lastKnownStatus != ConnectionStateStatus.connected;
    _lastKnownStatus = newStatus;

    if (newStatus == ConnectionStateStatus.connected) {
      _setupSocketListeners();
      if (wasDisconnected) {
        _attemptSessionRestore();
      }
    }
    notifyListeners();
  }

  void _setupSocketListeners() {
    final socket = _socketService.socket;
    if (socket == null) return;

    // Remove existing to avoid duplicate triggers
    socket.off('room_updated');
    socket.off('round_started');
    socket.off('round_reset');
    socket.off('buzzer_reset');
    socket.off('buzz_queue_updated');
    socket.off('round_locked');
    socket.off('winner_declared');
    socket.off('host_disconnected');
    socket.off('host_reconnected');
    socket.off('room_ended');

    // 1. Room state updated
    socket.on('room_updated', (data) {
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
        _syncMyBuzzStatus();
        notifyListeners();
      }
    });

    // 1b. Buzz queue updated in real-time
    socket.on('buzz_queue_updated', (data) {
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
        _syncMyBuzzStatus();
        notifyListeners();
      }
    });

    // 2. Round started
    socket.on('round_started', (data) {
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
        _hasBuzzedThisRound = false;
        _lastBuzzerResult = BuzzerResultModel.idle;
        notifyListeners();
      }
    });

    // 3. Round reset
    socket.on('round_reset', (data) {
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
        _hasBuzzedThisRound = false;
        _lastBuzzerResult = BuzzerResultModel.idle;
        notifyListeners();
      }
    });

    // 3b. Buzzer reset (same round re-enabled)
    socket.on('buzzer_reset', (data) {
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
        _hasBuzzedThisRound = false;
        _lastBuzzerResult = BuzzerResultModel.idle;
        notifyListeners();
      }
    });

    // 4. Winner declared
    socket.on('winner_declared', (data) {
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
        notifyListeners();
      }
    });

    // 5. Round locked
    socket.on('round_locked', (data) {
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
      }
      notifyListeners();
    });

    // 6. Host disconnected
    socket.on('host_disconnected', (data) {
      _hostStatusMessage = 'Host disconnected. Waiting for reconnection...';
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
      }
      notifyListeners();
    });

    // 7. Host reconnected
    socket.on('host_reconnected', (data) {
      _hostStatusMessage = null;
      if (data is Map && data['room'] != null) {
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
      }
      notifyListeners();
    });

    // 8. Room ended
    socket.on('room_ended', (_) {
      _isRoomEnded = true;
      notifyListeners();
    });
  }

  void _syncMyBuzzStatus() {
    if (_currentParticipantId != null && _room != null) {
      final found = _room!.buzzQueue.any((b) => b.participantId == _currentParticipantId);
      if (found) {
        _hasBuzzedThisRound = true;
      }
    }
  }

  void _attemptSessionRestore() {
    if (_room == null) return;
    final socket = _socketService.socket;
    if (socket == null) return;

    if (_isAdmin && _adminToken != null) {
      socket.emit('reconnect_session', {
        'roomId': _room!.roomId,
        'role': 'admin',
        'adminToken': _adminToken,
      });
    } else if (!_isAdmin && _currentParticipantId != null) {
      socket.emit('reconnect_session', {
        'roomId': _room!.roomId,
        'role': 'participant',
        'participantId': _currentParticipantId,
        'name': _currentParticipantName,
      });
    }
  }

  /// Creates a room and registers the caller as Admin
  Future<bool> createRoom() async {
    _isLoading = true;
    _errorMessage = null;
    _isRoomEnded = false;
    notifyListeners();

    if (!_socketService.isConnected) {
      _socketService.connect();
      // Wait briefly for connection
      await Future.delayed(const Duration(milliseconds: 500));
    }

    final socket = _socketService.socket;
    if (socket == null || !socket.connected) {
      _isLoading = false;
      _errorMessage = 'Could not establish connection to the server.';
      notifyListeners();
      return false;
    }

    final completer = Completer<bool>();

    socket.emitWithAck('create_room', {}, ack: (data) {
      _isLoading = false;
      if (data is Map && data['success'] == true) {
        _adminToken = data['adminToken'] as String?;
        _isAdmin = true;
        _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
        _errorMessage = null;
        notifyListeners();
        completer.complete(true);
      } else {
        _errorMessage = (data is Map ? data['error'] : 'Failed to create room') ?? 'Unknown error';
        notifyListeners();
        completer.complete(false);
      }
    });

    return completer.future.timeout(
      const Duration(seconds: 6),
      onTimeout: () {
        _isLoading = false;
        _errorMessage = 'Server timed out creating room.';
        notifyListeners();
        return false;
      },
    );
  }

  /// Joins the default PINPOINT game arena directly
  Future<bool> joinDefaultRoom(String name, {String? participantId}) async {
    return joinRoom(AppConstants.defaultRoomId, name, participantId: participantId);
  }

  /// Joins a room as a participant (or rejoins)
  Future<bool> joinRoom(String? roomId, String name, {String? participantId}) async {
    final effectiveRoomId = (roomId != null && roomId.trim().isNotEmpty)
        ? roomId.trim().toUpperCase()
        : AppConstants.defaultRoomId;
    final trimmedName = name.trim();

    if (trimmedName.isEmpty) {
      _errorMessage = 'Please enter your Team Name.';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    _isRoomEnded = false;
    notifyListeners();

    if (!_socketService.isConnected) {
      _socketService.connect();
      // Wait actively up to 5 seconds for connection to establish
      final waitLimit = DateTime.now().add(const Duration(seconds: 5));
      while (!_socketService.isConnected && DateTime.now().isBefore(waitLimit)) {
        await Future.delayed(const Duration(milliseconds: 150));
      }
    }

    final socket = _socketService.socket;
    if (socket == null || !socket.connected) {
      _isLoading = false;
      _errorMessage =
          'Cannot reach buzzer server at ${_socketService.serverUrl}. Please check Wi-Fi / connection.';
      notifyListeners();
      return false;
    }

    final targetPartId = participantId ??
        (_lastJoinedRoomId == effectiveRoomId &&
                _lastJoinedName?.toLowerCase() == trimmedName.toLowerCase()
            ? _lastJoinedParticipantId
            : null);

    final completer = Completer<bool>();

    final payload = <String, dynamic>{
      'roomId': effectiveRoomId,
      'name': trimmedName,
    };
    if (targetPartId != null && targetPartId.isNotEmpty) {
      payload['participantId'] = targetPartId;
    }

    socket.emitWithAck(
      'join_room',
      payload,
      ack: (data) async {
        _isLoading = false;
        if (data is Map && data['success'] == true) {
          _isAdmin = false;
          _adminToken = null;
          final partData = data['participant'] as Map?;
          if (partData != null) {
            _currentParticipantId = partData['participantId'] as String?;
            _currentParticipantName = partData['name'] as String?;
          }
          _room = RoomModel.fromJson(Map<String, dynamic>.from(data['room']));
          _hasBuzzedThisRound = false;
          _lastBuzzerResult = BuzzerResultModel.idle;
          _errorMessage = null;

          // Save recent session for instant Rejoin
          await _saveRecentSession(
            effectiveRoomId,
            _currentParticipantName ?? trimmedName,
            _currentParticipantId,
          );

          notifyListeners();
          completer.complete(true);
        } else {
          _errorMessage = (data is Map ? data['error'] : 'Failed to join room') ?? 'Failed to join room';
          notifyListeners();
          completer.complete(false);
        }
      },
    );

    return completer.future.timeout(
      const Duration(seconds: 6),
      onTimeout: () {
        _isLoading = false;
        _errorMessage = 'Server timed out connecting to room.';
        notifyListeners();
        return false;
      },
    );
  }

  /// Re-joins the most recently joined room session
  Future<bool> rejoinLastRoom() async {
    if (!canRejoin) return false;
    return await joinRoom(
      _lastJoinedRoomId!,
      _lastJoinedName!,
      participantId: _lastJoinedParticipantId,
    );
  }

  /// Start round (Admin only)
  Future<void> startRound() async {
    if (!_isAdmin || _adminToken == null || _room == null) return;
    final socket = _socketService.socket;
    if (socket == null) return;

    socket.emit('start_round', {
      'roomId': _room!.roomId,
      'adminToken': _adminToken,
    });
  }

  /// Reset round (Admin only)
  Future<void> resetRound() async {
    if (!_isAdmin || _adminToken == null || _room == null) return;
    final socket = _socketService.socket;
    if (socket == null) return;

    socket.emit('reset_round', {
      'roomId': _room!.roomId,
      'adminToken': _adminToken,
    });
  }

  /// Reset buzzer in the same round (Admin only)
  Future<void> resetBuzzer() async {
    if (!_isAdmin || _adminToken == null || _room == null) return;
    final socket = _socketService.socket;
    if (socket == null) return;

    socket.emit('reset_buzzer', {
      'roomId': _room!.roomId,
      'adminToken': _adminToken,
    });
  }

  /// Locks buzzer for the current round (Admin only)
  Future<void> lockRound() async {
    if (!_isAdmin || _adminToken == null || _room == null) return;
    final socket = _socketService.socket;
    if (socket == null) return;

    socket.emit('lock_round', {
      'roomId': _room!.roomId,
      'adminToken': _adminToken,
    });
  }

  /// End room (Admin only)
  Future<void> endRoom() async {
    if (!_isAdmin || _adminToken == null || _room == null) return;
    final socket = _socketService.socket;
    if (socket == null) return;

    socket.emit('end_room', {
      'roomId': _room!.roomId,
      'adminToken': _adminToken,
    });
    leaveRoom();
  }

  /// Sends an ultra-low latency buzz request directly over the open WebSocket
  void buzz() {
    if (_room == null || _currentParticipantId == null || _hasBuzzedThisRound) return;
    if (!_room!.isActive) return;

    final socket = _socketService.socket;
    if (socket == null || !socket.connected) {
      _lastBuzzerResult = const BuzzerResultModel(
        status: BuzzerStatus.error,
        message: 'Connection problem. Waiting for server...',
      );
      notifyListeners();
      return;
    }

    // 1. Instant 0ms visual feedback: prevent multiple taps and update UI immediately
    _hasBuzzedThisRound = true;
    notifyListeners();

    // 2. Direct emit over the open persistent socket with immediate ack callback (no Completer/Future.timeout overhead)
    socket.emitWithAck(
      'buzz',
      {
        'roomId': _room!.roomId,
        'participantId': _currentParticipantId!,
        'round': _room!.currentRound,
      },
      ack: (data) {
        if (data is Map) {
          _lastBuzzerResult = BuzzerResultModel.fromJson(Map<String, dynamic>.from(data));
        } else {
          _lastBuzzerResult = const BuzzerResultModel(
            status: BuzzerStatus.error,
            message: 'Invalid server response.',
          );
        }
        notifyListeners();
      },
    );
  }

  /// Clear active room state and leave
  void leaveRoom() {
    if (_room != null && _currentParticipantId != null) {
      _socketService.socket?.emit('leave_room', {
        'roomId': _room!.roomId,
        'participantId': _currentParticipantId,
      });
    }
    _room = null;
    _adminToken = null;
    _currentParticipantId = null;
    _currentParticipantName = null;
    _isAdmin = false;
    _isRoomEnded = false;
    _hostStatusMessage = null;
    _errorMessage = null;
    _hasBuzzedThisRound = false;
    _lastBuzzerResult = BuzzerResultModel.idle;
    notifyListeners();
  }

  @override
  void dispose() {
    _socketService.removeListener(_onSocketStateChanged);
    super.dispose();
  }
}
