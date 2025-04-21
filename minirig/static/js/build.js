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
    const shareBuildButton = document.getElementById('share-build');
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
            const response = await fetch('/api/components');
            const data = await response.json();
            
            // Sort components by type
            data.forEach(component => {
                if (components[component.type]) {
                    components[component.type].push(component);
                }
            });
            
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
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
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
            option.textContent = `${item.brand} ${item.model} - $${item.price.toFixed(2)}`;
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
                const response = await fetch(`/api/compatibility/${selectedComponents.cpu.id}`);
                const compatibilityData = await response.json();
                
                const isCompatibleWithMotherboard = compatibilityData.some(
                    rule => rule.type === 'motherboard' && parseInt(rule.component_id) === selectedComponents.motherboard.id
                );
                
                if (!isCompatibleWithMotherboard) {
                    isCompatible = false;
                    compatibilityIssues.push('CPU is not compatible with selected motherboard');
                }
            } catch (error) {
                console.error('Error checking CPU compatibility:', error);
            }
        }
        
        // Check case and motherboard compatibility
        if (selectedComponents.case && selectedComponents.motherboard) {
            // For ITX builds, we assume all ITX motherboards fit in ITX cases
            // In a real implementation, we would check specific case compatibility
        }
        
        // Check case and GPU compatibility
        if (selectedComponents.case && selectedComponents.gpu) {
            // Check if GPU length fits in case
            if (selectedComponents.case.specs && selectedComponents.case.specs.max_gpu_length && 
                selectedComponents.gpu.dimensions && selectedComponents.gpu.dimensions.length) {
                
                if (selectedComponents.gpu.dimensions.length > selectedComponents.case.specs.max_gpu_length) {
                    isCompatible = false;
                    compatibilityIssues.push('GPU is too long for selected case');
                }
            }
        }
        
        // Check power supply wattage requirements
        if (selectedComponents.psu && selectedComponents.cpu && selectedComponents.gpu) {
            // Calculate estimated power requirements
            let estimatedPower = 0;
            
            // Add CPU power (simplified)
            if (selectedComponents.cpu.specs && selectedComponents.cpu.specs.tdp) {
                estimatedPower += selectedComponents.cpu.specs.tdp;
            } else {
                estimatedPower += 95; // Default TDP estimation
            }
            
            // Add GPU power (simplified)
            if (selectedComponents.gpu.specs && selectedComponents.gpu.specs.tdp) {
                estimatedPower += selectedComponents.gpu.specs.tdp;
            } else {
                estimatedPower += 150; // Default TDP estimation
            }
            
            // Add base system power (simplified)
            estimatedPower += 100;
            
            // Check if PSU provides enough power
            if (selectedComponents.psu.specs && selectedComponents.psu.specs.wattage) {
                if (selectedComponents.psu.specs.wattage < estimatedPower) {
                    isCompatible = false;
                    compatibilityIssues.push('Power supply wattage is insufficient for components');
                }
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
        
        // Example recommendations based on selected components
        
        // Recommend SFX power supply for small cases
        if (selectedComponents.case) {
            const caseVolume = calculateCaseVolume(selectedComponents.case);
            
            if (caseVolume < 20) { // Arbitrary threshold for small cases
                addRecommendation('SFX Power Supply', 'Standard ATX power supplies won\'t fit in this compact case');
            }
        }
        
        // Recommend low-profile CPU cooler for slim cases
        if (selectedComponents.case && selectedComponents.case.dimensions) {
            const dimensions = selectedComponents.case.dimensions;
            if (dimensions.width < 200) { // Arbitrary threshold for slim cases
                addRecommendation('Low-Profile CPU Cooler', 'This slim case has limited clearance for CPU coolers');
            }
        }
        
        // Recommend M.2 storage for small form factor builds
        if (selectedComponents.motherboard && !selectedComponents.storage) {
            addRecommendation('M.2 NVMe SSD', 'Save space and improve performance with M.2 storage');
        }
        
        // Recommend low-profile RAM for builds with large CPU coolers
        if (selectedComponents.cooler && selectedComponents.cooler.specs && 
            selectedComponents.cooler.specs.height && selectedComponents.cooler.specs.height > 150) {
            addRecommendation('Low-Profile RAM', 'Tall RAM modules may interfere with your CPU cooler');
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
    
    // Helper function to calculate case volume (in liters)
    function calculateCaseVolume(caseComponent) {
        if (!caseComponent.dimensions) return 0;
        
        const { length, width, height } = caseComponent.dimensions;
        return (length * width * height) / 1000000; // Convert mm³ to liters
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
                alert(`Build saved! Share code: ${data.share_code}`);
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
        
        // Update UI
        updateSelectedComponents();
        
        // Reset compatibility status
        document.querySelector('.compatibility-status').className = 'compatibility-status';
        compatibilityMessage.textContent = 'Select components to check compatibility';
        
        // Reset recommendations
        recommendationsContainer.innerHTML = '';
        noRecommendations.style.display = 'block';
    }
    
    // Share build (generate shareable URL)
    async function shareBuild() {
        // Check if build is saved first
        const buildName = buildNameInput.value.trim() || 'Untitled Build';
        
        // Get component IDs
        const componentIds = Object.values(selectedComponents)
            .filter(component => component !== null)
            .map(component => component.id);
        
        if (componentIds.length === 0) {
            alert('Please select at least one component before sharing');
            return;
        }
        
        // Save build first if not already saved
        const buildData = await saveBuild();
        
        if (buildData && buildData.share_code) {
            const shareUrl = `${window.location.origin}/build?code=${buildData.share_code}`;
            
            // Create a temporary input to copy the URL to clipboard
            const tempInput = document.createElement('input');
            tempInput.value = shareUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            
            alert(`Shareable URL copied to clipboard: ${shareUrl}`);
        }
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
    shareBuildButton.addEventListener('click', shareBuild);
    
    // Check if we're loading a shared build
    function loadSharedBuild() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareCode = urlParams.get('code');
        
        if (shareCode) {
            fetch(`/api/builds/${shareCode}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.components) {
                        // Set build name
                        buildNameInput.value = data.name;
                        
                        // Load all components from the shared build
                        fetchComponents().then(() => {
                            // Set selected components based on shared build
                            data.components.forEach(component => {
                                const type = component.type;
                                if (components[type]) {
                                    selectedComponents[type] = component;
                                    
                                    // Update dropdown selection
                                    const select = document.getElementById(`${type}-select`);
                                    if (select) {
                                        select.value = component.id;
                                    }
                                }
                            });
                            
                            // Update UI
                            updateSelectedComponents();
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading shared build:', error);
                });
        } else {
            // No shared build, just load components
            fetchComponents();
        }
    }
    
    // Initialize - either load a shared build or just load components
    loadSharedBuild();
});