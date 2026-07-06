import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../../services/stock_service.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';

class StockEntryScreen extends StatefulWidget {
  const StockEntryScreen({super.key});

  @override
  State<StockEntryScreen> createState() => _StockEntryScreenState();
}

class _StockEntryScreenState extends State<StockEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _medicineController = TextEditingController();
  final _quantityController = TextEditingController();
  final _notesController = TextEditingController();
  
  bool _isLoading = false;
  bool _isListening = false;
  String _transcript = '';
  
  late SpeechToText _speech;

  @override
  void initState() {
    super.initState();
    _speech = SpeechToText();
  }

  Future<void> _startListening() async {
    bool available = await _speech.initialize(
      onStatus: (status) {
        setState(() {
          _isListening = status == 'listening';
        });
      },
      onError: (error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Speech error: $error')),
        );
      },
    );

    if (available) {
      setState(() => _isListening = true);
      _speech.listen(
        onResult: (result) {
          setState(() {
            _transcript = result.recognizedWords;
            _parseVoiceInput(_transcript);
          });
        },
        localeId: 'en_IN',
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Speech recognition not available')),
      );
    }
  }

  void _parseVoiceInput(String text) {
    // Simple parsing: expect "MedicineName Quantity"
    final parts = text.split(' ');
    if (parts.length >= 2) {
      // Try to find a number in the text
      for (int i = 0; i < parts.length; i++) {
        final maybeNumber = int.tryParse(parts[i]);
        if (maybeNumber != null) {
          final medicine = parts.sublist(0, i).join(' ');
          _medicineController.text = medicine;
          _quantityController.text = maybeNumber.toString();
          break;
        }
      }
    }
  }

  void _stopListening() {
    _speech.stop();
    setState(() => _isListening = false);
  }

  Future<void> _submitStock() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    final stockService = Provider.of<StockService>(context, listen: false);
    
    final success = await stockService.updateStock(
      medicineName: _medicineController.text.trim(),
      quantity: int.parse(_quantityController.text),
      notes: _notesController.text.trim(),
    );
    
    setState(() => _isLoading = false);
    
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Stock updated successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      _medicineController.clear();
      _quantityController.clear();
      _notesController.clear();
      _transcript = '';
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update stock'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Entry'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Voice Input Button
              GestureDetector(
                onTap: _isListening ? _stopListening : _startListening,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isListening ? Colors.red : Colors.blue,
                    boxShadow: [
                      BoxShadow(
                        color: (_isListening ? Colors.red : Colors.blue).withOpacity(0.4),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Icon(
                    _isListening ? Icons.stop : Icons.mic,
                    size: 50,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _isListening ? 'Listening...' : 'Tap to speak',
                style: TextStyle(
                  fontSize: 16,
                  color: _isListening ? Colors.red : Colors.grey,
                ),
              ),
              if (_transcript.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _transcript,
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              // Manual Entry
              CustomTextField(
                controller: _medicineController,
                label: 'Medicine Name',
                hint: 'e.g., Paracetamol',
                prefixIcon: Icons.medication,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter medicine name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _quantityController,
                label: 'Quantity',
                hint: 'e.g., 200',
                prefixIcon: Icons.numbers,
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter quantity';
                  }
                  if (int.tryParse(value) == null) {
                    return 'Please enter a valid number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              CustomTextField(
                controller: _notesController,
                label: 'Notes (Optional)',
                hint: 'e.g., Received from supplier',
                prefixIcon: Icons.note_outlined,
                maxLines: 2,
              ),
              const SizedBox(height: 24),
              CustomButton(
                onPressed: _submitStock,
                text: 'Update Stock',
                isLoading: _isLoading,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _medicineController.dispose();
    _quantityController.dispose();
    _notesController.dispose();
    _speech.stop();
    super.dispose();
  }
}