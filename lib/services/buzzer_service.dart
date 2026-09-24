import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/buzzer_result_model.dart';

class BuzzerService {
  /// Dispatches a buzzer press to the server.
  ///
  /// Note: We NEVER decide the winner on the client.
  /// The client only transmits the request and returns the server's authoritative result.
  static Future<BuzzerResultModel> buzz({
    required io.Socket socket,
    required String roomId,
    required String participantId,
    required int round,
  }) {
    final completer = Completer<BuzzerResultModel>();

    socket.emitWithAck(
      'buzz',
      {
        'roomId': roomId.toUpperCase(),
        'participantId': participantId,
        'round': round,
      },
      ack: (data) {
        if (data is Map) {
          final result = BuzzerResultModel.fromJson(Map<String, dynamic>.from(data));
          completer.complete(result);
        } else {
          completer.complete(
            const BuzzerResultModel(
              status: BuzzerStatus.error,
              message: 'Invalid server response.',
            ),
          );
        }
      },
    );

    // Timeout safety net
    return completer.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () => const BuzzerResultModel(
        status: BuzzerStatus.error,
        message: 'Connection problem. Waiting for server...',
      ),
    );
  }
}
