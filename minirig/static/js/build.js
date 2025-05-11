// Build tool JavaScript file for MiniRig website

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const caseSelect = document.getElementById('case-select');
    const motherboardSelect = document.getElementById('motherboard-select');
    const cpuSelect = document.getElementById('cpu-select');
    const coolerSelect = document.getElementById('cooler-select');
    const memorySelect = document.getElementById('memory-select');
    const storageSelect = document.getElementById('storage-select');
    const gpuSelect = document.getElementById('gpu-select');
    const psuSelect = document.getElementById('psu-select');
    
    const compatibilityMessage = document.getElementById('compatibility-message');
    const selectedComponentsList = document.getElementById('selected-components-list');
    const totalPriceElement = document.getElementById('total-price');
    const recommendationsContainer = document.getElementById('recommendations-container');
    const noRecommendations = document.getElementById('no-recommendations');
    
    const saveBuildButton = document.getElementById('save-build');
    const clearBuildButton = document.getElementById('clear-build');
    const loadBuildButton = document.getElementById('load-build');
    const buildNameInput = document.getElementById('build-name');
    
    // Component data
    let components = {
        case: [],
        motherboard: [],
        cpu: [],
        cooler: [],
        memory: [],
        storage: [],
        gpu: [],
        psu: []
    };
    
    // Selected components
    let selectedComponents = {
        case: null,
        motherboard: null,
        cpu: null,
        cooler: null,
        memory: null,
        storage: null,
        gpu: null,
        psu: null
    };
    
    // Compatibility status
    let isCompatible = true;
    let compatibilityIssues = [];
    
    // Fetch components from API
    async function fetchComponents() {
        try {
            // Fetch all components
            const response = await fetch('/api/components');
            const data = await response.json();
            
            // Sort components by type
            data.forEach(component => {
                if (components[component.type]) {
                    components[component.type].push(component);
                }
            });
            
            // Sort components by price (low to high)
            for (const type in components) {
                if (components[type].length > 0) {
                    components[type].sort((a, b) => a.price - b.price);
                }
            }
            
            // Populate dropdowns
            populateDropdowns();
        } catch (error) {
            console.error('Error fetching components:', error);
        }
    }
    
    // Populate component dropdowns
    function populateDropdowns() {
        // Case dropdown
        components.case.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
            caseSelect.appendChild(option);
        });
        
        // Motherboard dropdown
        components.motherboard.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} (${item.specs.socket}) - $${item.price.toFixed(2)}`;
            motherboardSelect.appendChild(option);
        });
        
        // CPU dropdown
        components.cpu.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
            cpuSelect.appendChild(option);
        });
        
        // CPU Cooler dropdown
        components.cooler.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
            coolerSelect.appendChild(option);
        });
        
        // Memory dropdown
        components.memory.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} (${item.specs.speed}, ${item.specs.modules}) - $${item.price.toFixed(2)}`;
            memorySelect.appendChild(option);
        });
        
        // Storage dropdown
        components.storage.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
            storageSelect.appendChild(option);
        });
        
        // GPU dropdown
        components.gpu.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
            gpuSelect.appendChild(option);
        });
        
        // PSU dropdown
        components.psu.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
            psuSelect.appendChild(option);
        });
    }
    
    // Check compatibility between components
    async function checkCompatibility() {
        isCompatible = true;
        compatibilityIssues = [];
        
        // Reset compatibility UI
        compatibilityMessage.textContent = 'Checking compatibility...';
        document.querySelector('.compatibility-status').className = 'compatibility-status';
        
        // Check if components are selected
        const hasSelection = Object.values(selectedComponents).some(component => component !== null);
        
        if (!hasSelection) {
            compatibilityMessage.textContent = 'Select components to check compatibility';
            return;
        }
        
        // Check CPU and motherboard compatibility
        if (selectedComponents.cpu && selectedComponents.motherboard) {
            try {
                // Use the server-side compatibility check
                const response = await fetch(`/api/compatibility/${selectedComponents.cpu.id}`);
                const compatibilityData = await response.json();
                
                const mbCompatData = compatibilityData.find(
                    rule => rule.type === 'motherboard' && parseInt(rule.component_id) === selectedComponents.motherboard.id
                );
                
                if (mbCompatData && !mbCompatData.compatible) {
                    isCompatible = false;
                    compatibilityIssues.push(`CPU ${selectedComponents.cpu.brand} ${selectedComponents.cpu.model} is not compatible with motherboard socket ${selectedComponents.motherboard.specs.socket}`);
                }
            } catch (error) {
                console.error('Error checking CPU compatibility:', error);
            }
        }
        
        // Memory compatibility checks
        if (selectedComponents.motherboard && selectedComponents.memory) {
            // Check if memory exceeds motherboard's max capacity
            const memoryModules = selectedComponents.memory.specs.modules;
            const memoryCapacity = parseInt(memoryModules.split('x')[1]) * parseInt(memoryModules.split('x')[0]);
            
            const motherboardMemMax = selectedComponents.motherboard.specs.memory_max;
            
            if (memoryCapacity > motherboardMemMax) {
                isCompatible = false;
                compatibilityIssues.push(`Memory capacity (${memoryCapacity}GB) exceeds motherboard maximum (${motherboardMemMax}GB)`);
            }
            
            // Check if number of memory modules exceeds motherboard slots
            const memoryModuleCount = parseInt(memoryModules.split('x')[0]);
            const motherboardMemSlots = selectedComponents.motherboard.specs.memory_slots;
            
            if (memoryModuleCount > motherboardMemSlots) {
                isCompatible = false;
                compatibilityIssues.push(`Memory module count (${memoryModuleCount}) exceeds motherboard slots (${motherboardMemSlots})`);
            }
        }
        
        // Check case and GPU compatibility (simplified for demo)
        if (selectedComponents.case && selectedComponents.gpu) {
            // This is a simplified check - in a real implementation, you would check specific dimensions
            // For now, let's just assume all GPUs fit in all cases
        }
        
        // Check power supply wattage requirements (simplified for demo)
        if (selectedComponents.psu && selectedComponents.cpu && selectedComponents.gpu) {
            // Calculate estimated power requirements (simplistic approach)
            let estimatedPower = 0;
            
            // Add CPU power (simplified)
            if (selectedComponents.cpu.specs && selectedComponents.cpu.specs.tdp) {
                estimatedPower += selectedComponents.cpu.specs.tdp;
            } else {
                estimatedPower += 95; // Default TDP estimation
            }
            
            // Add GPU power (simplified)
            estimatedPower += 150; // Default GPU power estimation
            
            // Add base system power (simplified)
            estimatedPower += 100;
            
            // Get PSU wattage (simplified)
            let psuWattage = 0;
            if (selectedComponents.psu.specs && selectedComponents.psu.specs.wattage) {
                const wattageStr = selectedComponents.psu.specs.wattage;
                psuWattage = parseInt(wattageStr.replace('W', ''));
            }
            
            // Check if PSU provides enough power
            if (psuWattage > 0 && psuWattage < estimatedPower) {
                isCompatible = false;
                compatibilityIssues.push(`Power supply wattage (${psuWattage}W) may be insufficient for components (est. ${estimatedPower}W)`);
            }
        }
        
        // Update UI based on compatibility
        updateCompatibilityUI();
    }
    
    // Update UI based on compatibility results
    function updateCompatibilityUI() {
        const statusElement = document.querySelector('.compatibility-status');
        
        if (!isCompatible) {
            statusElement.className = 'compatibility-status incompatible';
            compatibilityMessage.textContent = 'Incompatibility Detected: ' + compatibilityIssues.join(', ');
        } else if (compatibilityIssues.length > 0) {
            statusElement.className = 'compatibility-status warning';
            compatibilityMessage.textContent = 'Warning: ' + compatibilityIssues.join(', ');
        } else {
            statusElement.className = 'compatibility-status compatible';
            compatibilityMessage.textContent = 'All components are compatible!';
        }
    }
    
    // Update selected components display
    function updateSelectedComponents() {
        // Clear current list
        selectedComponentsList.innerHTML = '';
        
        // Variables for calculating total price
        let totalPrice = 0;
        let hasComponents = false;
        
        // Add each selected component to the list
        Object.entries(selectedComponents).forEach(([type, component]) => {
            const item = document.createElement('div');
            item.className = 'component-item';
            
            const typeSpan = document.createElement('span');
            typeSpan.className = 'component-type';
            typeSpan.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}:`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'component-name';
            
            const priceSpan = document.createElement('span');
            priceSpan.className = 'component-price';
            
            if (component) {
                nameSpan.textContent = `${component.brand} ${component.model}`;
                priceSpan.textContent = `$${component.price.toFixed(2)}`;
                totalPrice += component.price;
                hasComponents = true;
            } else {
                nameSpan.textContent = 'Not selected';
                priceSpan.textContent = '$0.00';
            }
            
            item.appendChild(typeSpan);
            item.appendChild(nameSpan);
            item.appendChild(priceSpan);
            
            selectedComponentsList.appendChild(item);
        });
        
        // Update total price
        totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
        
        // Update compatibility status
        checkCompatibility();
        
        // Update recommendations
        if (hasComponents) {
            updateRecommendations();
        }
    }
    
    // Generate recommendations based on selected components
    function updateRecommendations() {
        // Clear current recommendations
        recommendationsContainer.innerHTML = '';
        
        // Hide "no recommendations" message if we have components selected
        if (Object.values(selectedComponents).some(component => component !== null)) {
            noRecommendations.style.display = 'none';
        } else {
            noRecommendations.style.display = 'block';
            return;
        }
        
        // CPU + Motherboard Compatibility Recommendation
        if (selectedComponents.cpu && !selectedComponents.motherboard) {
            // Recommend compatible motherboards
            fetchCompatibleMotherboards(selectedComponents.cpu.id);
        }
        
        // Memory Recommendation based on Motherboard
        if (selectedComponents.motherboard && !selectedComponents.memory) {
            recommendMemoryForMotherboard(selectedComponents.motherboard);
        }
        
        // SFX Power Supply recommendation for small cases
        if (selectedComponents.case) {
            // This is a simplistic check - in a real implementation, you would check case dimensions
            addRecommendation('SFX Power Supply', 'Consider an SFX power supply for better compatibility with ITX cases');
        }
        
        // M.2 NVMe storage recommendation
        if (!selectedComponents.storage) {
            addRecommendation('M.2 NVMe SSD', 'Save space and improve performance with M.2 storage');
        }
    }
    
    // Fetch compatible motherboards
    async function fetchCompatibleMotherboards(cpuId) {
        try {
            const response = await fetch(`/api/compatibility/${cpuId}`);
            const compatibilityData = await response.json();
            
            // Get compatible motherboard IDs
            const compatibleMbIds = compatibilityData
                .filter(item => item.type === 'motherboard' && item.compatible)
                .map(item => parseInt(item.component_id));
            
            if (compatibleMbIds.length > 0) {
                // Get compatible motherboards
                const compatibleMbs = components.motherboard.filter(mb => compatibleMbIds.includes(mb.id));
                
                if (compatibleMbs.length > 0) {
                    // Recommend the first compatible motherboard
                    const mb = compatibleMbs[0];
                    addRecommendation(
                        `${mb.brand} ${mb.model}`, 
                        `Compatible motherboard for your selected CPU, socket ${mb.specs.socket}`
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching compatible motherboards:', error);
        }
    }
    
    // Recommend memory based on motherboard
    function recommendMemoryForMotherboard(motherboard) {
        // Get memory compatible with this motherboard
        const compatibleMemory = components.memory.filter(mem => {
            // Check if memory capacity is within motherboard limits
            const memoryModules = mem.specs.modules;
            const memoryCapacity = parseInt(memoryModules.split('x')[1]) * parseInt(memoryModules.split('x')[0]);
            
            return memoryCapacity <= motherboard.specs.memory_max;
        });
        
        if (compatibleMemory.length > 0) {
            // Recommend a good value memory option
            const mem = compatibleMemory[Math.floor(compatibleMemory.length / 3)]; // Get one from the lower-mid range
            addRecommendation(
                `${mem.brand} ${mem.model}`, 
                `Good value memory option compatible with your motherboard`
            );
        }
    }
    
    // Helper function to add a recommendation card
    function addRecommendation(title, reason) {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        
        const titleElement = document.createElement('div');
        titleElement.className = 'recommendation-title';
        titleElement.textContent = title;
        
        const reasonElement = document.createElement('div');
        reasonElement.className = 'recommendation-reason';
        reasonElement.textContent = reason;
        
        card.appendChild(titleElement);
        card.appendChild(reasonElement);
        
        recommendationsContainer.appendChild(card);
    }
    
    // Save build to database
    async function saveBuild() {
        const buildName = buildNameInput.value.trim() || 'Untitled Build';
        
        // Get component IDs
        const componentIds = Object.values(selectedComponents)
            .filter(component => component !== null)
            .map(component => component.id);
        
        if (componentIds.length === 0) {
            alert('Please select at least one component before saving');
            return;
        }
        
        try {
            const response = await fetch('/api/builds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: buildName,
                    components: componentIds
                })
            });
            
            const data = await response.json();
            
            if (data.share_code) {
                // Display the share code in the UI
                const shareCodeDisplay = document.getElementById('share-code-display');
                const shareCodeText = document.getElementById('share-code-text');
                
                if (shareCodeDisplay && shareCodeText) {
                    shareCodeText.textContent = data.share_code;
                    shareCodeDisplay.style.display = 'block';
                }
                
                return data;
            } else {
                alert('Error saving build');
                return null;
            }
        } catch (error) {
            console.error('Error saving build:', error);
            alert('Error saving build');
            return null;
        }
    }
    
    // Clear all selected components
    function clearBuild() {
        // Reset dropdowns
        caseSelect.value = '';
        motherboardSelect.value = '';
        cpuSelect.value = '';
        coolerSelect.value = '';
        memorySelect.value = '';
        storageSelect.value = '';
        gpuSelect.value = '';
        psuSelect.value = '';
        
        // Reset selected components
        selectedComponents = {
            case: null,
            motherboard: null,
            cpu: null,
            cooler: null,
            memory: null,
            storage: null,
            gpu: null,
            psu: null
        };
        
        // Reset build name
        buildNameInput.value = '';
        
        // Hide share code display
        const shareCodeDisplay = document.getElementById('share-code-display');
        if (shareCodeDisplay) {
            shareCodeDisplay.style.display = 'none';
        }
        
        // Update UI
        updateSelectedComponents();
        
        // Reset compatibility status
        document.querySelector('.compatibility-status').className = 'compatibility-status';
        compatibilityMessage.textContent = 'Select components to check compatibility';
        
        // Reset recommendations
        recommendationsContainer.innerHTML = '';
noRecommendations.style.display = 'block';
}

// Load a build by share code
async function loadBuild() {
    // Show modal for entering share code
    const modal = document.getElementById('load-build-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Load build using share code from input
async function loadBuildByCode() {
    const codeInput = document.getElementById('share-code-input');
    const shareCode = codeInput.value.trim();
    
    if (!shareCode) {
        alert('Please enter a share code');
        return;
    }
    
    try {
        const response = await fetch(`/api/builds/${shareCode}`);
        const data = await response.json();
        
        if (data) {
            // Clear current build
            clearBuild();
            
            // Set build name
            buildNameInput.value = data.name || '';
            
            // Load components
            if (data.components && data.components.length > 0) {
                data.components.forEach(component => {
                    const type = component.type;
                    
                    // Update selected components
                    selectedComponents[type] = component;
                    
                    // Update dropdown selection
                    const select = document.getElementById(`${type}-select`);
                    if (select) {
                        select.value = component.id;
                    }
                });
                
                // Update UI
                updateSelectedComponents();
            }
            
            // Close modal
            const modal = document.getElementById('load-build-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        } else {
            alert('Build not found');
        }
    } catch (error) {
        console.error('Error loading build:', error);
        alert('Error loading build');
    }
}

// Share build function
function shareBuild() {
    saveBuild().then(data => {
        if (data && data.share_code) {
            // Create a shareable URL
            const shareableUrl = `${window.location.origin}${window.location.pathname}?code=${data.share_code}`;
            
            // Copy URL to clipboard
            navigator.clipboard.writeText(shareableUrl).then(() => {
                alert(`Build URL copied to clipboard: ${shareableUrl}`);
            }).catch(err => {
                alert(`Shareable URL: ${shareableUrl}`);
            });
        }
    });
}

// Event listeners for component selection
caseSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.case = components.case.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.case = null;
    }
    updateSelectedComponents();
});

motherboardSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.motherboard = components.motherboard.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.motherboard = null;
    }
    updateSelectedComponents();
});

cpuSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.cpu = components.cpu.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.cpu = null;
    }
    updateSelectedComponents();
});

coolerSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.cooler = components.cooler.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.cooler = null;
    }
    updateSelectedComponents();
});

memorySelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.memory = components.memory.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.memory = null;
    }
    updateSelectedComponents();
});

storageSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.storage = components.storage.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.storage = null;
    }
    updateSelectedComponents();
});

gpuSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.gpu = components.gpu.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.gpu = null;
    }
    updateSelectedComponents();
});

psuSelect.addEventListener('change', function() {
    const selectedId = this.value;
    if (selectedId) {
        selectedComponents.psu = components.psu.find(item => item.id === parseInt(selectedId));
    } else {
        selectedComponents.psu = null;
    }
    updateSelectedComponents();
});

// Event listeners for buttons
saveBuildButton.addEventListener('click', saveBuild);
clearBuildButton.addEventListener('click', clearBuild);
loadBuildButton.addEventListener('click', loadBuild);

// Modal close button
const closeModalBtn = document.querySelector('.close');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
        const modal = document.getElementById('load-build-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

// Load button in modal
const loadCodeButton = document.getElementById('load-code-button');
if (loadCodeButton) {
    loadCodeButton.addEventListener('click', loadBuildByCode);
}

// Close modal if clicked outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('load-build-modal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
});

// Check if we're loading a shared build
function checkForSharedBuild() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get('code');
    
    if (shareCode) {
        // Load the build with the share code
        const codeInput = document.getElementById('share-code-input');
        if (codeInput) {
            codeInput.value = shareCode;
            loadBuildByCode();
        }
    }
}

// Initialize
fetchComponents().then(() => {
    // Check for shared build after components are loaded
    checkForSharedBuild();
});
});

