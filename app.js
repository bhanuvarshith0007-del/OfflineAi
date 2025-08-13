        // Global state
        let selectedCategory = null;
        let currentInputMode = 'text';
        let isRecording = false;

        // Scroll to categories
        function scrollToCategories() {
            document.getElementById('health-categories').scrollIntoView({ behavior: 'smooth' });
        }

        // Handle emergency actions
        function handleEmergency(action) {
            const actions = {
                guide: "Emergency Guide: 1. Stay calm 2. Assess the situation 3. Call for help if possible 4. Apply first aid if trained",
                cpr: "CPR Instructions: 1. Check responsiveness 2. Call emergency services 3. 30 chest compressions 4. 2 rescue breaths 5. Repeat",
                contacts: "Emergency Contacts: 911 (US), 112 (EU), 999 (UK), 000 (AU) - Local emergency services vary by region",
                hospital: "Finding Hospital: Use GPS if available, ask locals, look for hospital signs with + symbol, call emergency services for directions"
            };
            
            showAdvice({
                type: 'immediate',
                title: 'Emergency Response Activated',
                content: actions[action],
                tags: ['Emergency', 'Immediate Action', 'Life-Saving'],
                confidence: 95
            });
        }

        // Select health category
        function selectCategory(category) {
            // Remove previous selection
            document.querySelectorAll('.health-category').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Add selection to clicked category
            event.target.closest('.health-category').classList.add('selected');
            selectedCategory = category;
        }

        // Set input mode
        function setInputMode(mode) {
            currentInputMode = mode;
            
            // Reset button styles
            document.querySelectorAll('#text-btn, #voice-btn, #image-btn').forEach(btn => {
                btn.className = 'btn btn-outline text-sm';
            });
            
            // Set active button
            const activeBtn = document.getElementById(`${mode}-btn`);
            activeBtn.className = 'btn btn-primary text-sm';
            
            const textarea = document.getElementById('input-textarea');
            const voiceText = document.getElementById('voice-text');
            
            if (mode === 'voice') {
                if (!isRecording) {
                    isRecording = true;
                    activeBtn.classList.add('recording');
                    voiceText.textContent = 'Recording...';
                    textarea.value = '🎤 Voice recording simulated...';
                    textarea.placeholder = 'Voice input active - speak your concern...';
                    
                    // Simulate recording for 3 seconds
                    setTimeout(() => {
                        isRecording = false;
                        activeBtn.classList.remove('recording');
                        voiceText.textContent = 'Voice';
                    }, 3000);
                }
            } else if (mode === 'image') {
                textarea.value = '📷 Image analysis simulated...';
                textarea.placeholder = 'Image analysis ready - upload or capture an image...';
            } else {
                textarea.placeholder = 'Describe your symptoms or health concern...';
            }
            
            updateSubmitButton();
        }

        // Update submit button state
        function updateSubmitButton() {
            const textarea = document.getElementById('input-textarea');
            const submitBtn = document.getElementById('submit-btn');
            
            if (textarea.value.trim()) {
                submitBtn.disabled = false;
                submitBtn.className = 'btn btn-primary';
            } else {
                submitBtn.disabled = true;
                submitBtn.className = 'btn btn-primary';
                submitBtn.style.opacity = '0.5';
            }
        }

        // Submit input
        function submitInput() {
            const textarea = document.getElementById('input-textarea');
            const content = textarea.value.trim();
            
            if (!content) return;
            
            // Show loading state
            showAdvice({
                type: 'general',
                title: 'Processing Your Request...',
                content: 'Our AI is analyzing your input. Please wait...',
                tags: ['Processing'],
                confidence: 0
            });
            
            // Simulate AI processing
            setTimeout(() => {
                showAdvice({
                    type: 'general',
                    title: 'AI Analysis Complete',
                    content: `Based on your ${currentInputMode} input, here's our offline AI recommendation: ${content.length > 50 ? content.substring(0, 50) + "..." : content}. This is a simulated response from the offline expert database covering medical protocols, first aid procedures, and health guidance.`,
                    tags: ['AI-Generated', 'Offline', selectedCategory || 'General', 'Expert-Verified'],
                    confidence: 87
                });
                
                // Clear input
                textarea.value = '';
                updateSubmitButton();
            }, 1500);
        }

        // Show advice
        function showAdvice(advice) {
            const display = document.getElementById('advice-display');
            
            const typeStyles = {
                immediate: {
                    bgColor: 'bg-emergency',
                    borderColor: 'border: 2px solid hsl(var(--emergency))',
                    iconColor: 'text-emergency',
                    icon: '⚠️'
                },
                general: {
                    bgColor: 'bg-primary',
                    borderColor: 'border: 2px solid hsl(var(--primary))',
                    iconColor: 'text-primary',
                    icon: 'ℹ️'
                }
            };
            
            const style = typeStyles[advice.type] || typeStyles.general;
            
            if (advice.confidence === 0) {
                // Loading state
                display.innerHTML = `
                    <div class="card p-6" style="${style.borderColor}; background: hsl(var(--primary) / 0.1);">
                        <div class="space-y-4">
                            <div class="flex items-start space-x-3">
                                <div class="p-2 rounded-full bg-white shadow-sm">
                                    <div class="animate-pulse">⏳</div>
                                </div>
                                <div class="flex-1">
                                    <h3 class="font-semibold text-lg">${advice.title}</h3>
                                    <p class="leading-relaxed mb-4">${advice.content}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Normal advice display
                const tagsHtml = advice.tags.map(tag => `<span class="badge">${tag}</span>`).join('');
                
                display.innerHTML = `
                    <div class="card p-6" style="${style.borderColor}; background: hsl(var(--primary) / 0.1);">
                        <div class="space-y-4">
                            <div class="flex items-start space-x-3">
                                <div class="p-2 rounded-full bg-white shadow-sm">
                                    <div class="${style.iconColor}">${style.icon}</div>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center justify-between mb-2">
                                        <h3 class="font-semibold text-lg">${advice.title}</h3>
                                        <div class="flex items-center space-x-2">
                                            <span class="badge badge-outline text-xs">${advice.confidence}% confidence</span>
                                            <span class="text-green-600">✓</span>
                                        </div>
                                    </div>
                                    <p class="leading-relaxed mb-4">${advice.content}</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${tagsHtml}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        // Event listeners
        document.getElementById('input-textarea').addEventListener('input', updateSubmitButton);
        document.getElementById('input-textarea').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitInput();
            }
        });

        // Initialize
        updateSubmitButton();