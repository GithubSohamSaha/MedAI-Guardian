import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/bed_model.dart';
import '../config/api_config.dart';
import 'auth_service.dart';

class BedService extends ChangeNotifier {
  final AuthService authService;

  BedService(this.authService);

  Future<List<BedAvailability>> getAvailability() async {
    final token = authService.token;
    if (token == null) return [];

    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/beds/availability'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => BedAvailability.fromJson(item)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> updateBeds({
    required String bedType,
    required int total,
    required int occupied,
  }) async {
    final token = authService.token;
    if (token == null) return false;

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/v1/beds/update'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'bed_type': bedType,
          'total': total,
          'occupied': occupied,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}