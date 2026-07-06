import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/stock_service.dart';
import '../../models/medicine_model.dart';

class StockForecastScreen extends StatefulWidget {
  const StockForecastScreen({super.key});

  @override
  State<StockForecastScreen> createState() => _StockForecastScreenState();
}

class _StockForecastScreenState extends State<StockForecastScreen> {
  bool _isLoading = true;
  List<StockForecast> _forecasts = [];

  @override
  void initState() {
    super.initState();
    _loadForecast();
  }

  Future<void> _loadForecast() async {
    setState(() => _isLoading = true);
    
    try {
      final stockService = Provider.of<StockService>(context, listen: false);
      final data = await stockService.getForecast();
      setState(() {
        _forecasts = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading forecast: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Forecast'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadForecast,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _forecasts.isEmpty
              ? const Center(child: Text('No medicines found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _forecasts.length,
                  itemBuilder: (context, index) {
                    final forecast = _forecasts[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: forecast.isCritical
                              ? Colors.red
                              : Colors.green,
                          child: Text(
                            forecast.daysRemaining.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        title: Text(forecast.medicineName),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Stock: ${forecast.currentStock} ${forecast.unit}'),
                            Text('Avg Consumption: ${forecast.avgDailyConsumption.toStringAsFixed(1)}/day'),
                          ],
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: forecast.isCritical
                                ? Colors.red.shade100
                                : Colors.green.shade100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            forecast.isCritical ? '⚠️ Critical' : '✅ OK',
                            style: TextStyle(
                              color: forecast.isCritical
                                  ? Colors.red.shade800
                                  : Colors.green.shade800,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}