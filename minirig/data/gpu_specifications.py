
"""
GPU specifications for case compatibility and power calculations.
"""

GPU_SPECS = {
    # NVIDIA RTX 5000 Series
    "RTX 5090": {
        "length_mm": 325,  # Max length
        "width_mm": 140,
        "height_mm": 61,  # Triple-slot
        "tdp_watts": 575,
        "power_connector": "16-pin",
        "recommended_psu": 1000
    },
    "RTX 5080": {
        "length_mm": 310,
        "width_mm": 140,
        "height_mm": 61,  # Triple-slot
        "tdp_watts": 360,
        "power_connector": "16-pin",
        "recommended_psu": 850
    },
    "RTX 5070 Ti": {
        "length_mm": 285,
        "width_mm": 112,
        "height_mm": 51,
        "tdp_watts": 300,
        "power_connector": "16-pin",
        "recommended_psu": 750
    },
    "RTX 5070": {
        "length_mm": 244,
        "width_mm": 112,
        "height_mm": 40,
        "tdp_watts": 250,
        "power_connector": "16-pin",
        "recommended_psu": 700
    },
    "RTX 5060 Ti": {
        "length_mm": 232,
        "width_mm": 112,
        "height_mm": 40,
        "tdp_watts": 200,
        "power_connector": "8-pin",
        "recommended_psu": 600
    },
    "RTX 5060": {
        "length_mm": 212,
        "width_mm": 112,
        "height_mm": 40,
        "tdp_watts": 170,
        "power_connector": "8-pin",
        "recommended_psu": 550
    },
    
    # AMD RX 9000 Series
    "RX 9700 XT": {
        "length_mm": 300,
        "width_mm": 130,
        "height_mm": 50,
        "tdp_watts": 320,
        "power_connector": "2x 8-pin",
        "recommended_psu": 800
    },
    "RX 9700": {
        "length_mm": 290,
        "width_mm": 125,
        "height_mm": 50,
        "tdp_watts": 290,
        "power_connector": "2x 8-pin",
        "recommended_psu": 750
    },
    "RX 9600 XT": {
        "length_mm": 270,
        "width_mm": 120,
        "height_mm": 45,
        "tdp_watts": 250,
        "power_connector": "1x 8-pin",
        "recommended_psu": 650
    },
    "RX 9600": {
        "length_mm": 260,
        "width_mm": 120,
        "height_mm": 45,
        "tdp_watts": 225,
        "power_connector": "1x 8-pin",
        "recommended_psu": 600
    },
    
    # Intel Arc B580 Series
    "Arc B580": {
        "length_mm": 250,
        "width_mm": 115,
        "height_mm": 40,
        "tdp_watts": 200,
        "power_connector": "8-pin",
        "recommended_psu": 600
    }
}

# CPU TDP estimates by category
CPU_TDP_ESTIMATES = {
    # Intel
    "Intel Core i9": 125,
    "Intel Core i7": 95,
    "Intel Core i5": 65,
    "Intel Core i3": 55,
    "Intel Core Ultra 9": 65,
    "Intel Core Ultra 7": 45,
    "Intel Core Ultra 5": 28,
    
    # AMD
    "AMD Ryzen 9": 170,
    "AMD Ryzen 7": 105,
    "AMD Ryzen 5": 65,
    "AMD Ryzen 3": 45
}

# Component power estimates
COMPONENT_POWER_ESTIMATES = {
    "motherboard": 35,
    "memory_per_stick": 5,
    "ssd": 5,
    "hdd": 10,
    "fan_per_unit": 3,
    "rgb_lighting": 10,
    "usb_devices": 10,
    "overclocking_overhead": 0.2  # 20% overhead for overclocking
}