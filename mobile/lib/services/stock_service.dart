import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/medicine_model.dart';
import '../config/api_config.dart';
import 'auth_service.dart';

class StockService extends ChangeNotifier {
  final AuthService authService;

  StockService(this.authService);

  Future<List<StockForecast>> getForecast() async {
    final token = authService.token;
    if (token == null) return [];

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/medicines/forecast'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => StockForecast.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> updateStock({
    required String medicineName,
    required int quantity,
    String? notes,
  }) async {
    final token = authService.token;
    if (token == null) return false;

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/medicines/update-stock'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'medicine_name': medicineName,
          'quantity': quantity,
          'notes': notes,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<List<dynamic>> getAlerts() async {
    final token = authService.token;
    if (token == null) return [];

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/alerts/active'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}