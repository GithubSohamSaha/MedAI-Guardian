class User {
  final int id;
  final String username;
  final String email;
  final String? phone;
  final String role;
  final int? phcId;
  final String? imageFile;
  final bool isActive;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.phone,
    this.role = 'health_worker',
    this.phcId,
    this.imageFile,
    this.isActive = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      phone: json['phone'],
      role: json['role'] ?? 'health_worker',
      phcId: json['phc_id'],
      imageFile: json['image_file'],
      isActive: json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'phone': phone,
      'role': role,
      'phc_id': phcId,
      'image_file': imageFile,
      'is_active': isActive,
    };
  }

  String get imagePath {
    if (imageFile != null) {
      return '/media/profile_pics/$imageFile';
    }
    return '/static/profile_pics/default.jpg';
  }
}