class Patient {
  final int id;
  final String? patientId;
  final String? name;
  final int? age;
  final String? gender;
  final String? phone;
  final String? address;

  Patient({
    required this.id,
    this.patientId,
    this.name,
    this.age,
    this.gender,
    this.phone,
    this.address,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'],
      patientId: json['patient_id'],
      name: json['name'],
      age: json['age'],
      gender: json['gender'],
      phone: json['phone'],
      address: json['address'],
    );
  }
}

class PatientVisit {
  final int id;
  final int? patientId;
  final int phcId;
  final DateTime visitDate;
  final List<String>? symptoms;
  final String? diagnosis;
  final int? waitTimeMin;
  final bool isEmergency;

  PatientVisit({
    required this.id,
    this.patientId,
    required this.phcId,
    required this.visitDate,
    this.symptoms,
    this.diagnosis,
    this.waitTimeMin,
    this.isEmergency = false,
  });

  factory PatientVisit.fromJson(Map<String, dynamic> json) {
    return PatientVisit(
      id: json['id'],
      patientId: json['patient_id'],
      phcId: json['phc_id'],
      visitDate: DateTime.parse(json['visit_date']),
      symptoms: json['symptoms'] != null 
          ? List<String>.from(json['symptoms']) 
          : null,
      diagnosis: json['diagnosis'],
      waitTimeMin: json['wait_time_min'],
      isEmergency: json['is_emergency'] ?? false,
    );
  }
}