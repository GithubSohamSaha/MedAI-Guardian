import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/patient_service.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';

class PatientVisitScreen extends StatefulWidget {
  const PatientVisitScreen({super.key});

  @override
  State<PatientVisitScreen> createState() => _PatientVisitScreenState();
}

class _PatientVisitScreenState extends State<PatientVisitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _patientIdController = TextEditingController();
  final _symptomsController = TextEditingController();
  final _diagnosisController = TextEditingController();
  final _waitTimeController = TextEditingController();
  bool _isEmergency = false;
  bool _isLoading = false;

  Future<void> _submitVisit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    final patientService = Provider.of<PatientService>(context, listen: false);
    
    final success = await patientService.recordVisit(
      patientId: _patientIdController.text.trim().isNotEmpty 
          ? _patientIdController.text.trim() 
          : null,
      symptoms: _symptomsController.text.split(',').map((s) => s.trim()).toList(),
      diagnosis: _diagnosisController.text.trim(),
      waitTimeMin: int.tryParse(_waitTimeController.text),
      isEmergency: _isEmergency,
    );
    
    setState(() => _isLoading = false);
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Patient visit recorded!'),
          backgroundColor: Colors.green,
        ),
      );
      _patientIdController.clear();
      _symptomsController.clear();
      _diagnosisController.clear();
      _waitTimeController.clear();
      setState(() => _isEmergency = false);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to record visit'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Visit'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              children: [
                CustomTextField(
                  controller: _patientIdController,
                  label: 'Patient ID (ABHA)',
                  hint: 'e.g., ABHA123456',
                  prefixIcon: Icons.person_outline,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _symptomsController,
                  label: 'Symptoms (comma separated)',
                  hint: 'e.g., Fever, Cough, Headache',
                  prefixIcon: Icons.medical_information,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _diagnosisController,
                  label: 'Diagnosis',
                  hint: 'e.g., Viral Fever',
                  prefixIcon: Icons.healing,
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _waitTimeController,
                  label: 'Wait Time (minutes)',
                  hint: 'e.g., 15',
                  prefixIcon: Icons.timer_outlined,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  title: const Text('Emergency Case'),
                  subtitle: const Text('Mark as emergency priority'),
                  value: _isEmergency,
                  onChanged: (value) {
                    setState(() => _isEmergency = value);
                  },
                  activeColor: Colors.red,
                ),
                const SizedBox(height: 24),
                CustomButton(
                  onPressed: _submitVisit,
                  text: 'Record Visit',
                  isLoading: _isLoading,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _patientIdController.dispose();
    _symptomsController.dispose();
    _diagnosisController.dispose();
    _waitTimeController.dispose();
    super.dispose();
  }
}