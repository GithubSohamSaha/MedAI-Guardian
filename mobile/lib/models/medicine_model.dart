class Medicine {
  final int id;
  final String name;
  final String? code;
  final String? category;
  final int currentStock;
  final int reorderLevel;
  final int bufferStock;
  final String unit;
  final double? pricePerUnit;
  final int phcId;
  final DateTime lastUpdated;

  Medicine({
    required this.id,
    required this.name,
    this.code,
    this.category,
    required this.currentStock,
    required this.reorderLevel,
    this.bufferStock = 25,
    this.unit = 'strips',
    this.pricePerUnit,
    required this.phcId,
    required this.lastUpdated,
  });

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['id'],
      name: json['name'],
      code: json['code'],
      category: json['category'],
      currentStock: json['current_stock'] ?? 0,
      reorderLevel: json['reorder_level'] ?? 50,
      bufferStock: json['buffer_stock'] ?? 25,
      unit: json['unit'] ?? 'strips',
      pricePerUnit: json['price_per_unit']?.toDouble(),
      phcId: json['phc_id'],
      lastUpdated: DateTime.parse(json['last_updated']),
    );
  }

  bool get isCritical => currentStock < reorderLevel;
  bool get isBelowBuffer => currentStock < bufferStock;
  
  String get status {
    if (currentStock <= 0) return 'OUT_OF_STOCK';
    if (isCritical) return 'CRITICAL';
    if (isBelowBuffer) return 'LOW';
    return 'OK';
  }
  
  Color get statusColor {
    switch (status) {
      case 'OUT_OF_STOCK':
        return Colors.red.shade900;
      case 'CRITICAL':
        return Colors.red;
      case 'LOW':
        return Colors.orange;
      default:
        return Colors.green;
    }
  }
}

class StockForecast {
  final int medicineId;
  final String medicineName;
  final int currentStock;
  final double avgDailyConsumption;
  final int daysRemaining;
  final int reorderLevel;
  final bool isCritical;

  StockForecast({
    required this.medicineId,
    required this.medicineName,
    required this.currentStock,
    required this.avgDailyConsumption,
    required this.daysRemaining,
    required this.reorderLevel,
    required this.isCritical,
  });

  factory StockForecast.fromJson(Map<String, dynamic> json) {
    return StockForecast(
      medicineId: json['medicine_id'],
      medicineName: json['medicine_name'],
      currentStock: json['current_stock'],
      avgDailyConsumption: json['avg_daily_consumption']?.toDouble() ?? 0,
      daysRemaining: json['days_remaining'],
      reorderLevel: json['reorder_level'],
      isCritical: json['is_critical'] ?? false,
    );
  }
}