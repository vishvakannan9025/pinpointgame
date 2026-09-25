import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/room_service.dart';
import '../services/socket_service.dart';
import '../utils/constants.dart';
import '../widgets/server_status_badge.dart';
import 'participant_room_screen.dart';

class JoinRoomScreen extends StatefulWidget {
  const JoinRoomScreen({super.key});

  @override
  State<JoinRoomScreen> createState() => _JoinRoomScreenState();
}

class _JoinRoomScreenState extends State<JoinRoomScreen>
    with TickerProviderStateMixin {
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  // Staggered entrance animations
  late AnimationController _entranceController;
  late List<Animation<double>> _fadeAnimations;
  late List<Animation<Offset>> _slideAnimations;

  // Logo glow pulse
  late AnimationController _logoGlowController;
  late Animation<double> _logoGlowAnimation;

  // Button shimmer
  late AnimationController _shimmerController;

  @override
  void initState() {
    super.initState();

    // Staggered entrance: each element fades in + slides up, one after another
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    // Create 5 staggered animations for: logo, title, badge, input, button
    _fadeAnimations = List.generate(5, (i) {
      final start = (i * 0.15).clamp(0.0, 1.0);
      final end = (start + 0.4).clamp(0.0, 1.0);
      return Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _entranceController,
          curve: Interval(start, end, curve: Curves.easeOut),
        ),
      );
    });

    _slideAnimations = List.generate(5, (i) {
      final start = (i * 0.15).clamp(0.0, 1.0);
      final end = (start + 0.4).clamp(0.0, 1.0);
      return Tween<Offset>(
        begin: const Offset(0, 0.3),
        end: Offset.zero,
      ).animate(
        CurvedAnimation(
          parent: _entranceController,
          curve: Interval(start, end, curve: Curves.easeOutCubic),
        ),
      );
    });

    // Logo glow breathing
    _logoGlowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);
    _logoGlowAnimation = Tween<double>(begin: 0.25, end: 0.6).animate(
      CurvedAnimation(parent: _logoGlowController, curve: Curves.easeInOut),
    );

    // Button shimmer sweep
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();

    _entranceController.forward();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final roomService = context.read<RoomService>();
      if (_nameController.text.isEmpty && roomService.canRejoin) {
        _nameController.text = roomService.lastJoinedName ?? '';
      }
    });
  }

  @override
  void dispose() {
    _entranceController.dispose();
    _logoGlowController.dispose();
    _shimmerController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handleJoin() async {
    if (!_formKey.currentState!.validate()) return;

    final roomService = context.read<RoomService>();
    final success = await roomService.joinDefaultRoom(
      _nameController.text.trim(),
    );

    if (!mounted) return;

    if (success && roomService.room != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const ParticipantRoomScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            roomService.errorMessage ??
                'Could not connect to arena. Check your internet connection.',
          ),
          backgroundColor: AppConstants.statusRed,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  /// Helper to wrap a widget with staggered entrance animation
  Widget _animated(int index, Widget child) {
    return FadeTransition(
      opacity: _fadeAnimations[index.clamp(0, 4)],
      child: SlideTransition(
        position: _slideAnimations[index.clamp(0, 4)],
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final roomService = context.watch<RoomService>();
    final socketService = context.watch<SocketService>();

    return Scaffold(
      backgroundColor: AppConstants.primaryDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        actions: const [
          Center(child: ServerStatusBadge()),
          SizedBox(width: 16),
        ],
      ),
      body: SafeArea(
        child: Stack(
          children: [
            // ── Animated background gradient orbs ──
            Positioned(
              top: -80,
              right: -60,
              child: AnimatedBuilder(
                animation: _logoGlowAnimation,
                builder: (context, _) {
                  return Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          AppConstants.accentPurple
                              .withValues(alpha: _logoGlowAnimation.value * 0.15),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Positioned(
              bottom: -100,
              left: -80,
              child: AnimatedBuilder(
                animation: _logoGlowAnimation,
                builder: (context, _) {
                  return Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          AppConstants.buzzerRed
                              .withValues(alpha: _logoGlowAnimation.value * 0.08),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // ── Main content ──
            Center(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // ── 0: Animated Logo with glow ──
                        _animated(
                          0,
                          Center(
                            child: AnimatedBuilder(
                              animation: _logoGlowAnimation,
                              builder: (context, child) {
                                return Container(
                                  width: 100,
                                  height: 100,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppConstants.buzzerRed.withValues(
                                            alpha: _logoGlowAnimation.value),
                                        blurRadius: 30,
                                        spreadRadius: 3,
                                      ),
                                      BoxShadow(
                                        color: AppConstants.accentPurple
                                            .withValues(
                                                alpha:
                                                    _logoGlowAnimation.value *
                                                        0.5),
                                        blurRadius: 50,
                                        spreadRadius: 8,
                                      ),
                                    ],
                                  ),
                                  child: child,
                                );
                              },
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/buzzer_logo.png',
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),

                        // ── 1: Title + subtitle ──
                        _animated(
                          1,
                          Column(
                            children: [
                              ShaderMask(
                                shaderCallback: (bounds) =>
                                    const LinearGradient(
                                  colors: [
                                    Colors.white,
                                    AppConstants.accentBlue,
                                  ],
                                ).createShader(bounds),
                                child: const Text(
                                  'PINPOINT ARENA',
                                  style: TextStyle(
                                    fontSize: 30,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 3,
                                    color: Colors.white,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Enter your Team Name to compete live with all teams',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  color: Colors.white.withValues(alpha: 0.55),
                                  height: 1.4,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // ── 2: Arena badge ──
                        _animated(
                          2,
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppConstants.accentPurple
                                        .withValues(alpha: 0.18),
                                    AppConstants.accentBlue
                                        .withValues(alpha: 0.08),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: AppConstants.accentPurple
                                      .withValues(alpha: 0.4),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  _PulsingDot(
                                      color: AppConstants.statusGreen),
                                  const SizedBox(width: 10),
                                  Flexible(
                                    child: const Text(
                                      'LIVE ARENA: PINPOINT',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.5,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 26),

                        // Disconnection Warning
                        if (!socketService.isConnected) ...[
                          _animated(
                            3,
                            Container(
                              margin: const EdgeInsets.only(bottom: 20),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: AppConstants.statusRed
                                    .withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppConstants.statusRed
                                      .withValues(alpha: 0.5),
                                  width: 1.5,
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.wifi_off_rounded,
                                      color: AppConstants.statusRed,
                                      size: 22),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Server Disconnected',
                                          style: TextStyle(
                                            color: AppConstants.statusRed,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                        Text(
                                          'Connecting across network...',
                                          style: TextStyle(
                                            color: Colors.white
                                                .withValues(alpha: 0.7),
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  TextButton(
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.white,
                                      backgroundColor:
                                          AppConstants.accentPurple,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 6),
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10),
                                      ),
                                    ),
                                    onPressed: () => socketService.connect(),
                                    child: const Text(
                                      'Connect',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],

                        // Quick Rejoin
                        if (roomService.canRejoin) ...[
                          _animated(
                            3,
                            Container(
                              margin: const EdgeInsets.only(bottom: 20),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: AppConstants.statusGreen
                                    .withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppConstants.statusGreen
                                      .withValues(alpha: 0.5),
                                  width: 1.5,
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.replay_rounded,
                                      color: AppConstants.statusGreen,
                                      size: 22),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Previous Team Found',
                                          style: TextStyle(
                                            color: AppConstants.statusGreen,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                        Text(
                                          'Re-enter as "${roomService.lastJoinedName}"',
                                          style: TextStyle(
                                            color: Colors.white
                                                .withValues(alpha: 0.8),
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  TextButton(
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.white,
                                      backgroundColor:
                                          AppConstants.statusGreen,
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 6),
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10),
                                      ),
                                    ),
                                    onPressed: () async {
                                      _nameController.text =
                                          roomService.lastJoinedName ?? '';
                                      final navigator = Navigator.of(context);
                                      final success =
                                          await roomService.rejoinLastRoom();
                                      if (!mounted) return;
                                      if (success &&
                                          roomService.room != null) {
                                        navigator.pushReplacement(
                                          MaterialPageRoute(
                                              builder: (_) =>
                                                  const ParticipantRoomScreen()),
                                        );
                                      }
                                    },
                                    child: const Text(
                                      'Re-enter',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],

                        // ── 3: Team Name Input ──
                        _animated(
                          3,
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'TEAM / PARTICIPANT NAME',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.6),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const SizedBox(height: 10),
                              TextFormField(
                                controller: _nameController,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                                inputFormatters: [
                                  LengthLimitingTextInputFormatter(30),
                                ],
                                decoration: InputDecoration(
                                  hintText: 'e.g. Alpha College',
                                  hintStyle: TextStyle(
                                    color:
                                        Colors.white.withValues(alpha: 0.2),
                                  ),
                                  filled: true,
                                  fillColor: AppConstants.surfaceDark,
                                  prefixIcon: const Icon(
                                      Icons.groups_rounded,
                                      color: AppConstants.accentPurple),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: Colors.white
                                          .withValues(alpha: 0.08),
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: Colors.white
                                          .withValues(alpha: 0.08),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: const BorderSide(
                                      color: AppConstants.accentPurple,
                                      width: 2,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 16),
                                ),
                                validator: (val) {
                                  if (val == null || val.trim().isEmpty) {
                                    return 'Please enter your Team Name.';
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Error Banner
                        if (roomService.errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppConstants.statusRed
                                  .withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppConstants.statusRed
                                    .withValues(alpha: 0.5),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded,
                                    color: AppConstants.statusRed, size: 20),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    roomService.errorMessage!,
                                    style: const TextStyle(
                                      color: AppConstants.statusRed,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ── 4: Enter Arena Button with shimmer ──
                        _animated(
                          4,
                          SizedBox(
                            height: 56,
                            child: AnimatedBuilder(
                              animation: _shimmerController,
                              builder: (context, child) {
                                return Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    gradient: LinearGradient(
                                      colors: const [
                                        AppConstants.accentPurple,
                                        Color(0xFF818CF8),
                                        AppConstants.accentPurple,
                                      ],
                                      stops: [
                                        0.0,
                                        _shimmerController.value,
                                        1.0,
                                      ],
                                      begin: Alignment.centerLeft,
                                      end: Alignment.centerRight,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppConstants.accentPurple
                                            .withValues(alpha: 0.4),
                                        blurRadius: 18,
                                        offset: const Offset(0, 6),
                                      ),
                                    ],
                                  ),
                                  child: child,
                                );
                              },
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  elevation: 0,
                                ),
                                onPressed: roomService.isLoading
                                    ? null
                                    : _handleJoin,
                                child: roomService.isLoading
                                    ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          valueColor:
                                              AlwaysStoppedAnimation(
                                                  Colors.white),
                                        ),
                                      )
                                    : const Text(
                                        'ENTER GAME ARENA',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 2,
                                          color: Colors.white,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A small dot that pulses opacity to indicate "live" status
class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: widget.color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color:
                    widget.color.withValues(alpha: 0.3 + _controller.value * 0.5),
                blurRadius: 6 + _controller.value * 4,
                spreadRadius: _controller.value * 2,
              ),
            ],
          ),
        );
      },
    );
  }
}
