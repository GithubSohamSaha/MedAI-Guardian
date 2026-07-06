class Bed {
  final int id;
  final String bedType;
  final int total;
  final int occupied;
  final int available;
  final int phcId;
  final DateTime lastUpdated;

  Bed({
    required this.id,
    required this.bedType,
    required this.total,
    required this.occupied,
    required this.available,
    required this.phcId,
    required this.lastUpdated,
  });

  factory Bed.fromJson(Map<String, dynamic> json) {
    return Bed(
      id: json['id'],
      bedType: json['bed_type'],
      total: json['total'],
      occupied: json['occupied'],
      available: json['available'],
      phcId: json['phc_id'],
      lastUpdated: DateTime.parse(json['last_updated']),
    );
  }
}

class BedAvailability {
  final int phcId;
  final String bedType;
  final int total;
  final int occupied;
  final int available;
  final DateTime lastUpdated;

  BedAvailability({
    required this.phcId,
    required this.bedType,
    required this.total,
    required this.occupied,
    required this.available,
    required this.lastUpdated,
  });

  factory BedAvailability.fromJson(Map<String, dynamic> json) {
    return BedAvailability(
      phcId: json['phc_id'],
      bedType: json['bed_type'],
      total: json['total'],
      occupied: json['occupied'],
      available: json['available'],
      lastUpdated: DateTime.parse(json['last_updated']),
    );
  }
}