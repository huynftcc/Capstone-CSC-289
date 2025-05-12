from flask import Flask, render_template, redirect, url_for, jsonify, request
import csv
import os
import json
import random
import string
from data.gpu_specifications import GPU_SPECS, CPU_TDP_ESTIMATES, COMPONENT_POWER_ESTIMATES

app = Flask(__name__)

# Dictionary to store component data
components_data = {}

# Socket compatibility mapping
socket_compatibility = {
    'AM5': ['AMD Ryzen'],  # All Ryzen CPUs with AM5 in the name are compatible with AM5 socket
    'LGA 1700': ['Intel Core i9-12', 'Intel Core i7-12', 'Intel Core i5-12', 'Intel Core i9-13', 'Intel Core i7-13', 'Intel Core i5-13', 'Intel Core i9-14', 'Intel Core i7-14', 'Intel Core i5-14'],  # LGA 1700 is for Intel 12th and 13th gen
    'LGA 1851': ['Intel Core Ultra']  # LGA 1851 is for Intel 14th gen and Core Ultra
}

# Load component data from CSV files
def load_component_data():
    csv_files = {
        'case': 'data/case.csv',
        'motherboard': 'data/motherboard.csv',
        'cpu': 'data/cpu.csv',
        'cooler': 'data/cpu_cooler.csv',
        'memory': 'data/memory.csv',
        'storage': 'data/internal_storage.csv',
        'gpu': 'data/gpu.csv',
        'psu': 'data/psu.csv'
    }
    
    for component_type, file_path in csv_files.items():
        if file_path and os.path.exists(file_path):
            components_data[component_type] = []
            
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for i, row in enumerate(reader):
                    component = {
                        'id': i + 1,  # Generate ID for each component
                        'type': component_type
                    }
                    
                    # Map CSV columns to component fields based on component type
                    if component_type == 'case':
                        component.update({
                            'brand': row.get('name', '').split()[0] if row.get('name') else '',
                            'model': ' '.join(row.get('name', '').split()[1:]) if row.get('name') else '',
                            'price': float(row.get('price', 0)) if row.get('price') else 0,
                            'specs': {
                                'color': row.get('color', ''),
                                'side_panel': row.get('side_panel', ''),
                                'external_volume': float(row.get('external_volume', 0)) if row.get('external_volume') else 0,
                                'internal_35_bays': int(row.get('internal_35_bays', 0)) if row.get('internal_35_bays') else 0
                            }
                        })
                    elif component_type == 'motherboard':
                        component.update({
                            'brand': row.get('Motherboard Name', '').split()[0] if row.get('Motherboard Name') else '',
                            'model': ' '.join(row.get('Motherboard Name', '').split()[1:]) if row.get('Motherboard Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'socket': row.get('Socket Compatibility', ''),
                                'memory_slots': int(row.get('Memory Slots', 0)) if row.get('Memory Slots') else 0,
                                'color': row.get('Color', ''),
                                'memory_max': int(row.get('Memory Max', 0)) if row.get('Memory Max') else 0
                            }
                        })
                    elif component_type == 'cpu':
                        component.update({
                            'brand': row.get('CPU Name', '').split()[0] if row.get('CPU Name') else '',
                            'model': ' '.join(row.get('CPU Name', '').split()[1:]) if row.get('CPU Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'socket': row.get('Socket', ''),  # Add this line to include socket in CPU data
                                'core_count': int(row.get('Core Count', 0)) if row.get('Core Count') else 0,
                                'base_clock': row.get('Base Clock', ''),
                                'boost_clock': row.get('Boost Clock', ''),
                                'tdp': int(row.get('TDP', 0)) if row.get('TDP') else 0,
                                'integrated_graphics': row.get('Integrated Graphics', ''),
                                'microarchitecture': row.get('Microarchitecture', '')
                            }
                        })
                    elif component_type == 'cooler':
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'color': row.get('Color', ''),
                                'socket_compatibility': row.get('Socket compatibility', ''),
                                'cooler_type': row.get('Cooler type', ''),
                                'height': row.get('Height/Radiator size', ''),
                                'rgb': row.get('RGB', '')
                            }
                        })
                    elif component_type == 'memory':
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'speed': row.get('Speed', ''),
                                'modules': row.get('Modules', ''),
                                'color': row.get('Color', ''),
                                'latency': row.get('Latency', ''),
                                'cas': row.get('CAS', '')
                            }
                        })
                    elif component_type == 'storage':
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'form_factor': row.get('Form Factor', ''),
                                'interface': row.get('Interface', ''),
                                'capacity': row.get('Capacity', '')
                            }
                        })
                    elif component_type == 'gpu':
                        price_str = row.get('Price', '')
                        price = 0
                        if price_str:
                            try:
                                price = float(price_str.replace('$', '').replace(',', ''))
                            except:
                                price = 0
                        
                        component.update({
                            'brand': row.get('Name', '').split()[0] if row.get('Name') else '',
                            'model': ' '.join(row.get('Name', '').split()[1:]) if row.get('Name') else '',
                            'price': price,
                            'specs': {
                                'chip': row.get('Chip', ''),
                                'memory': row.get('Memory', ''),
                                'base_clock': row.get('Base Clock', ''),
                                'boost_clock': row.get('Boost Clock', ''),
                                'color': row.get('Color', ''),
                                'length': row.get('Length', '')
                            }
                        })
                    elif component_type == 'psu':
                        component.update({
                            'brand': row.get('PSU Name', '').split()[0] if row.get('PSU Name') else '',
                            'model': ' '.join(row.get('PSU Name', '').split()[1:]) if row.get('PSU Name') else '',
                            'price': float(row.get('Price (USD)', 0)) if row.get('Price (USD)') else 0,
                            'specs': {
                                'wattage': row.get('Wattage', ''),
                                'form_factor': row.get('Form Factor', ''),
                                'efficiency': row.get('Efficiency', ''),
                                'type': row.get('Type', ''),
                                'color': row.get('Color', '')
                            }
                        })
                    
                    components_data[component_type].append(component)

# Load data when the app starts
load_component_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend')
def recommend():
    """Render the Recommend Build page."""
    return render_template('recommend.html')

@app.route('/build')
def build():
    """Render the Component Picker page."""
    return render_template('build.html')

# API endpoint to get all components
@app.route('/api/components')
def get_components():
    all_components = []
    for component_type, components in components_data.items():
        all_components.extend(components)
    return jsonify(all_components)

# API endpoint to get components by type
@app.route('/api/components/<component_type>')
def get_components_by_type(component_type):
    if component_type in components_data:
        return jsonify(components_data[component_type])
    return jsonify([])

# CPU-Motherboard compatibility check
def check_cpu_motherboard_compatibility(cpu, motherboard):
    # Extract socket from motherboard and CPU
    motherboard_socket = motherboard.get('specs', {}).get('socket', '').replace(' ', '').upper()
    cpu_socket = cpu.get('specs', {}).get('socket', '').replace(' ', '').upper()
    
    # Extract CPU brand
    cpu_brand = cpu.get('brand', '')
    
    # Basic brand-socket validation
    if 'AMD' in cpu_brand and not motherboard_socket.startswith('AM'):
        return False
    
    if 'INTEL' in cpu_brand.upper() and not (motherboard_socket.startswith('LGA') or motherboard_socket.startswith('BGA')):
        return False
        
    # Direct socket comparison (normalized)
    return motherboard_socket == cpu_socket

# Compatibility check API
@app.route('/api/compatibility/<int:cpu_id>')
def check_compatibility(cpu_id):
    compatibility_data = []
    
    # Get all motherboards
    motherboards = components_data.get('motherboard', [])
    
    # Get the CPU
    cpu = None
    for cpu_item in components_data.get('cpu', []):
        if cpu_item['id'] == cpu_id:
            cpu = cpu_item
            break
    
    if cpu:
        # Check compatibility with each motherboard
        for mb in motherboards:
            is_compatible = check_cpu_motherboard_compatibility(cpu, mb)
            
            compatibility_data.append({
                'type': 'motherboard',
                'component_id': str(mb['id']),
                'compatible': is_compatible
            })
    
    return jsonify(compatibility_data)

# API endpoint to save builds
@app.route('/api/builds', methods=['POST'])
def save_build():
    data = request.json
    
    # In a real implementation, you would save to a database
    # For now, generate a simple share code
    share_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    return jsonify({
        'success': True,
        'share_code': share_code
    })

# API endpoint to load builds by share code
@app.route('/api/builds/<share_code>')
def load_build(share_code):
    # In a real implementation, you would load from a database
    # For now, return a placeholder build
    return jsonify({
        'name': f'Shared Build {share_code}',
        'components': []
    })

# API endpoint for direct compatibility check
@app.route('/api/check-compatibility', methods=['POST'])
def direct_compatibility_check():
    data = request.json
    
    if not data or 'cpu' not in data or 'motherboard' not in data:
        return jsonify({'compatible': False, 'error': 'Missing CPU or motherboard data'})
    
    cpu = data['cpu']
    motherboard = data['motherboard']
    
    cpu_socket = cpu.get('specs', {}).get('socket', '').replace(' ', '').upper()
    mb_socket = motherboard.get('specs', {}).get('socket', '').replace(' ', '').upper()
    cpu_brand = cpu.get('brand', '')
    cpu_name = f"{cpu.get('brand', '')} {cpu.get('model', '')}"
    
    # Check brand-socket compatibility
    message = None
    compatible = True
    
    if 'AMD' in cpu_brand and not mb_socket.startswith('AM'):
        compatible = False
        message = f"CPU {cpu_name} (AMD) is not compatible with {motherboard.get('specs', {}).get('socket', '')} motherboards"
    
    elif 'INTEL' in cpu_brand.upper() and not (mb_socket.startswith('LGA') or mb_socket.startswith('BGA')):
        compatible = False
        message = f"CPU {cpu_name} (Intel) is not compatible with {motherboard.get('specs', {}).get('socket', '')} motherboards"
    
    # If brand is compatible, check specific socket match
    elif cpu_socket != mb_socket:
        compatible = False
        message = f"CPU {cpu_name} requires {cpu.get('specs', {}).get('socket', '')} socket but motherboard has {motherboard.get('specs', {}).get('socket', '')} socket"
    
    return jsonify({
        'compatible': compatible,
        'message': message,
        'debug': {
            'cpu_socket': cpu_socket,
            'mb_socket': mb_socket,
            'cpu_brand': cpu_brand
        }
    })

@app.route('/api/calculate-power', methods=['POST'])
def api_calculate_power():
    """API endpoint for calculating power requirements."""
    data = request.json
    if not data:
        return jsonify({'error': 'No component data provided'})
    
    power_info = calculate_power_requirements(data)
    return jsonify(power_info)

# Power calculation function
def calculate_power_requirements(components):
    """
    Calculate estimated power requirements for the system.
    
    Args:
        components: Dictionary of selected components
        
    Returns:
        Dictionary with power calculation results
    """
    total_power = 0
    power_breakdown = {}
    
    # Base system power (motherboard, fans, etc.)
    base_power = COMPONENT_POWER_ESTIMATES['motherboard']
    total_power += base_power
    power_breakdown['Base System'] = base_power
    
    # CPU power
    cpu = components.get('cpu')
    if cpu:
        cpu_name = f"{cpu.get('brand', '')} {cpu.get('model', '')}"
        cpu_tdp = 0
        
        # Check if CPU has TDP information
        if cpu.get('specs') and 'tdp' in cpu['specs']:
            cpu_tdp = int(cpu['specs']['tdp'])
        else:
            # Estimate TDP based on CPU name
            for cpu_type, tdp in CPU_TDP_ESTIMATES.items():
                if cpu_type in cpu_name:
                    cpu_tdp = tdp
                    break
            
            # Default if no match
            if cpu_tdp == 0:
                cpu_tdp = 95  # Reasonable default
        
        # Add 20% overhead for CPU power spikes
        cpu_power = int(cpu_tdp * 1.2)
        total_power += cpu_power
        power_breakdown['CPU'] = cpu_power
    
    # GPU power
    gpu = components.get('gpu')
    if gpu:
        gpu_name = f"{gpu.get('brand', '')} {gpu.get('model', '')}".lower()
        gpu_tdp = 0
        
        # Try to match with known GPUs
        for model, specs in GPU_SPECS.items():
            if model.lower() in gpu_name:
                gpu_tdp = specs['tdp_watts']
                break
        
        # If no match, estimate based on GPU class and naming patterns
        if gpu_tdp == 0:
            # NVIDIA RTX 5000 series
            if 'rtx' in gpu_name and ('5' in gpu_name or '50' in gpu_name):
                if '5090' in gpu_name:
                    gpu_tdp = 575
                elif '5080' in gpu_name:
                    gpu_tdp = 360
                elif '5070 ti' in gpu_name or '5070ti' in gpu_name:
                    gpu_tdp = 300
                elif '5070' in gpu_name:
                    gpu_tdp = 250
                elif '5060 ti' in gpu_name or '5060ti' in gpu_name:
                    gpu_tdp = 200
                elif '5060' in gpu_name:
                    gpu_tdp = 170
                else:
                    gpu_tdp = 250  # Default RTX 5000 series estimate
            
            # AMD RX 9000 series
            elif 'rx' in gpu_name and ('9' in gpu_name or '90' in gpu_name):
                if '9700 xt' in gpu_name:
                    gpu_tdp = 320
                elif '9700' in gpu_name:
                    gpu_tdp = 290
                elif '9600 xt' in gpu_name:
                    gpu_tdp = 250
                elif '9600' in gpu_name:
                    gpu_tdp = 225
                else:
                    gpu_tdp = 275  # Default RX 9000 series estimate
            
            # Intel Arc B580
            elif 'arc' in gpu_name and 'b580' in gpu_name:
                gpu_tdp = 200
                
            else:
                # Default value if no match is found
                gpu_tdp = 250
        
        total_power += gpu_tdp
        power_breakdown['GPU'] = gpu_tdp
    
    # Memory power (typical RAM uses 3-5W per module)
    memory = components.get('memory')
    if memory:
        memory_modules = memory.get('specs', {}).get('modules', '')
        module_count = 0
        
        # Try to extract module count from specs
        if memory_modules and 'x' in memory_modules:
            try:
                module_count = int(memory_modules.split('x')[0].strip())
            except:
                module_count = 2  # Default to 2 modules
        else:
            module_count = 2  # Default to 2 modules
        
        memory_power = module_count * COMPONENT_POWER_ESTIMATES['memory_per_stick']
        total_power += memory_power
        power_breakdown['Memory'] = memory_power
    
    # Storage power (SSDs ~3-7W, HDDs ~8-15W)
    storage = components.get('storage')
    if storage:
        storage_type = storage.get('specs', {}).get('form_factor', '').upper()
        
        if 'M.2' in storage_type or 'SSD' in storage_type:
            storage_power = COMPONENT_POWER_ESTIMATES['ssd']
        else:
            storage_power = COMPONENT_POWER_ESTIMATES['hdd']
        
        total_power += storage_power
        power_breakdown['Storage'] = storage_power
    
    # Add other components (fans, USB devices, etc.)
    other_power = COMPONENT_POWER_ESTIMATES['fan_per_unit'] * 3  # Assume 3 fans
    other_power += COMPONENT_POWER_ESTIMATES['rgb_lighting']     # RGB lighting
    other_power += COMPONENT_POWER_ESTIMATES['usb_devices']      # USB devices
    
    total_power += other_power
    power_breakdown['Other Components'] = other_power
    
    # Add overhead for power spikes and overclocking
    overhead = int(total_power * COMPONENT_POWER_ESTIMATES['overclocking_overhead'])
    total_power += overhead
    power_breakdown['Overhead'] = overhead
    
    # Round up to nearest 50W (common PSU increments)
    recommended_psu = total_power + (50 - total_power % 50) if total_power % 50 else total_power
    
    # Ensure minimum reasonable PSU wattage
    if recommended_psu < 450:
        recommended_psu = 450
    
    # Add buffer for high-end GPUs
    if 'GPU' in power_breakdown and power_breakdown['GPU'] > 350:
        if recommended_psu < 850:
            recommended_psu = 850
    
    return {
        'total_estimated_watts': total_power,
        'recommended_psu_watts': recommended_psu,
        'breakdown': power_breakdown
    }

if __name__ == '__main__':
    app.run(debug=True)