import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/stock_service.dart';
import '../../services/patient_service.dart';
import '../../services/bed_service.dart';
import '../../models/medicine_model.dart';
import '../../models/patient_model.dart';
import '../../models/bed_model.dart';
import '../../widgets/health_score_card.dart';
import '../../widgets/alert_card.dart';
import '../../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
  List<StockForecast> _criticalMedicines = [];
  List<BedAvailability> _bedAvailability = [];
  int _todayPatients = 0;
  int _totalAlerts = 0;
  int _healthScore = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final stockService = Provider.of<StockService>(context, listen: false);
    final patientService = Provider.of<PatientService>(context, listen: false);
    final bedService = Provider.of<BedService>(context, listen: false);
    
    try {
      final forecast = await stockService.getForecast();
      final beds = await bedService.getAvailability();
      final patients = await patientService.getTodayCount();
      final alerts = await stockService.getAlerts();
      
      setState(() {
        _criticalMedicines = forecast.where((m) => m.isCritical).toList();
        _bedAvailability = beds;
        _todayPatients = patients;
        _totalAlerts = alerts.length;
        _healthScore = _calculateHealthScore();
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading dashboard: $e')),
      );
    }
  }

  int _calculateHealthScore() {
    // Simplified health score calculation
    int stockScore = 100 - (_criticalMedicines.length * 10);
    int bedScore = 100 - (_bedAvailability.any((b) => b.available == 0) ? 30 : 0);
    return ((stockScore + bedScore) / 2).clamp(0, 100).toInt();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Health Score
                    HealthScoreCard(
                      score: _healthScore,
                      totalAlerts: _totalAlerts,
                    ),
                    const SizedBox(height: 16),
                    
                    // Stats Row
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            title: 'Critical Medicines',
                            value: _criticalMedicines.length,
                            icon: Icons.medication,
                            color: Colors.red,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            title: 'Today Patients',
                            value: _todayPatients,
                            icon: Icons.people,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            title: 'Total Beds',
                            value: _bedAvailability.fold(
                              0, (sum, b) => sum + b.total,
                            ),
                            icon: Icons.local_hospital,
                            color: Colors.green,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            title: 'Available Beds',
                            value: _bedAvailability.fold(
                              0, (sum, b) => sum + b.available,
                            ),
                            icon: Icons.bed,
                            color: Colors.orange,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Critical Alerts
                    if (_criticalMedicines.isNotEmpty) ...[
                      const Text(
                        '⚠️ Critical Alerts',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ..._criticalMedicines.map((med) => AlertCard(
                        title: med.medicineName,
                        subtitle: 'Stock: ${med.currentStock} | Days left: ${med.daysRemaining}',
                        severity: 'CRITICAL',
                      )),
                      const SizedBox(height: 16),
                    ],
                    
                    // Bed Availability
                    if (_bedAvailability.isNotEmpty) ...[
                      const Text(
                        '🛏️ Bed Availability',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ..._bedAvailability.map((bed) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(bed.bedType),
                            Text(
                              '${bed.available} / ${bed.total}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: bed.available == 0 ? Colors.red : Colors.green,
                              ),
                            ),
                          ],
                        ),
                      )),
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}