import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/bed_service.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';

class BedUpdateScreen extends StatefulWidget {
  const BedUpdateScreen({super.key});

  @override
  State<BedUpdateScreen> createState() => _BedUpdateScreenState();
}

class _BedUpdateScreenState extends State<BedUpdateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _totalController = TextEditingController();
  final _occupiedController = TextEditingController();
  String _bedType = 'General';
  bool _isLoading = false;

  final List<String> _bedTypes = [
    'General', 'ICU', 'Oxygen', 'Pediatric', 'Isolation'
  ];

  Future<void> _submitBedUpdate() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    final bedService = Provider.of<BedService>(context, listen: false);
    
    final success = await bedService.updateBeds(
      bedType: _bedType,
      total: int.parse(_totalController.text),
      occupied: int.parse(_occupiedController.text),
    );
    
    setState(() => _isLoading = false);
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bed availability updated!'),
          backgroundColor: Colors.green,
        ),
      );
      _totalController.clear();
      _occupiedController.clear();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update beds'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bed Availability'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                value: _bedType,
                decoration: const InputDecoration(
                  labelText: 'Bed Type',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.bed),
                ),
                items: _bedTypes.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _bedType = value!);
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _totalController,
                label: 'Total Beds',
                hint: 'e.g., 10',
                prefixIcon: Icons.numbers,
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter total beds';
                  }
                  if (int.tryParse(value) == null) {
                    return 'Please enter a valid number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _occupiedController,
                label: 'Occupied Beds',
                hint: 'e.g., 6',
                prefixIcon: Icons.person,
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter occupied beds';
                  }
                  final total = int.tryParse(_totalController.text) ?? 0;
                  final occupied = int.tryParse(value) ?? 0;
                  if (occupied > total) {
                    return 'Occupied beds cannot exceed total beds';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 24),
              CustomButton(
                onPressed: _submitBedUpdate,
                text: 'Update Bed Availability',
                isLoading: _isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }
}