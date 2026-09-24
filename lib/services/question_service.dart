import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/question_model.dart';
import 'socket_service.dart';

class QuestionService extends ChangeNotifier {
  static const String _storageKeyQuestions = 'pinpoint_questions_v1';
  static const String _storageKeySettings = 'pinpoint_settings_v1';

  final SocketService? _socketService;
  List<PinpointQuestion> _questions = [];
  GameSettings _settings = const GameSettings();
  int _activeQuestionIndex = 0;
  bool _isAnswerRevealed = false;
  bool _isLoading = false;

  QuestionService([this._socketService]) {
    _init();
  }

  List<PinpointQuestion> get questions => List.unmodifiable(_questions);
  GameSettings get settings => _settings;
  int get activeQuestionIndex => _activeQuestionIndex;
  bool get isAnswerRevealed => _isAnswerRevealed;
  bool get isLoading => _isLoading;
  int get totalQuestions => _questions.length;

  PinpointQuestion? get currentQuestion {
    if (_questions.isEmpty ||
        _activeQuestionIndex < 0 ||
        _activeQuestionIndex >= _questions.length) {
      return null;
    }
    return _questions[_activeQuestionIndex];
  }

  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();

    await _loadFromLocal();

    // Hook socket events for live sync across admin and view portal
    _setupSocketListeners();

    _isLoading = false;
    notifyListeners();
  }

  void _setupSocketListeners() {
    final socket = _socketService?.socket;
    if (socket == null) return;

    socket.on('questions_updated', (data) {
      if (data is Map) {
        _handleServerQuestionsUpdate(Map<String, dynamic>.from(data));
      }
    });

    socket.on('active_question_changed', (data) {
      if (data is Map && data['index'] is int) {
        final newIndex = data['index'] as int;
        if (newIndex >= 0 && newIndex < _questions.length) {
          _activeQuestionIndex = newIndex;
          _isAnswerRevealed = false;
          notifyListeners();
        }
      }
    });

    socket.on('answer_revealed', (data) {
      if (data is Map && data['isRevealed'] is bool) {
        _isAnswerRevealed = data['isRevealed'] as bool;
        notifyListeners();
      }
    });
  }

  void _handleServerQuestionsUpdate(Map<String, dynamic> data) {
    try {
      if (data['questions'] is List) {
        final list = (data['questions'] as List)
            .map((q) => PinpointQuestion.fromJson(Map<String, dynamic>.from(q as Map)))
            .toList();
        if (list.isNotEmpty) {
          _questions = list;
        }
      }
      if (data['settings'] is Map) {
        _settings = GameSettings.fromJson(
            Map<String, dynamic>.from(data['settings'] as Map));
      }
      _saveToLocal();
      notifyListeners();
    } catch (e) {
      debugPrint('Error parsing server questions: $e');
    }
  }

  Future<void> _loadFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final questionsJson = prefs.getString(_storageKeyQuestions);
      final settingsJson = prefs.getString(_storageKeySettings);

      if (questionsJson != null && questionsJson.isNotEmpty) {
        final decoded = jsonDecode(questionsJson) as List<dynamic>;
        _questions = decoded
            .map((e) => PinpointQuestion.fromJson(e as Map<String, dynamic>))
            .toList();
      } else {
        _questions = _getDefaultSampleQuestions();
        await _saveToLocal();
      }

      if (settingsJson != null && settingsJson.isNotEmpty) {
        final decoded = jsonDecode(settingsJson) as Map<String, dynamic>;
        _settings = GameSettings.fromJson(decoded);
      }
    } catch (e) {
      debugPrint('Error loading saved questions: $e');
      _questions = _getDefaultSampleQuestions();
    }
  }

  Future<void> _saveToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final questionsJson =
          jsonEncode(_questions.map((q) => q.toJson()).toList());
      final settingsJson = jsonEncode(_settings.toJson());

      await prefs.setString(_storageKeyQuestions, questionsJson);
      await prefs.setString(_storageKeySettings, settingsJson);
    } catch (e) {
      debugPrint('Error saving questions to local storage: $e');
    }
  }

  void _broadcastToServer() {
    final socket = _socketService?.socket;
    if (socket != null && socket.connected) {
      socket.emit('update_questions', {
        'questions': _questions.map((q) => q.toJson()).toList(),
        'settings': _settings.toJson(),
      });
    }
  }

  // --- CRUD Operations ---

  Future<void> addQuestion(PinpointQuestion question) async {
    final newQuestion = question.copyWith(order: _questions.length);
    _questions.add(newQuestion);
    await _saveToLocal();
    _broadcastToServer();
    notifyListeners();
  }

  Future<void> updateQuestion(PinpointQuestion updated) async {
    final index = _questions.indexWhere((q) => q.id == updated.id);
    if (index != -1) {
      _questions[index] = updated;
      await _saveToLocal();
      _broadcastToServer();
      notifyListeners();
    }
  }

  Future<void> deleteQuestion(String id) async {
    _questions.removeWhere((q) => q.id == id);
    _reindexQuestions();
    if (_activeQuestionIndex >= _questions.length) {
      _activeQuestionIndex = (_questions.length - 1).clamp(0, 999);
    }
    await _saveToLocal();
    _broadcastToServer();
    notifyListeners();
  }

  Future<void> reorderQuestions(int oldIndex, int newIndex) async {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final item = _questions.removeAt(oldIndex);
    _questions.insert(newIndex, item);
    _reindexQuestions();
    await _saveToLocal();
    _broadcastToServer();
    notifyListeners();
  }

  void _reindexQuestions() {
    for (int i = 0; i < _questions.length; i++) {
      _questions[i] = _questions[i].copyWith(order: i);
    }
  }

  Future<void> updateSettings(GameSettings newSettings) async {
    _settings = newSettings;
    await _saveToLocal();
    _broadcastToServer();
    notifyListeners();
  }

  Future<void> resetToDefaultSamples() async {
    _questions = _getDefaultSampleQuestions();
    _activeQuestionIndex = 0;
    _isAnswerRevealed = false;
    await _saveToLocal();
    _broadcastToServer();
    notifyListeners();
  }

  // --- View Portal & Presentation Navigation ---

  void setActiveQuestion(int index) {
    if (index >= 0 && index < _questions.length) {
      _activeQuestionIndex = index;
      _isAnswerRevealed = false;
      notifyListeners();

      final socket = _socketService?.socket;
      if (socket != null && socket.connected) {
        socket.emit('set_active_question', {'index': index});
      }
    }
  }

  void nextQuestion() {
    if (_activeQuestionIndex < _questions.length - 1) {
      setActiveQuestion(_activeQuestionIndex + 1);
    }
  }

  void previousQuestion() {
    if (_activeQuestionIndex > 0) {
      setActiveQuestion(_activeQuestionIndex - 1);
    }
  }

  void toggleAnswerReveal() {
    _isAnswerRevealed = !_isAnswerRevealed;
    notifyListeners();

    final socket = _socketService?.socket;
    if (socket != null && socket.connected) {
      socket.emit('reveal_answer', {'isRevealed': _isAnswerRevealed});
    }
  }

  // --- Default Sample Questions for Pinpoint Game ---
  List<PinpointQuestion> _getDefaultSampleQuestions() {
    return [
      const PinpointQuestion(
        id: 'sample-1',
        question:
            'Identify the Google multi-platform UI framework written in Dart that compiles to native code:',
        clue: 'UI Toolkit • Cross-platform • Hot Reload',
        options: ['Flutter', 'React Native', 'SwiftUI', 'Jetpack Compose'],
        correctOptionIndex: 0,
        order: 0,
        timeLimitSeconds: 30,
      ),
      const PinpointQuestion(
        id: 'sample-2',
        question:
            'Identify the lightweight protocol designed for real-time bidirectional event-based communication:',
        clue: 'WebSockets • Polling fallback • Rooms & Namespaces',
        options: ['gRPC', 'Socket.IO', 'GraphQL', 'REST API'],
        correctOptionIndex: 1,
        order: 1,
        timeLimitSeconds: 30,
      ),
      const PinpointQuestion(
        id: 'sample-3',
        question:
            'Pinpoint the global tunneling tool that exposes local servers securely to public internet URLs without port forwarding:',
        clue: 'Zero Trust • Tunnel • Edge Network',
        options: ['Docker', 'Nginx', 'Cloudflare Tunnel', 'Apache'],
        correctOptionIndex: 2,
        order: 2,
        timeLimitSeconds: 30,
      ),
      const PinpointQuestion(
        id: 'sample-4',
        question:
            'Pinpoint the primary data structure that operates on a First-In-First-Out (FIFO) principle, perfect for buzzer arrival queues:',
        clue: 'FIFO • Enqueue/Dequeue • Fair Ordering',
        options: ['Stack', 'Binary Tree', 'Priority Queue', 'Queue'],
        correctOptionIndex: 3,
        order: 3,
        timeLimitSeconds: 25,
      ),
      const PinpointQuestion(
        id: 'sample-5',
        question:
            'Identify the database ORM toolkit for Node.js and TypeScript known for clean declarative schemas and type-safety:',
        clue: 'Declarative Schema • Type-safe • Migrations',
        options: ['Prisma', 'Mongoose', 'TypeORM', 'Sequelize'],
        correctOptionIndex: 0,
        order: 4,
        timeLimitSeconds: 30,
      ),
    ];
  }
}
