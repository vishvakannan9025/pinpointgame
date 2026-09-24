import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/socket_service.dart';
import '../utils/constants.dart';
import 'qr_connection_dialog.dart';

class ServerStatusBadge extends StatelessWidget {
  const ServerStatusBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final socketService = context.watch<SocketService>();
    final isConnected = socketService.isConnected;
    final isConnecting =
        socketService.status == ConnectionStateStatus.connecting;

    Color bg;
    Color border;
    Color dotColor;
    String label;
    IconData icon;

    if (isConnected) {
      final latency = socketService.latencyMs;
      final latencyStr = latency != null ? ' ($latency ms)' : '';
      bg = AppConstants.statusGreen.withValues(alpha: 0.12);
      border = AppConstants.statusGreen.withValues(alpha: 0.35);
      dotColor = AppConstants.statusGreen;
      label = '${_getFriendlyServerName(socketService.serverUrl)}$latencyStr';
      icon = Icons.bolt_rounded;
    } else if (isConnecting) {
      bg = AppConstants.statusAmber.withValues(alpha: 0.12);
      border = AppConstants.statusAmber.withValues(alpha: 0.35);
      dotColor = AppConstants.statusAmber;
      label = 'Connecting...';
      icon = Icons.sync_rounded;
    } else {
      bg = AppConstants.statusRed.withValues(alpha: 0.12);
      border = AppConstants.statusRed.withValues(alpha: 0.35);
      dotColor = AppConstants.statusRed;
      label = 'Offline (Tap to fix)';
      icon = Icons.wifi_off_rounded;
    }

    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () => showServerConfigDialog(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: dotColor,
                boxShadow: isConnected
                    ? [
                        BoxShadow(
                          color: dotColor.withValues(alpha: 0.6),
                          blurRadius: 4,
                          spreadRadius: 1,
                        ),
                      ]
                    : null,
              ),
            ),
            const SizedBox(width: 6),
            Icon(icon, size: 14, color: dotColor),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: dotColor,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.tune_rounded, size: 12, color: dotColor.withValues(alpha: 0.7)),
          ],
        ),
      ),
    );
  }

  String _getFriendlyServerName(String url) {
    if (url.contains('trycloudflare.com') || url.contains('loca.lt') || url.contains('lhr.life')) {
      return 'Internet (Public)';
    }
    if (url.contains('localhost') || url.contains('127.0.0.1')) {
      return 'Localhost';
    }
    return 'Wi-Fi Network';
  }
}

void showServerConfigDialog(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => const ServerConfigSheet(),
  );
}

class ServerConfigSheet extends StatefulWidget {
  const ServerConfigSheet({super.key});

  @override
  State<ServerConfigSheet> createState() => _ServerConfigSheetState();
}

class _ServerConfigSheetState extends State<ServerConfigSheet> {
  late TextEditingController _urlController;
  bool _isTesting = false;
  bool? _testSuccess;
  String? _testMessage;
  bool _showQrCode = true;

  @override
  void initState() {
    super.initState();
    final socketService = context.read<SocketService>();
    _urlController = TextEditingController(text: socketService.serverUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    setState(() {
      _isTesting = true;
      _testSuccess = null;
      _testMessage = 'Connecting to server...';
    });

    final socketService = context.read<SocketService>();
    final success = await socketService.testConnection(url);

    if (mounted) {
      setState(() {
        _isTesting = false;
        _testSuccess = success;
        _testMessage = success
            ? '✅ Connected successfully! Server is online.'
            : '❌ Could not reach server. Check the URL or tunnel.';
      });
    }
  }

  void _saveAndConnect() {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    final socketService = context.read<SocketService>();
    socketService.updateServerUrl(url);

    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppConstants.statusGreen,
        behavior: SnackBarBehavior.floating,
        content: Text('Connecting to: $url'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _applyPreset(String presetUrl) {
    setState(() {
      _urlController.text = presetUrl;
      _testSuccess = null;
      _testMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final currentUrl = _urlController.text.trim().isNotEmpty
        ? _urlController.text.trim()
        : AppConstants.defaultPublicTunnelUrl;

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppConstants.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppConstants.accentBlue.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.public_rounded,
                    color: AppConstants.accentBlue,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Server & Network Settings',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        'Connect teams via Same Wi-Fi or Internet Tunnel',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white60,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(
                    _showQrCode ? Icons.qr_code_2_rounded : Icons.qr_code_scanner_rounded,
                    color: AppConstants.accentBlue,
                  ),
                  tooltip: 'Toggle QR Code',
                  onPressed: () => setState(() => _showQrCode = !_showQrCode),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Live QR Code Preview Section
            if (_showQrCode) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppConstants.cardDark,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppConstants.accentBlue.withValues(alpha: 0.25),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.qr_code_rounded,
                            size: 16, color: AppConstants.accentBlue),
                        const SizedBox(width: 6),
                        const Text(
                          'SCAN TO CONNECT WITH PHONE',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                            color: AppConstants.accentBlue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: QrImageView(
                        data: currentUrl,
                        version: QrVersions.auto,
                        size: 140.0,
                        backgroundColor: Colors.white,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: Color(0xFF0F172A),
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    // URL below QR Code
                    Text(
                      currentUrl,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // URL input field
            const Text(
              'SERVER URL',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _urlController,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(
                color: Colors.white,
                fontFamily: 'monospace',
                fontSize: 13,
              ),
              decoration: InputDecoration(
                hintText: 'https://... or http://10.x.x.x:3000',
                hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.3),
                ),
                filled: true,
                fillColor: AppConstants.cardDark,
                prefixIcon: const Icon(
                  Icons.link_rounded,
                  color: AppConstants.accentBlue,
                  size: 20,
                ),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18, color: Colors.white54),
                  onPressed: () {
                    _urlController.clear();
                    setState(() {});
                  },
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Presets
            const Text(
              'SELECT NETWORK MODE (UPDATES QR CODE)',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 8),

            // 1. Local Wi-Fi Preset (Fastest for events)
            _buildPresetCard(
              icon: Icons.wifi_rounded,
              iconColor: AppConstants.statusGreen,
              title: 'Same Wi-Fi Network (Ultra-Fast: 1-5ms)',
              subtitle: '⚡ Instant response when all phones connect to the same router',
              url: AppConstants.defaultLocalWifiUrl,
              onTap: () => _applyPreset(AppConstants.defaultLocalWifiUrl),
              onQrTap: () => QrConnectionDialog.show(context,
                  initialUrl: AppConstants.defaultLocalWifiUrl),
            ),
            const SizedBox(height: 6),

            // 2. Localhost Preset (Fastest for testing)
            _buildPresetCard(
              icon: Icons.laptop_rounded,
              iconColor: AppConstants.accentBlue,
              title: 'Localhost (Instant: <1ms)',
              subtitle: '⚡ Direct on this computer (Coordinator & Browser testing)',
              url: AppConstants.defaultLocalhostUrl,
              onTap: () => _applyPreset(AppConstants.defaultLocalhostUrl),
              onQrTap: () => QrConnectionDialog.show(context,
                  initialUrl: AppConstants.defaultLocalhostUrl),
            ),
            const SizedBox(height: 6),

            // 3. Public Internet Preset (Remote only)
            _buildPresetCard(
              icon: Icons.cloud_done_rounded,
              iconColor: AppConstants.statusAmber,
              title: 'Public Internet Tunnel (Cloudflare)',
              subtitle: '🌐 Cross-network proxy for remote players on cellular 4G/5G',
              url: AppConstants.defaultPublicTunnelUrl,
              onTap: () => _applyPreset(AppConstants.defaultPublicTunnelUrl),
              onQrTap: () => QrConnectionDialog.show(context,
                  initialUrl: AppConstants.defaultPublicTunnelUrl),
            ),
            const SizedBox(height: 14),

            // Test Feedback
            if (_testMessage != null)
              Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: _testSuccess == true
                      ? AppConstants.statusGreen.withValues(alpha: 0.15)
                      : AppConstants.statusRed.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: _testSuccess == true
                        ? AppConstants.statusGreen
                        : AppConstants.statusRed,
                  ),
                ),
                child: Row(
                  children: [
                    if (_isTesting)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                    if (_isTesting) const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _testMessage!,
                        style: TextStyle(
                          color: _testSuccess == true
                              ? AppConstants.statusGreen
                              : AppConstants.statusRed,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _isTesting ? null : _testConnection,
                    icon: _isTesting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.speed_rounded, size: 18),
                    label: const Text('TEST'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.accentPurple,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: _saveAndConnect,
                    icon: const Icon(Icons.check_rounded, size: 20),
                    label: const Text(
                      'SAVE & CONNECT',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPresetCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String url,
    required VoidCallback onTap,
    required VoidCallback onQrTap,
  }) {
    final isSelected = _urlController.text.trim() == url.trim();

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? iconColor.withValues(alpha: 0.15)
              : AppConstants.cardDark,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? iconColor : Colors.white.withValues(alpha: 0.05),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isSelected ? iconColor : Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.5),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.qr_code_2_rounded, size: 20),
              color: isSelected ? iconColor : Colors.white60,
              tooltip: 'Show QR Code',
              onPressed: onQrTap,
            ),
            if (isSelected)
              Icon(Icons.check_circle_rounded, color: iconColor, size: 18),
          ],
        ),
      ),
    );
  }
}
