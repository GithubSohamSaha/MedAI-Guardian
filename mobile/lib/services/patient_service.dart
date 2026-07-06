import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/patient_model.dart';
import '../config/api_config.dart';
import 'auth_service.dart';

class PatientService extends ChangeNotifier {
  final AuthService authService;

  PatientService(this.authService);

  Future<bool> recordVisit({
    String? patientId,
    List<String>? symptoms,
    String? diagnosis,
    int? waitTimeMin,
    bool isEmergency = false,
  }) async {
    final token = authService.token;
    if (token == null) return false;

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/patients/visit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          if (patientId != null) 'patient_id': patientId,
          if (symptoms != null) 'symptoms': symptoms,
          if (diagnosis != null) 'diagnosis': diagnosis,
          if (waitTimeMin != null) 'wait_time_min': waitTimeMin,
          'is_emergency': isEmergency,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<int> getTodayCount() async {
    final token = authService.token;
    if (token == null) return 0;

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/patients/stats?days=1'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['total'] ?? 0;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  Future<PatientSurgePrediction?> getForecast() async {
    final token = authService.token;
    if (token == null) return null;

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/patients/forecast'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return PatientSurgePrediction.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

class PatientSurgePrediction {
  final int phcId;
  final int predictedCount;
  final String peakHours;
  final String riskLevel;

  PatientSurgePrediction({
    required this.phcId,
    required this.predictedCount,
    required this.peakHours,
    required this.riskLevel,
  });

  factory PatientSurgePrediction.fromJson(Map<String, dynamic> json) {
    return PatientSurgePrediction(
      phcId: json['phc_id'],
      predictedCount: json['predicted_count'],
      peakHours: json['peak_hours'] ?? '11:00-14:00',
      riskLevel: json['risk_level'] ?? 'LOW',
    );
  }
}