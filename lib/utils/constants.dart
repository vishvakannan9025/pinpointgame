import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class AppConstants {
  // App Title
  static const String appTitle = 'PinPoint Buzzer';

  // Server URLs & Default Arena
  static const String defaultRoomId = 'PINPOINT';
  static const String defaultPublicTunnelUrl =
      'https://games-next-forest-forests.trycloudflare.com';
  static const String defaultLocalWifiUrl = 'http://10.14.241.188:3000';
  static const String defaultLocalhostUrl = 'http://127.0.0.1:3000';

  // Server URL
  // The user requested to ONLY use the Cloudflare tunnel.
  // We explicitly append :443 to prevent the Dart socket_io_client bug
  // where it attempts to upgrade to WSS on port 0.
  static String get defaultServerUrl {
    if (defaultPublicTunnelUrl.startsWith('https://') && !defaultPublicTunnelUrl.contains(':443')) {
      return '$defaultPublicTunnelUrl:443';
    }
    return defaultPublicTunnelUrl;
  }

  // Visual Palette
  static const Color primaryDark = Color(0xFF0F172A); // Slate 900
  static const Color surfaceDark = Color(0xFF1E293B); // Slate 800
  static const Color cardDark = Color(0xFF243147); // Slate 750
  static const Color accentPurple = Color(0xFF6366F1); // Indigo 500
  static const Color accentBlue = Color(0xFF38BDF8); // Sky 400

  // Status Colors
  static const Color buzzerRed = Color(0xFFEF4444); // Red 500
  static const Color buzzerRedPressed = Color(0xFFDC2626); // Red 600
  static const Color buzzerGlow = Color(0xFFFF4D4D);
  static const Color buzzerDisabled = Color(0xFF475569); // Slate 600

  static const Color statusGreen = Color(0xFF10B981); // Emerald 500
  static const Color statusAmber = Color(0xFFF59E0B); // Amber 500
  static const Color statusRed = Color(0xFFEF4444); // Red 500
  static const Color winnerGold = Color(0xFFFBBF24); // Amber 400
  static const Color winnerGoldLight = Color(0xFFFDE68A); // Amber 200

  // Animation Durations
  static const Duration quickAnimation = Duration(milliseconds: 150);
  static const Duration normalAnimation = Duration(milliseconds: 300);
}
