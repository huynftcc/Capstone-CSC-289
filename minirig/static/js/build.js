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
            
            // Get capacity and form factor from specs
            const capacity = item.specs && item.specs.capacity ? item.specs.capacity : '';
            const formFactor = item.specs && item.specs.form_factor ? item.specs.form_factor : '';
            
            // Create a more informative display string
            option.textContent = `${item.brand} ${item.model} - ${capacity} ${formFactor} - $${item.price.toFixed(2)}`;
            
            storageSelect.appendChild(option);
        });
        
        // GPU dropdown
        components.gpu.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            
            // Try to extract GPU model and VRAM from specs
            let gpuModel = '';
            let vramSize = '';
            
            // Extract from specs if available
            if (item.specs) {
                if (item.specs.chip) {
                    gpuModel = item.specs.chip;
                }
                if (item.specs.memory) {
                    vramSize = item.specs.memory;
                }
            }
            
            // If not in specs, try to extract from model name
            if (!gpuModel || !vramSize) {
                const fullName = `${item.brand} ${item.model}`;
                
                // Try to extract GPU model (RTX 50xx, RX 9xxx, etc.)
                const modelMatch = fullName.match(/(RTX\s*\d{4}\s*[A-Za-z]*|RX\s*\d{4}\s*[A-Za-z]*)/i);
                if (modelMatch) {
                    gpuModel = modelMatch[0];
                }
                
                // Try to extract VRAM (xG, xGB)
                const vramMatch = fullName.match(/(\d+\s*[GT]B|\d+\s*G)/i);
                if (vramMatch) {
                    vramSize = vramMatch[0];
                }
            }
            
            // Format the display text with additional information
            let displayText = `${item.brand} ${item.model}`;
            
            // Add GPU model and VRAM if available
            if (gpuModel && vramSize) {
                displayText = `${item.brand} ${gpuModel} ${vramSize} - ${item.model}`;
            } else if (gpuModel) {
                displayText = `${item.brand} ${gpuModel} - ${item.model}`;
            } else if (vramSize) {
                displayText = `${item.brand} ${item.model} ${vramSize}`;
            }
            
            // Add price
            displayText += ` - $${item.price.toFixed(2)}`;
            
            option.textContent = displayText;
            gpuSelect.appendChild(option);
        });
        
        // PSU dropdown
        components.psu.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            
            // Extract or find wattage information
            let wattage = '';
            let efficiency = '';
            
            // Try to get from specs
            if (item.specs) {
                if (item.specs.wattage) {
                    wattage = item.specs.wattage;
                }
                if (item.specs.efficiency) {
                    efficiency = item.specs.efficiency;
                }
            }
            
            // If not in specs, try to extract from model name
            const fullName = `${item.brand} ${item.model}`;
            
            // Extract wattage if not already found
            if (!wattage) {
                const wattageMatch = fullName.match(/(\d{3,4})(?:\s*W|\s*watts|\s*watt)/i);
                if (wattageMatch) {
                    wattage = wattageMatch[1] + 'W';
                }
            }
            
            // Extract efficiency rating if not already found
            if (!efficiency) {
                // Look for common 80+ ratings
                const efficiencyMatch = fullName.match(/(titanium|platinum|gold|silver|bronze|white)/i);
                if (efficiencyMatch) {
                    efficiency = efficiencyMatch[1].toUpperCase();
                }
            }
            
            // Format the display text with the additional information
            let displayText = `${item.brand} ${item.model}`;
            
            // Add wattage and efficiency if available - with only one '80+'
            let specs = '';
            if (wattage && efficiency) {
                specs = `${wattage} ${efficiency}`;
            } else if (wattage) {
                specs = `${wattage}`;
            } else if (efficiency) {
                specs = `80+ ${efficiency}`;
            }
            
            // Add the specs to the display text - ensure we're not duplicating info already in the model name
            if (specs) {
                // Check if the model name already contains this information
                const modelHasWattage = item.model.includes(wattage);
                const modelHasEfficiency = item.model.toLowerCase().includes(efficiency.toLowerCase());
                const modelHas80Plus = item.model.toLowerCase().includes('80+') || item.model.toLowerCase().includes('80 plus');
                
                // Only add the full specs if neither are in the model name
                if (!modelHasWattage && !modelHasEfficiency) {
                    displayText = `${item.brand} ${item.model} (${specs})`;
                } 
                // Add only wattage if efficiency is already in the model
                else if (!modelHasWattage && modelHasEfficiency) {
                    displayText = `${item.brand} ${item.model} (${wattage})`;
                }
                // Add only efficiency if wattage is already in the model
                else if (modelHasWattage && !modelHasEfficiency && !modelHas80Plus) {
                    displayText = `${item.brand} ${item.model} ${efficiency}`;
                }
                // Don't add parentheses if both are already in the model name
            }
            
            // Add price
            displayText += ` - $${item.price.toFixed(2)}`;
            
            option.textContent = displayText;
            psuSelect.appendChild(option);
        });
        
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
            
            // Display incompatibility messages
            let message = '<strong>Incompatibility Detected:</strong> ' + 
                        compatibilityIssues.join('<br>');
            
            // Add recommendations immediately after incompatibility issues
            if (recommendationItems.length > 0) {
                message += '<br><br><strong>Recommendations:</strong><ul>';
                recommendationItems.forEach(item => {
                    message += `<li><strong>${item.title}</strong>: ${item.reason}</li>`;
                });
                message += '</ul>';
            }
            
            compatibilityMessage.innerHTML = message;
        } else if (compatibilityIssues.length > 0) {
            statusElement.className = 'compatibility-status warning';
            
            // Display warning messages
            let message = '<strong>Warning:</strong> ' + 
                        compatibilityIssues.join('<br>');
            
            // Add recommendations after warnings
            if (recommendationItems.length > 0) {
                message += '<br><br><strong>Recommendations:</strong><ul>';
                recommendationItems.forEach(item => {
                    message += `<li><strong>${item.title}</strong>: ${item.reason}</li>`;
                });
                message += '</ul>';
            }
            
            compatibilityMessage.innerHTML = message;
        } else {
            statusElement.className = 'compatibility-status compatible';
            
            let message = 'All components are compatible!';
            
            // Add recommendations even if everything is compatible
            if (recommendationItems.length > 0) {
                message += '<br><br><strong>Recommendations:</strong><ul>';
                recommendationItems.forEach(item => {
                    message += `<li><strong>${item.title}</strong>: ${item.reason}</li>`;
                });
                message += '</ul>';
            }
            
            compatibilityMessage.innerHTML = message;
        }
    }

    // Modify the addRecommendation function to store recommendations in an array
    // Add this variable at the top with other global variables
    let recommendationItems = [];

    // Replace the existing addRecommendation function
    function addRecommendation(title, reason) {
        recommendationItems.push({ title, reason });
        
        // Update the compatibility UI to show the new recommendation
        updateCompatibilityUI();
    }

    // Add a function to clear recommendations
    function clearRecommendations() {
        recommendationItems = [];
    }

    // Modify updateSelectedComponents to clear recommendations before checking
    function updateSelectedComponents() {
        // Clear current list
        selectedComponentsList.innerHTML = '';
        
        // Clear recommendations before generating new ones
        clearRecommendations();
        
        // Variables for calculating total price
        let totalPrice = 0;
        let hasComponents = false;
        
        // Rest of the existing function...
        
        // Update compatibility status
        checkCompatibility();
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

