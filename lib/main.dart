import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/socket_service.dart';
import 'services/room_service.dart';
import 'services/question_service.dart';
import 'screens/join_room_screen.dart';
import 'utils/constants.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PinPointBuzzerApp());
}

class PinPointBuzzerApp extends StatelessWidget {
  const PinPointBuzzerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<SocketService>(
          create: (_) => SocketService(),
        ),
        ChangeNotifierProxyProvider<SocketService, RoomService>(
          create: (ctx) => RoomService(ctx.read<SocketService>()),
          update: (_, socketService, previous) =>
              previous ?? RoomService(socketService),
        ),
        ChangeNotifierProxyProvider<SocketService, QuestionService>(
          create: (ctx) => QuestionService(ctx.read<SocketService>()),
          update: (_, socketService, previous) =>
              previous ?? QuestionService(socketService),
        ),
      ],
      child: MaterialApp(
        title: AppConstants.appTitle,
        debugShowCheckedModeBanner: false,
        themeMode: ThemeMode.dark,
        darkTheme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.dark,
          scaffoldBackgroundColor: AppConstants.primaryDark,
          colorScheme: const ColorScheme.dark(
            primary: AppConstants.accentPurple,
            secondary: AppConstants.accentBlue,
            surface: AppConstants.surfaceDark,
            error: AppConstants.statusRed,
          ),
          fontFamily: 'Roboto',
          cardTheme: CardThemeData(
            color: AppConstants.surfaceDark,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        initialRoute: '/',
        routes: {
          '/': (_) => const JoinRoomScreen(),
          '/join': (_) => const JoinRoomScreen(),
        },
        onGenerateRoute: (settings) {
          return MaterialPageRoute(
            builder: (_) => const JoinRoomScreen(),
            settings: settings,
          );
        },
      ),
    );
  }
}

