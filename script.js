// ==================== Constants ====================
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ==================== State ====================
const state = {
  selectedDays: new Set(),
  exceptions: new Set(),
  calendarDate: new Date(),
  calendarMonthsLoaded: 3,
  eventOccurrences: [],
  generatedICS: null,
  currentEventId: null,  // Track current event for updates
  formTouched: false,    // Track if user has interacted with the form
  reminders: []          // Array of reminder times in minutes
};

// ==================== LocalStorage Keys ====================
const STORAGE_KEYS = {
  FORM_STATE: 'icalCreator_formState',
  SAVED_EVENTS: 'icalCreator_savedEvents',
  PREFERRED_TIMEZONE: 'icalCreator_preferredTimezone'
};

// ==================== DOM Elements ====================
const form = document.getElementById('eventForm');
const allDayCheckbox = document.getElementById('allDay');
const startTimeGroup = document.getElementById('startTimeGroup');
const endTimeGroup = document.getElementById('endTimeGroup');
const isRecurringCheckbox = document.getElementById('isRecurring');
const recurrenceOptions = document.getElementById('recurrenceOptions');
const frequencySelect = document.getElementById('frequency');
const weeklyDaysGroup = document.getElementById('weeklyDaysGroup');
const monthlyTypeGroup = document.getElementById('monthlyTypeGroup');
const dayPickerBtns = document.querySelectorAll('.day-picker-btn');
const endTypeRadios = document.querySelectorAll('input[name="endType"]');
const recurrenceEndDateInput = document.getElementById('recurrenceEndDate');
const occurrenceCountInput = document.getElementById('occurrenceCount');
const neverEndWarning = document.getElementById('neverEndWarning');
const hasReminderCheckbox = document.getElementById('hasReminder');
const reminderOptions = document.getElementById('reminderOptions');
const reminderList = document.getElementById('reminderList');
const addReminderBtn = document.getElementById('addReminderBtn');
const reminderHint = document.getElementById('reminderHint');
const MAX_REMINDERS = 5;
const REMINDER_OPTIONS = [
  { value: '5', label: '5 minutes before' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' }
];
const previewSection = document.getElementById('previewSection');
const calendarGrid = document.getElementById('calendarGrid');
const calendarMonthYear = document.getElementById('calendarMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const exceptionCountEl = document.getElementById('exceptionCount');
const exceptionCountText = document.getElementById('exceptionCountText');
const exceptionListEl = document.getElementById('exceptionList');
const validationStatus = document.getElementById('validationStatus');
const validationTitle = document.getElementById('validationTitle');
const validationMessage = document.getElementById('validationMessage');
const downloadBtn = document.getElementById('downloadBtn');
const downloadHint = document.getElementById('downloadHint');
const newEventBtn = document.getElementById('newEventBtn');
const timezoneSelect = document.getElementById('timezone');
const savedEventsSection = document.getElementById('savedEventsSection');
const savedEventsList = document.getElementById('savedEventsList');
const clearAllBtn = document.getElementById('clearAllBtn');
const clearLocalStorageBtn = document.getElementById('clearLocalStorageBtn');
const resetTimezoneBtn = document.getElementById('resetTimezoneBtn');
const privacyInfoBtn = document.getElementById('privacyInfoBtn');
const privacyModal = document.getElementById('privacyModal');
const privacyModalClose = document.getElementById('privacyModalClose');
const emojiPickerBtn = document.getElementById('emojiPickerBtn');
const emojiPicker = document.getElementById('emojiPicker');
const emojiGrid = document.getElementById('emojiGrid');
const presetBtns = document.querySelectorAll('.preset-btn');
const durationBtns = document.querySelectorAll('.duration-btn');
const durationDisplay = document.getElementById('durationDisplay');

// ==================== Emoji Picker Data ====================
const EMOJI_LIST = [
  // Calendar & Events
  '📅', '📆', '🗓️', '📌', '🎯', '⏰', '⏱️', '🔔',
  // Celebrations
  '🎉', '🎊', '🎈', '🎁', '🎂', '🥳', '🎇', '🎆',
  // Activities
  '🏃', '🚴', '🏊', '⚽', '🏀', '🎾', '🏋️', '🧘',
  // Work & Meetings
  '💼', '📊', '📈', '💻', '📱', '📞', '✉️', '📝',
  // Food & Drinks
  '☕', '🍽️', '🍕', '🍔', '🥗', '🍰', '🍷', '🍺',
  // Travel
  '✈️', '🚗', '🚂', '🏨', '🏖️', '⛷️', '🏕️', '🗺️',
  // Health & Wellness
  '🏥', '💊', '🩺', '🧠', '❤️', '💪', '🧘', '😴',
  // Education
  '📚', '📖', '✏️', '🎓', '🔬', '🎨', '🎵', '🎸',
  // Nature & Weather
  '🌅', '🌙', '⭐', '☀️', '🌧️', '❄️', '🌸', '🌻',
  // Symbols
  '✅', '❌', '⚠️', '💡', '🔑', '🏠', '👥', '💬'
];

// ==================== Initialization ====================
function init() {
  populateTimezones();
  setDefaultDates();
  restoreFormState();
  attachEventListeners();
  updateFrequencyOptions();
  updateMonthlyHints();
  loadDemoEventsIfEmpty();
  renderSavedEvents();
  updateDebugInfo();
  updateDownloadButtonState();
  renderEmojiPicker();
  updateDurationDisplay();

  // Show preview on initial load if there's a start date
  const startDate = document.getElementById('startDate').value;
  if (startDate) {
    calculateOccurrences();
    renderCalendar(true);
    previewSection.style.display = 'block';
    updatePreviewContent(isRecurringCheckbox.checked);
  }
}

function updateDebugInfo() {
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const selectedTz = timezoneSelect.value;
  const preferredTz = getPreferredTimezone();
  const hasLocalStorage = !!localStorage.getItem(STORAGE_KEYS.FORM_STATE);

  document.getElementById('debugDetectedTz').textContent = detectedTz;
  document.getElementById('debugPreferredTz').textContent = preferredTz || '(none - using detected)';
  document.getElementById('debugSelectedTz').textContent = selectedTz;
  document.getElementById('debugLocalStorage').textContent = hasLocalStorage ? 'Yes' : 'No';
}

function clearAllLocalStorage() {
  localStorage.removeItem(STORAGE_KEYS.FORM_STATE);
  localStorage.removeItem(STORAGE_KEYS.SAVED_EVENTS);
  location.reload();
}

function openPrivacyModal() {
  privacyModal.classList.add('show');
  privacyModal.setAttribute('aria-hidden', 'false');
  privacyModalClose.focus();
}

function closePrivacyModal() {
  privacyModal.classList.remove('show');
  privacyModal.setAttribute('aria-hidden', 'true');
  privacyInfoBtn.focus();
}

// ==================== Emoji Picker ====================
function renderEmojiPicker() {
  emojiGrid.innerHTML = '';
  EMOJI_LIST.forEach(emoji => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'emoji-item';
    button.textContent = emoji;
    button.setAttribute('aria-label', `Insert ${emoji}`);
    button.addEventListener('click', () => insertEmoji(emoji));
    emojiGrid.appendChild(button);
  });
}

function toggleEmojiPicker() {
  const isOpen = emojiPicker.classList.contains('show');
  if (isOpen) {
    closeEmojiPicker();
  } else {
    openEmojiPicker();
  }
}

function openEmojiPicker() {
  emojiPicker.classList.add('show');
  emojiPicker.setAttribute('aria-hidden', 'false');
  // Focus first emoji
  const firstEmoji = emojiGrid.querySelector('.emoji-item');
  if (firstEmoji) firstEmoji.focus();
}

function closeEmojiPicker() {
  emojiPicker.classList.remove('show');
  emojiPicker.setAttribute('aria-hidden', 'true');
}

function insertEmoji(emoji) {
  const titleInput = document.getElementById('title');
  const cursorPos = titleInput.selectionStart;
  const textBefore = titleInput.value.substring(0, cursorPos);
  const textAfter = titleInput.value.substring(titleInput.selectionEnd);

  titleInput.value = textBefore + emoji + textAfter;

  // Set cursor position after the inserted emoji
  const newCursorPos = cursorPos + emoji.length;
  titleInput.setSelectionRange(newCursorPos, newCursorPos);
  titleInput.focus();

  // Trigger input event for form state saving
  titleInput.dispatchEvent(new window.Event('input', { bubbles: true }));

  closeEmojiPicker();
}

// ==================== Date Presets ====================
function handlePresetClick(preset) {
  const date = getPresetDate(preset);
  if (date) {
    document.getElementById('startDate').value = formatDateForInput(date);
    updatePresetSelection(preset);
    // Trigger date change logic
    updateMonthlyHints();
    calculateOccurrences();
    renderCalendar();
    previewSection.style.display = 'block';
    updatePreviewContent(isRecurringCheckbox.checked);
    saveFormState();
  }
}

function getPresetDate(preset) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
  case 'today':
    return today;

  case 'tomorrow':
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;

  case 'nextWeek':
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;

  case 'nextMonth':
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    // Handle month overflow (e.g., Jan 31 -> Feb 28)
    if (nextMonth.getDate() !== today.getDate()) {
      // Go to last day of previous month
      nextMonth.setDate(0);
    }
    return nextMonth;

  default:
    return null;
  }
}

function updatePresetSelection(selectedPreset) {
  presetBtns.forEach(btn => {
    if (btn.dataset.preset === selectedPreset) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function clearPresetSelection() {
  presetBtns.forEach(btn => {
    btn.classList.remove('active');
  });
}

// ==================== Duration Helper ====================
function handleDurationClick(duration) {
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;

  if (duration === 'allday') {
    // Enable all-day checkbox
    allDayCheckbox.checked = true;
    handleAllDayToggle();
    updateDurationSelection(duration);
    saveFormState();
    return;
  }

  // Need start date and time for duration presets
  if (!startDate || !startTime) {
    return;
  }

  // Calculate end time based on duration in minutes
  const minutes = parseInt(duration, 10);
  const [startHours, startMins] = startTime.split(':').map(Number);
  const startTotalMins = startHours * 60 + startMins;
  const endTotalMins = startTotalMins + minutes;

  // Calculate end date and time
  let endDate = startDate;
  let endHours = Math.floor(endTotalMins / 60);
  const endMins = endTotalMins % 60;

  // Handle day overflow
  if (endHours >= 24) {
    const dateObj = new Date(startDate + 'T00:00:00');
    dateObj.setDate(dateObj.getDate() + Math.floor(endHours / 24));
    endDate = formatDateForInput(dateObj);
    endHours = endHours % 24;
  }

  const endTimeStr = String(endHours).padStart(2, '0') + ':' + String(endMins).padStart(2, '0');

  document.getElementById('endDate').value = endDate;
  document.getElementById('endTime').value = endTimeStr;

  updateDurationSelection(duration);
  updateDurationDisplay();
  saveFormState();
}

function updateDurationSelection(duration) {
  durationBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.duration === duration);
  });
}

function clearDurationSelection() {
  durationBtns.forEach(btn => btn.classList.remove('active'));
}

function updateDurationDisplay() {
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;
  const endDate = document.getElementById('endDate').value;
  const endTime = document.getElementById('endTime').value;

  // If all-day is checked, show all-day duration
  if (allDayCheckbox.checked) {
    if (startDate && endDate && startDate !== endDate) {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      durationDisplay.textContent = days + ' day' + (days > 1 ? 's' : '');
      durationDisplay.classList.remove('warning');
    } else {
      durationDisplay.textContent = 'All day';
      durationDisplay.classList.remove('warning');
    }
    return;
  }

  // Need both start and end times to calculate duration
  if (!startTime || !endTime) {
    durationDisplay.textContent = '';
    return;
  }

  // Calculate duration
  const startDateTime = new Date((startDate || '2000-01-01') + 'T' + startTime);
  const endDateTime = new Date((endDate || startDate || '2000-01-01') + 'T' + endTime);

  const diffMs = endDateTime - startDateTime;
  const diffMins = Math.round(diffMs / (1000 * 60));

  if (diffMins < 0) {
    durationDisplay.textContent = 'Invalid duration';
    durationDisplay.classList.add('warning');
    return;
  }

  durationDisplay.classList.remove('warning');

  if (diffMins === 0) {
    durationDisplay.textContent = '0 min';
  } else if (diffMins < 60) {
    durationDisplay.textContent = diffMins + ' min';
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (mins === 0) {
      durationDisplay.textContent = hours + ' hour' + (hours > 1 ? 's' : '');
    } else {
      durationDisplay.textContent = hours + 'h ' + mins + 'm';
    }
  }
}

function getPreferredTimezone() {
  try {
    return localStorage.getItem(STORAGE_KEYS.PREFERRED_TIMEZONE);
  } catch (_e) {
    return null;
  }
}

function setPreferredTimezone(tz) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERRED_TIMEZONE, tz);
  } catch (_e) {
    console.warn('Could not save preferred timezone');
  }
}

function clearPreferredTimezone() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PREFERRED_TIMEZONE);
  } catch (_e) {
    console.warn('Could not clear preferred timezone');
  }
}

function populateTimezones() {
  const commonTimezones = [
    'UTC',
    // Americas
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Sao_Paulo',
    // Europe
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Zurich',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Stockholm',
    'Europe/Vienna',
    'Europe/Warsaw',
    'Europe/Moscow',
    // Asia
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Seoul',
    // Oceania
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland'
  ];

  // Try to get user's timezone - prefer saved preference over browser detection
  const preferredTz = getPreferredTimezone();
  let detectedTimezone = 'UTC';
  try {
    detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (_e) {
    console.warn('Could not detect timezone');
  }

  // Use preferred timezone if set, otherwise use detected
  const defaultTimezone = preferredTz || detectedTimezone;

  // Add detected timezone to list if not already in list
  if (detectedTimezone && !commonTimezones.includes(detectedTimezone)) {
    commonTimezones.unshift(detectedTimezone);
  }

  // Sort: put default timezone first, then alphabetically by region
  const sortedTimezones = [...commonTimezones].sort((a, b) => {
    if (a === defaultTimezone) return -1;
    if (b === defaultTimezone) return 1;
    return a.localeCompare(b);
  });

  sortedTimezones.forEach(tz => {
    const option = document.createElement('option');
    option.value = tz;
    // Format: "Europe/Zurich" -> "Europe/Zurich" (keep readable)
    option.textContent = tz.replace(/_/g, ' ');
    if (tz === defaultTimezone) {
      option.selected = true;
    }
    timezoneSelect.appendChild(option);
  });
}

function setDefaultDates() {
  const today = new Date();
  const startDateInput = document.getElementById('startDate');
  startDateInput.value = formatDateForInput(today);

  // Default recurrence end date to 3 months from now
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  recurrenceEndDateInput.value = formatDateForInput(threeMonthsLater);

  // Set calendar to start date
  state.calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
     * Convert a local time in a given timezone to UTC.
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @param {string} timeStr - Time in HH:MM format
     * @param {string} timezone - IANA timezone name (e.g., 'Europe/Berlin')
     * @returns {string} ISO datetime string in UTC (YYYY-MM-DDTHH:MM:SS)
     */
function convertLocalToUTC(dateStr, timeStr, timezone) {
  if (timezone === 'UTC') {
    return `${dateStr}T${timeStr}:00`;
  }

  // Parse input
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Create a UTC date with these values (as if the input were UTC)
  const asIfUTC = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  // See what this UTC time looks like in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(asIfUTC);
  const get = (type) => Number(parts.find(p => p.type === type).value);

  // What time is asIfUTC in the target timezone?
  const inTzYear = get('year');
  const inTzMonth = get('month');
  const inTzDay = get('day');
  const inTzHour = get('hour');
  const inTzMinute = get('minute');

  // Calculate offset: difference between what we want and what we got
  const wantedLocal = new Date(year, month - 1, day, hours, minutes, 0);
  const gotLocal = new Date(inTzYear, inTzMonth - 1, inTzDay, inTzHour, inTzMinute, 0);

  const diffMs = wantedLocal - gotLocal;

  // Apply the difference to our UTC guess
  const actualUTC = new Date(asIfUTC.getTime() + diffMs);

  return actualUTC.toISOString().slice(0, 19);
}

// ==================== Event Listeners ====================
function attachEventListeners() {
  // All-day toggle
  allDayCheckbox.addEventListener('change', handleAllDayToggle);

  // Recurring toggle
  isRecurringCheckbox.addEventListener('change', handleRecurringToggle);

  // Frequency change
  frequencySelect.addEventListener('change', updateFrequencyOptions);

  // Day picker
  dayPickerBtns.forEach(btn => {
    btn.addEventListener('click', () => toggleDay(btn));
  });

  // End type
  endTypeRadios.forEach(radio => {
    radio.addEventListener('change', handleEndTypeChange);
  });

  // Reminder toggle
  hasReminderCheckbox.addEventListener('change', handleReminderToggle);

  // Add reminder button
  addReminderBtn.addEventListener('click', () => addReminder());

  // Calendar navigation
  prevMonthBtn.addEventListener('click', () => navigateCalendar(-1));
  nextMonthBtn.addEventListener('click', () => navigateCalendar(1));

  // Exception list toggle
  exceptionCountEl.addEventListener('click', toggleExceptionList);
  exceptionCountEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExceptionList();
    }
  });

  // Start date change - update monthly hints and calendar
  document.getElementById('startDate').addEventListener('change', () => {
    updateMonthlyHints();
    // Update preview for both recurring and non-recurring events
    const startDate = document.getElementById('startDate').value;
    if (startDate) {
      calculateOccurrences();
      renderCalendar(true);
      // Always show and update preview when there's a valid start date
      previewSection.style.display = 'block';
      updatePreviewContent(isRecurringCheckbox.checked);
    }
  });

  // New event button
  newEventBtn.addEventListener('click', handleNewEvent);

  // Form submit
  form.addEventListener('submit', handleSubmit);

  // Keyboard navigation for calendar
  calendarGrid.addEventListener('keydown', handleCalendarKeydown);

  // Clear all saved events
  clearAllBtn.addEventListener('click', clearAllSavedEvents);

  // Clear all localStorage (debug)
  clearLocalStorageBtn.addEventListener('click', clearAllLocalStorage);

  // Reset timezone to detected (debug)
  resetTimezoneBtn.addEventListener('click', () => {
    clearPreferredTimezone();
    // Also clear timezone from form state so it doesn't override
    const formState = getFormState();
    if (formState) {
      delete formState.timezone;
      localStorage.setItem(STORAGE_KEYS.FORM_STATE, JSON.stringify(formState));
    }
    location.reload();
  });

  // Privacy modal
  privacyInfoBtn.addEventListener('click', openPrivacyModal);
  privacyModalClose.addEventListener('click', closePrivacyModal);
  privacyModal.addEventListener('click', (e) => {
    if (e.target === privacyModal) closePrivacyModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && privacyModal.classList.contains('show')) {
      closePrivacyModal();
    }
  });

  // Emoji picker
  emojiPickerBtn.addEventListener('click', toggleEmojiPicker);
  document.addEventListener('click', (e) => {
    // Close emoji picker when clicking outside
    if (!emojiPicker.contains(e.target) && e.target !== emojiPickerBtn) {
      closeEmojiPicker();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && emojiPicker.classList.contains('show')) {
      closeEmojiPicker();
      emojiPickerBtn.focus();
    }
  });

  // Date preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => handlePresetClick(btn.dataset.preset));
  });

  // Clear preset selection when date is manually changed
  document.getElementById('startDate').addEventListener('change', clearPresetSelection);

  // Duration preset buttons
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => handleDurationClick(btn.dataset.duration));
  });

  // Update duration display when times change
  ['startTime', 'endTime', 'endDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        clearDurationSelection();
        updateDurationDisplay();
      });
      el.addEventListener('input', () => {
        clearDurationSelection();
        updateDurationDisplay();
      });
    }
  });


  // Auto-save form state on input change
  const autoSaveInputs = [
    'title', 'startDate', 'startTime', 'endDate', 'endTime',
    'location', 'description', 'url', 'interval', 'recurrenceEndDate',
    'occurrenceCount'
  ];
  autoSaveInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', debounce(saveFormState, 500));
      el.addEventListener('change', saveFormState);
    }
  });

  // Auto-save on select/checkbox changes
  timezoneSelect.addEventListener('change', () => {
    setPreferredTimezone(timezoneSelect.value);
    saveFormState();
    updateDebugInfo();
  });
  frequencySelect.addEventListener('change', saveFormState);
  allDayCheckbox.addEventListener('change', saveFormState);
  isRecurringCheckbox.addEventListener('change', saveFormState);
  hasReminderCheckbox.addEventListener('change', saveFormState);

  // Auto-save on radio changes
  document.querySelectorAll('input[name="monthlyType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      saveFormState();
      if (isRecurringCheckbox.checked) {
        calculateOccurrences();
        renderCalendar(true);
      }
    });
  });
  endTypeRadios.forEach(radio => {
    radio.addEventListener('change', saveFormState);
  });

  // Update download button state on relevant field changes
  ['title', 'startDate', 'startTime', 'recurrenceEndDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => { markFormTouched(); updateDownloadButtonState(); });
      el.addEventListener('change', () => { markFormTouched(); updateDownloadButtonState(); });
    }
  });
  allDayCheckbox.addEventListener('change', () => { markFormTouched(); updateDownloadButtonState(); });
  isRecurringCheckbox.addEventListener('change', () => { markFormTouched(); updateDownloadButtonState(); });
  frequencySelect.addEventListener('change', () => { markFormTouched(); updateDownloadButtonState(); });
  endTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => { markFormTouched(); updateDownloadButtonState(); });
  });

  // Occurrence count change - recalculate occurrences
  occurrenceCountInput.addEventListener('input', () => {
    if (isRecurringCheckbox.checked) {
      calculateOccurrences();
      renderCalendar(true);
    }
  });

  // Recurrence end date change - recalculate occurrences
  recurrenceEndDateInput.addEventListener('change', () => {
    if (isRecurringCheckbox.checked) {
      calculateOccurrences();
      renderCalendar(true);
    }
  });
}

// Debounce helper for text inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==================== Handlers ====================
function handleAllDayToggle() {
  const isAllDay = allDayCheckbox.checked;
  startTimeGroup.classList.toggle('hidden', isAllDay);
  endTimeGroup.classList.toggle('hidden', isAllDay);

  const startTimeInput = document.getElementById('startTime');
  const endTimeInput = document.getElementById('endTime');

  if (isAllDay) {
    startTimeInput.removeAttribute('required');
    endTimeInput.removeAttribute('required');
    // Hide duration presets for all-day events (only show duration display)
    document.getElementById('durationPresets').classList.add('hidden');
    updateDurationSelection('allday');
  } else {
    startTimeInput.setAttribute('required', '');
    endTimeInput.setAttribute('required', '');
    document.getElementById('durationPresets').classList.remove('hidden');
    clearDurationSelection();
  }
  updateDurationDisplay();
}

function handleRecurringToggle() {
  const isRecurring = isRecurringCheckbox.checked;
  recurrenceOptions.classList.toggle('show', isRecurring);
  previewSection.style.display = 'block';

  // Update preview content based on recurring state
  updatePreviewContent(isRecurring);

  // Always calculate occurrences and render calendar
  calculateOccurrences();
  renderCalendar(true);
}

function updatePreviewContent(isRecurring) {
  // Update preview title
  const previewTitle = document.getElementById('preview-title');
  previewTitle.textContent = isRecurring ? 'Preview & Exceptions' : 'Preview';

  // Update instructions text
  const instructionsPara = previewSection.querySelector('p');
  if (isRecurring) {
    instructionsPara.textContent = 'Click on highlighted dates to exclude them from the recurring event.';
    instructionsPara.style.display = 'block';
  } else {
    instructionsPara.textContent = 'This is how your event will appear on the calendar.';
    instructionsPara.style.display = 'block';
  }

  // Show/hide exception-related UI
  const calendarInfo = document.querySelector('.calendar-info');
  if (calendarInfo) {
    const exceptionToggle = document.getElementById('exceptionCount');
    const exceptionLegend = document.querySelector('.legend-item:has(.legend-dot.exception)');

    if (exceptionToggle) {
      exceptionToggle.style.display = isRecurring ? 'flex' : 'none';
    }
    if (exceptionLegend) {
      exceptionLegend.style.display = isRecurring ? 'flex' : 'none';
    }
  }
}

function updateFrequencyOptions() {
  const freq = frequencySelect.value;
  weeklyDaysGroup.classList.toggle('hidden', freq !== 'WEEKLY');
  monthlyTypeGroup.classList.toggle('hidden', freq !== 'MONTHLY');

  // Set default day for weekly if none selected
  if (freq === 'WEEKLY' && state.selectedDays.size === 0) {
    const startDate = document.getElementById('startDate').value;
    if (startDate) {
      const date = new Date(startDate + 'T00:00:00');
      const dayCode = WEEKDAY_CODES[date.getDay()];
      state.selectedDays.add(dayCode);
      updateDayPickerUI();
    }
  }

  if (isRecurringCheckbox.checked) {
    calculateOccurrences();
    renderCalendar(true);
  }
}

function toggleDay(btn) {
  const day = btn.dataset.day;
  if (state.selectedDays.has(day)) {
    state.selectedDays.delete(day);
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  } else {
    state.selectedDays.add(day);
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  }

  if (isRecurringCheckbox.checked) {
    calculateOccurrences();
    renderCalendar(true);
  }

  saveFormState();
  markFormTouched();
  updateDownloadButtonState();
}

function updateDayPickerUI() {
  dayPickerBtns.forEach(btn => {
    const isActive = state.selectedDays.has(btn.dataset.day);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function handleEndTypeChange(e) {
  const endType = e.target.value;
  recurrenceEndDateInput.disabled = endType !== 'date';
  occurrenceCountInput.disabled = endType !== 'count';
  neverEndWarning.classList.toggle('show', endType === 'never');

  if (isRecurringCheckbox.checked) {
    calculateOccurrences();
    renderCalendar(true);
  }
}

function handleReminderToggle() {
  const isEnabled = hasReminderCheckbox.checked;
  reminderOptions.classList.toggle('show', isEnabled);

  if (isEnabled && state.reminders.length === 0) {
    // Add default reminder (15 minutes before)
    addReminder('15');
  } else if (!isEnabled) {
    // Clear all reminders
    state.reminders = [];
    renderReminders();
  }
}

function addReminder(value = '15') {
  if (state.reminders.length >= MAX_REMINDERS) {
    return;
  }

  state.reminders.push(value);
  renderReminders();
  updateAddButtonState();
  saveFormState();
}

function removeReminder(index) {
  if (state.reminders.length <= 1) {
    // Don't allow removing the last reminder - disable reminders instead
    hasReminderCheckbox.checked = false;
    handleReminderToggle();
    saveFormState();
    return;
  }

  state.reminders.splice(index, 1);
  renderReminders();
  updateAddButtonState();
  saveFormState();
}

function updateReminderValue(index, value) {
  state.reminders[index] = value;
  saveFormState();
}

function renderReminders() {
  reminderList.innerHTML = '';

  state.reminders.forEach((reminderValue, index) => {
    const item = document.createElement('div');
    item.className = 'reminder-item';
    item.setAttribute('data-index', index);

    const select = document.createElement('select');
    select.setAttribute('aria-label', `Reminder ${index + 1}`);
    REMINDER_OPTIONS.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === reminderValue) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
      updateReminderValue(index, e.target.value);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'reminder-remove-btn';
    removeBtn.setAttribute('aria-label', `Remove reminder ${index + 1}`);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      removeReminder(index);
    });

    item.appendChild(select);
    item.appendChild(removeBtn);
    reminderList.appendChild(item);
  });
}

function updateAddButtonState() {
  const atMax = state.reminders.length >= MAX_REMINDERS;
  addReminderBtn.classList.toggle('hidden', atMax);
  reminderHint.classList.toggle('hidden', !atMax);
}

function handleNewEvent() {
  // Clear current event ID
  state.currentEventId = null;

  // Reset form
  form.reset();

  // Reset state
  state.selectedDays = new Set();
  state.exceptions = new Set();
  state.reminders = [];
  state.formTouched = false;
  updateDayPickerUI();
  renderReminders();
  updateAddButtonState();

  // Set default dates
  setDefaultDates();

  // Reset timezone to preferred (or detected if no preference)
  const preferredTz = getPreferredTimezone();
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultTz = preferredTz || detectedTz;
  if (timezoneSelect.querySelector(`option[value="${defaultTz}"]`)) {
    timezoneSelect.value = defaultTz;
  }

  // Hide recurrence options and reminder options
  recurrenceOptions.classList.remove('show');
  reminderOptions.classList.remove('show');

  // Show preview with default start date
  const startDate = document.getElementById('startDate').value;
  if (startDate) {
    calculateOccurrences();
    renderCalendar(true);
    previewSection.style.display = 'block';
    updatePreviewContent(isRecurringCheckbox.checked);
  }

  // Clear validation status
  validationStatus.classList.remove('show', 'success', 'error');

  // Save clean state
  saveFormState();
  updateDownloadButtonState();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  generateAndDownloadICS();
}

// ==================== Calendar ====================
function navigateCalendar(direction) {
  state.calendarDate.setMonth(state.calendarDate.getMonth() + direction);

  // Auto-extend loaded months if navigating beyond current range
  const startDateStr = document.getElementById('startDate').value;
  if (startDateStr) {
    const startDate = new Date(startDateStr + 'T00:00:00');
    const viewingMonth = new Date(state.calendarDate);
    const monthsFromStart = (viewingMonth.getFullYear() - startDate.getFullYear()) * 12
                               + (viewingMonth.getMonth() - startDate.getMonth()) + 1;

    if (monthsFromStart > state.calendarMonthsLoaded) {
      state.calendarMonthsLoaded = monthsFromStart + 2; // Load a couple extra months
      calculateOccurrences();
    }
  }

  renderCalendar();
}

function calculateOccurrences() {
  state.eventOccurrences = [];

  const startDateStr = document.getElementById('startDate').value;
  if (!startDateStr) return;

  const startDate = new Date(startDateStr + 'T00:00:00');
  const frequency = frequencySelect.value;
  const interval = parseInt(document.getElementById('interval').value);
  const endType = document.querySelector('input[name="endType"]:checked').value;

  let endDate = null;
  let maxCount = 1000; // Safety limit

  if (!isRecurringCheckbox.checked) {
    state.eventOccurrences = [startDate];
    return;
  }

  if (endType === 'date') {
    const endDateStr = recurrenceEndDateInput.value;
    if (endDateStr) {
      endDate = new Date(endDateStr + 'T23:59:59');
    }
  } else if (endType === 'count') {
    maxCount = parseInt(occurrenceCountInput.value) || 10;
  }

  // Dynamically extend preview range based on COUNT and frequency
  let requiredMonths = state.calendarMonthsLoaded;
  if (endType === 'count' && maxCount > 1) {
    if (frequency === 'MONTHLY') {
      // For monthly recurrence, we need enough months to cover all occurrences
      // Using "last weekday" logic ensures every month has a valid occurrence
      requiredMonths = Math.max(requiredMonths, maxCount * interval + 1);
    } else if (frequency === 'WEEKLY') {
      requiredMonths = Math.max(requiredMonths, Math.ceil((maxCount * interval * 7) / 30) + 1);
    } else if (frequency === 'DAILY') {
      requiredMonths = Math.max(requiredMonths, Math.ceil((maxCount * interval) / 30) + 1);
    }
    // Update state so calendar navigation knows the extended range
    state.calendarMonthsLoaded = Math.max(state.calendarMonthsLoaded, requiredMonths);
  }

  // Calculate occurrences based on how many months we want to show
  const previewEndDate = new Date(startDate);
  previewEndDate.setMonth(previewEndDate.getMonth() + requiredMonths);

  const effectiveEndDate = endDate ?
    (endDate < previewEndDate ? endDate : previewEndDate) :
    previewEndDate;

  const currentDate = new Date(startDate);
  let count = 0;

  while (currentDate <= effectiveEndDate && count < maxCount) {
    if (frequency === 'WEEKLY') {
      const dayCode = WEEKDAY_CODES[currentDate.getDay()];
      if (state.selectedDays.has(dayCode)) {
        state.eventOccurrences.push(new Date(currentDate));
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);

      // Check if we completed a week
      if (currentDate.getDay() === startDate.getDay() && interval > 1) {
        currentDate.setDate(currentDate.getDate() + 7 * (interval - 1));
      }
    } else if (frequency === 'DAILY') {
      state.eventOccurrences.push(new Date(currentDate));
      count++;
      currentDate.setDate(currentDate.getDate() + interval);
    } else if (frequency === 'MONTHLY') {
      const monthlyType = document.querySelector('input[name="monthlyType"]:checked').value;

      if (monthlyType === 'date') {
        const targetDay = startDate.getDate();

        // Only add occurrence if the current month has this day
        // (e.g., skip Feb 30, skip Feb/Apr/Jun/Sep/Nov 31)
        const daysInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        if (targetDay <= daysInCurrentMonth) {
          state.eventOccurrences.push(new Date(currentDate));
          count++;
        }

        // Move to next month (set to 1st first to avoid overflow)
        currentDate.setDate(1);
        currentDate.setMonth(currentDate.getMonth() + interval);
        // Try to set to target day, but cap at days in month to avoid overflow
        const daysInNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        currentDate.setDate(Math.min(targetDay, daysInNextMonth));
      } else {
        // Same weekday of month (e.g., 2nd Tuesday, last Friday)
        const weekOfMonth = Math.ceil(startDate.getDate() / 7);
        const dayOfWeek = startDate.getDay();
        // If 5th week or later, use "last weekday" logic (always exists)
        const useLastWeekday = weekOfMonth >= 5;

        // Add current date
        state.eventOccurrences.push(new Date(currentDate));
        count++;

        // Calculate next occurrence - set date to 1 first to avoid month overflow
        currentDate.setDate(1);
        currentDate.setMonth(currentDate.getMonth() + interval);

        if (useLastWeekday) {
          // Find last occurrence of weekday in month
          // Go to last day of month, then find last matching weekday
          const targetMonth = currentDate.getMonth();
          currentDate.setMonth(targetMonth + 1);
          currentDate.setDate(0); // Last day of target month
          while (currentDate.getDay() !== dayOfWeek) {
            currentDate.setDate(currentDate.getDate() - 1);
          }
        } else {
          // Find nth weekday of month (1st through 4th)
          while (currentDate.getDay() !== dayOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          currentDate.setDate(currentDate.getDate() + (weekOfMonth - 1) * 7);
        }
      }
    }
  }
}

function renderCalendar(resetToFirstOccurrence = false) {
  // Only reset to first occurrence month when explicitly requested (e.g., when event data changes)
  // This allows navigation to work properly
  if (resetToFirstOccurrence && state.eventOccurrences.length > 0) {
    const firstOccurrence = state.eventOccurrences[0];
    state.calendarDate = new Date(firstOccurrence.getFullYear(), firstOccurrence.getMonth(), 1);
  }

  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();

  calendarMonthYear.textContent = `${MONTHS[month]} ${year}`;

  // Clear grid
  calendarGrid.innerHTML = '';

  // Add weekday headers
  WEEKDAYS.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-weekday';
    header.textContent = day;
    header.setAttribute('role', 'columnheader');
    calendarGrid.appendChild(header);
  });

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayEl = createDayElement(daysInPrevMonth - i, true);
    calendarGrid.appendChild(dayEl);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.getTime() === today.getTime();
    const isEventDay = isOccurrence(date);
    const isException = state.exceptions.has(formatDateKey(date));

    const dayEl = createDayElement(day, false, isToday, isEventDay, isException, date);
    calendarGrid.appendChild(dayEl);
  }

  // Next month days
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const nextMonthDays = totalCells - (firstDay + daysInMonth);
  for (let day = 1; day <= nextMonthDays; day++) {
    const dayEl = createDayElement(day, true);
    calendarGrid.appendChild(dayEl);
  }

  updateExceptionCount();
}

function createDayElement(day, isOtherMonth, isToday = false, isEventDay = false, isException = false, date = null) {
  const el = document.createElement('div');
  el.className = 'calendar-day';
  el.textContent = day;
  el.setAttribute('role', 'gridcell');

  if (isOtherMonth) {
    el.classList.add('other-month');
  }

  if (isToday) {
    el.classList.add('today');
  }

  if (isEventDay) {
    el.classList.add('event-day');
    el.setAttribute('tabindex', '0');

    // Only make clickable for recurring events
    if (isRecurringCheckbox.checked) {
      el.setAttribute('aria-label', `${MONTHS[date.getMonth()]} ${day}, ${date.getFullYear()}${isException ? ' (excluded)' : ''}`);
      el.addEventListener('click', () => toggleException(date));
      // Add cursor pointer style for recurring events
      el.style.cursor = 'pointer';
    } else {
      el.setAttribute('aria-label', `${MONTHS[date.getMonth()]} ${day}, ${date.getFullYear()}`);
      el.style.cursor = 'default';
    }

    if (isException) {
      el.classList.add('exception');
    }
  }

  return el;
}

function isOccurrence(date) {
  const dateKey = formatDateKey(date);
  return state.eventOccurrences.some(occ => formatDateKey(occ) === dateKey);
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toggleException(date) {
  // Only allow exceptions for recurring events
  if (!isRecurringCheckbox.checked) {
    return;
  }

  const dateKey = formatDateKey(date);
  if (state.exceptions.has(dateKey)) {
    state.exceptions.delete(dateKey);
  } else {
    state.exceptions.add(dateKey);
  }
  renderCalendar();
  saveFormState();
}

function updateExceptionCount() {
  const count = state.exceptions.size;
  exceptionCountText.textContent = `${count} exception${count !== 1 ? 's' : ''}`;
  renderExceptionList();
}

function toggleExceptionList() {
  const isOpen = exceptionCountEl.classList.toggle('open');
  exceptionListEl.classList.toggle('show', isOpen);
  exceptionCountEl.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  exceptionListEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
}

function renderExceptionList() {
  if (state.exceptions.size === 0) {
    exceptionListEl.innerHTML = '<div class="exception-list-empty">No exceptions selected. Click on event dates above to exclude them.</div>';
    return;
  }

  // Sort exceptions chronologically
  const sortedExceptions = Array.from(state.exceptions).sort();

  const itemsHtml = sortedExceptions.map(dateKey => {
    const date = new Date(dateKey + 'T00:00:00');
    const formattedDate = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `
          <div class="exception-item">
            <span>${formattedDate}</span>
            <button type="button" class="exception-item-remove" onclick="removeException('${dateKey}')" aria-label="Remove exception for ${formattedDate}">&times;</button>
          </div>
        `;
  }).join('');

  exceptionListEl.innerHTML = `<div class="exception-list-items">${itemsHtml}</div>`;
}

// Used in onclick handler (see renderExceptionList)
// eslint-disable-next-line no-unused-vars
function removeException(dateKey) {
  state.exceptions.delete(dateKey);
  renderCalendar();
  saveFormState();
}

function handleCalendarKeydown(e) {
  const focusedEl = document.activeElement;
  if (!focusedEl.classList.contains('event-day')) return;

  const allEventDays = Array.from(calendarGrid.querySelectorAll('.event-day'));
  const currentIndex = allEventDays.indexOf(focusedEl);

  if (e.key === 'ArrowRight' && currentIndex < allEventDays.length - 1) {
    allEventDays[currentIndex + 1].focus();
    e.preventDefault();
  } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
    allEventDays[currentIndex - 1].focus();
    e.preventDefault();
  } else if (e.key === 'Enter' || e.key === ' ') {
    focusedEl.click();
    e.preventDefault();
  }
}

function updateMonthlyHints() {
  const startDateStr = document.getElementById('startDate').value;
  if (!startDateStr) return;

  const date = new Date(startDateStr + 'T00:00:00');
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);
  const dayName = WEEKDAYS[date.getDay()];

  const ordinals = ['', '1st', '2nd', '3rd', '4th', 'last'];
  // Use "last" for 5th week since not all months have 5 occurrences
  const weekLabel = weekOfMonth >= 5 ? 'last' : ordinals[weekOfMonth];

  let dateHint = `e.g., the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)} of every month`;
  // Add warning for days that don't exist in all months
  if (dayOfMonth >= 29) {
    const skippedMonths = [];
    if (dayOfMonth >= 31) skippedMonths.push('Feb', 'Apr', 'Jun', 'Sep', 'Nov');
    else if (dayOfMonth === 30) skippedMonths.push('Feb');
    else if (dayOfMonth === 29) skippedMonths.push('Feb*'); // *except leap years
    dateHint += ` (skips ${skippedMonths.join(', ')})`;
  }
  document.getElementById('monthlyDateHint').textContent = dateHint;
  document.getElementById('monthlyDayHint').textContent =
        `e.g., the ${weekLabel} ${dayName} of every month`;
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ==================== Validation ====================
function validateBasicFields() {
  let isValid = true;
  clearErrors();

  const title = document.getElementById('title');
  const startDate = document.getElementById('startDate');
  const startTime = document.getElementById('startTime');

  if (!title.value.trim()) {
    showFieldError('title', 'Please enter an event title');
    isValid = false;
  }

  if (!startDate.value) {
    showFieldError('startDate', 'Please select a start date');
    isValid = false;
  }

  if (!allDayCheckbox.checked && !startTime.value) {
    showFieldError('startTime', 'Please select a start time');
    isValid = false;
  }

  return isValid;
}

function validateForm() {
  let isValid = validateBasicFields();

  // Validate weekly days
  if (isRecurringCheckbox.checked && frequencySelect.value === 'WEEKLY') {
    if (state.selectedDays.size === 0) {
      showFieldError('weeklyDays', 'Please select at least one day');
      isValid = false;
    }
  }

  // Validate end date for recurring
  if (isRecurringCheckbox.checked) {
    const endType = document.querySelector('input[name="endType"]:checked').value;
    if (endType === 'date' && !recurrenceEndDateInput.value) {
      recurrenceEndDateInput.classList.add('error');
      isValid = false;
    }
  }

  return isValid;
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + '-error');

  if (field) field.classList.add('error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

function clearErrors() {
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
  validationStatus.classList.remove('show', 'success', 'error');
}

function checkFormValidity() {
  // Silent validation check (doesn't show errors)
  const title = document.getElementById('title').value.trim();
  const startDate = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;

  if (!title || !startDate) return false;
  if (!allDayCheckbox.checked && !startTime) return false;

  if (isRecurringCheckbox.checked) {
    if (frequencySelect.value === 'WEEKLY' && state.selectedDays.size === 0) return false;
    const endType = document.querySelector('input[name="endType"]:checked').value;
    if (endType === 'date' && !recurrenceEndDateInput.value) return false;
  }

  return true;
}

function updateDownloadButtonState() {
  const isValid = checkFormValidity();
  downloadBtn.disabled = !isValid;
  // Only show hint if user has interacted with the form
  downloadHint.classList.toggle('hidden', isValid || !state.formTouched);
}

function markFormTouched() {
  if (!state.formTouched) {
    state.formTouched = true;
    updateDownloadButtonState();
  }
}

function showValidationStatus(isSuccess, title, message) {
  validationStatus.classList.remove('success', 'error');
  validationStatus.classList.add('show', isSuccess ? 'success' : 'error');
  validationTitle.textContent = title;
  validationMessage.textContent = message;
}

// ==================== iCal Generation ====================
function generateICS() {
  const title = document.getElementById('title').value.trim();
  const startDateStr = document.getElementById('startDate').value;
  const startTimeStr = document.getElementById('startTime').value;
  const endDateStr = document.getElementById('endDate').value;
  const endTimeStr = document.getElementById('endTime').value;
  const timezone = timezoneSelect.value;
  const location = document.getElementById('location').value.trim();
  const description = document.getElementById('description').value.trim();
  const url = document.getElementById('url').value.trim();
  const isAllDay = allDayCheckbox.checked;
  const isRecurring = isRecurringCheckbox.checked;
  const hasReminder = hasReminderCheckbox.checked;

  // Create calendar
  const cal = new ICAL.Component(['vcalendar', [], []]);
  cal.updatePropertyWithValue('prodid', '-//iCal Creator//ical-creator.html//EN');
  cal.updatePropertyWithValue('version', '2.0');
  cal.updatePropertyWithValue('calscale', 'GREGORIAN');

  // Create event
  const vevent = new ICAL.Component('vevent');

  // UID - use stored ID for saved events to enable updates, otherwise generate new
  const eventUid = state.currentEventId || generateUID();
  vevent.updatePropertyWithValue('uid', eventUid);

  // SEQUENCE - for calendar apps to detect updates (RFC 5545)
  // https://www.rfc-editor.org/rfc/rfc5545#section-3.8.7.4
  // If event exists, increment sequence; otherwise start at 0
  const existingEvents = getSavedEvents();
  const existingEvent = existingEvents.find(e => e.id === state.currentEventId);
  const sequence = existingEvent ? (existingEvent.sequence || 0) + 1 : 0;
  vevent.updatePropertyWithValue('sequence', sequence);

  // Timestamp (must be UTC per RFC 5545)
  const dtstamp = ICAL.Time.now();
  dtstamp.zone = ICAL.Timezone.utcTimezone;
  vevent.updatePropertyWithValue('dtstamp', dtstamp);

  // Summary
  vevent.updatePropertyWithValue('summary', title);

  // Determine if we should use TZID (for recurring events with non-UTC timezone)
  // Using TZID ensures DST transitions are handled correctly by the calendar app
  const useTZID = isRecurring && timezone !== 'UTC' && !isAllDay;

  // Start date/time
  let dtstart;
  if (isAllDay) {
    dtstart = ICAL.Time.fromDateString(startDateStr);
    // fromDateString already marks as DATE type, setValue adds VALUE=DATE automatically
    vevent.updatePropertyWithValue('dtstart', dtstart);
  } else if (useTZID) {
    // Use TZID for recurring events - calendar app handles DST
    dtstart = ICAL.Time.fromDateTimeString(startDateStr + 'T' + startTimeStr + ':00');
    const dtstartProp = new ICAL.Property('dtstart');
    dtstartProp.setParameter('tzid', timezone);
    dtstartProp.setValue(dtstart);
    vevent.addProperty(dtstartProp);
  } else {
    // Convert local time to UTC using the selected timezone
    const startUTCStr = convertLocalToUTC(startDateStr, startTimeStr, timezone);
    dtstart = ICAL.Time.fromDateTimeString(startUTCStr);
    dtstart.zone = ICAL.Timezone.utcTimezone;
    const dtstartProp = new ICAL.Property('dtstart');
    dtstartProp.setValue(dtstart);
    vevent.addProperty(dtstartProp);
  }

  // End date/time
  if (endDateStr || endTimeStr) {
    let dtend;
    const effectiveEndDate = endDateStr || startDateStr;

    if (isAllDay) {
      // For all-day events, end date should be the day after
      const endDate = new Date(effectiveEndDate + 'T00:00:00');
      endDate.setDate(endDate.getDate() + 1);
      dtend = ICAL.Time.fromDateString(formatDateForInput(endDate));
      // fromDateString already marks as DATE type, setValue adds VALUE=DATE automatically
      vevent.updatePropertyWithValue('dtend', dtend);
    } else if (useTZID) {
      // Use TZID for recurring events - calendar app handles DST
      const effectiveEndTime = endTimeStr || startTimeStr;
      dtend = ICAL.Time.fromDateTimeString(effectiveEndDate + 'T' + effectiveEndTime + ':00');
      const dtendProp = new ICAL.Property('dtend');
      dtendProp.setParameter('tzid', timezone);
      dtendProp.setValue(dtend);
      vevent.addProperty(dtendProp);
    } else {
      const effectiveEndTime = endTimeStr || startTimeStr;
      // Convert local time to UTC using the selected timezone
      const endUTCStr = convertLocalToUTC(effectiveEndDate, effectiveEndTime, timezone);
      dtend = ICAL.Time.fromDateTimeString(endUTCStr);
      dtend.zone = ICAL.Timezone.utcTimezone;
      vevent.addProperty(new ICAL.Property('dtend'));
      vevent.updatePropertyWithValue('dtend', dtend);
    }
  }

  // Location
  if (location) {
    vevent.updatePropertyWithValue('location', location);
  }

  // Description
  if (description) {
    vevent.updatePropertyWithValue('description', description);
  }

  // URL
  if (url) {
    vevent.updatePropertyWithValue('url', url);
  }

  // Recurrence rule
  if (isRecurring) {
    const rrule = buildRRule();
    if (rrule) {
      const rruleProp = new ICAL.Property('rrule');
      rruleProp.setValue(rrule);
      vevent.addProperty(rruleProp);
    }

    // Exceptions
    if (state.exceptions.size > 0) {
      state.exceptions.forEach(dateKey => {
        const exdateProp = new ICAL.Property('exdate');
        if (isAllDay) {
          const exdate = ICAL.Time.fromDateString(dateKey);
          // fromDateString already marks as DATE type, setValue adds VALUE=DATE automatically
          exdateProp.setValue(exdate);
        } else if (useTZID) {
          // Use TZID for recurring events - calendar app handles DST
          const exdate = ICAL.Time.fromDateTimeString(dateKey + 'T' + startTimeStr + ':00');
          exdateProp.setParameter('tzid', timezone);
          exdateProp.setValue(exdate);
        } else {
          // Convert local time to UTC using the selected timezone
          const exdateUTCStr = convertLocalToUTC(dateKey, startTimeStr, timezone);
          const exdate = ICAL.Time.fromDateTimeString(exdateUTCStr);
          exdate.zone = ICAL.Timezone.utcTimezone;
          exdateProp.setValue(exdate);
        }
        vevent.addProperty(exdateProp);
      });
    }
  }

  // Reminder/Alarm - support multiple reminders
  if (hasReminder && state.reminders.length > 0) {
    state.reminders.forEach(reminderMinutes => {
      const valarm = new ICAL.Component('valarm');
      valarm.updatePropertyWithValue('action', 'DISPLAY');
      valarm.updatePropertyWithValue('description', 'Reminder: ' + title);

      const minutes = parseInt(reminderMinutes);
      const trigger = new ICAL.Duration({ minutes: minutes, isNegative: true });
      valarm.updatePropertyWithValue('trigger', trigger);

      vevent.addSubcomponent(valarm);
    });
  }

  cal.addSubcomponent(vevent);

  return cal.toString();
}

function buildRRule() {
  const frequency = frequencySelect.value;
  const interval = parseInt(document.getElementById('interval').value);
  const endType = document.querySelector('input[name="endType"]:checked').value;

  const rruleData = {
    freq: frequency,
    interval: interval
  };

  // Weekly - add BYDAY
  if (frequency === 'WEEKLY' && state.selectedDays.size > 0) {
    rruleData.byday = Array.from(state.selectedDays);
  }

  // Monthly - add BYMONTHDAY or BYDAY
  if (frequency === 'MONTHLY') {
    const monthlyType = document.querySelector('input[name="monthlyType"]:checked').value;
    const startDateStr = document.getElementById('startDate').value;
    const startDate = new Date(startDateStr + 'T00:00:00');

    if (monthlyType === 'date') {
      rruleData.bymonthday = [startDate.getDate()];
    } else {
      const weekOfMonth = Math.ceil(startDate.getDate() / 7);
      const dayCode = WEEKDAY_CODES[startDate.getDay()];
      // Use -1 (last) for 5th week since not all months have 5 occurrences
      const weekNum = weekOfMonth >= 5 ? -1 : weekOfMonth;
      rruleData.byday = [weekNum + dayCode];
    }
  }

  // End condition
  if (endType === 'date') {
    const endDateStr = recurrenceEndDateInput.value;
    if (endDateStr) {
      rruleData.until = ICAL.Time.fromDateString(endDateStr);
    }
  } else if (endType === 'count') {
    rruleData.count = parseInt(occurrenceCountInput.value) || 10;
  }

  return new ICAL.Recur(rruleData);
}

function generateUID() {
  return 'ical-creator-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '@ical-creator';
}

// ==================== Validation & Download ====================
function validateICS(icsString) {
  try {
    const jcalData = ICAL.parse(icsString);
    const comp = new ICAL.Component(jcalData);

    // Check for VCALENDAR
    if (comp.name !== 'vcalendar') {
      throw new Error('Invalid calendar structure');
    }

    // Check for VEVENT
    const vevent = comp.getFirstSubcomponent('vevent');
    if (!vevent) {
      throw new Error('No event found in calendar');
    }

    // Check required properties
    const summary = vevent.getFirstPropertyValue('summary');
    if (!summary) {
      throw new Error('Event missing summary/title');
    }

    const dtstart = vevent.getFirstPropertyValue('dtstart');
    if (!dtstart) {
      throw new Error('Event missing start date');
    }

    return { valid: true, message: 'iCal file is valid and ready for download' };
  } catch (error) {
    return { valid: false, message: error.message || 'Failed to parse iCal data' };
  }
}

function generateAndDownloadICS() {
  try {
    // Ensure currentEventId is set before generating ICS (for UID persistence)
    if (!state.currentEventId) {
      state.currentEventId = generateUID();
    }

    const icsString = generateICS();

    // Validate
    const validation = validateICS(icsString);

    if (!validation.valid) {
      showValidationStatus(false, 'Validation Failed', validation.message);
      return;
    }

    showValidationStatus(true, 'Valid', validation.message);

    // Download
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const title = document.getElementById('title').value.trim();
    const filename = title.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.ics';

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save event to history on successful download
    const eventData = createEventDataForSave();
    saveEventToHistory(eventData);
    saveFormState();

    // Trigger confetti celebration
    triggerConfetti();

  } catch (error) {
    console.error('Error generating ICS:', error);
    showValidationStatus(false, 'Generation Failed', error.message || 'An error occurred while generating the calendar file');
  }
}

// ==================== LocalStorage Functions ====================
function getFormState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FORM_STATE);
    return saved ? JSON.parse(saved) : null;
  } catch (_e) {
    console.warn('Could not read form state from localStorage');
    return null;
  }
}

function saveFormState() {
  try {
    const formState = {
      title: document.getElementById('title').value,
      allDay: allDayCheckbox.checked,
      startDate: document.getElementById('startDate').value,
      startTime: document.getElementById('startTime').value,
      endDate: document.getElementById('endDate').value,
      endTime: document.getElementById('endTime').value,
      timezone: timezoneSelect.value,
      location: document.getElementById('location').value,
      description: document.getElementById('description').value,
      url: document.getElementById('url').value,
      isRecurring: isRecurringCheckbox.checked,
      frequency: frequencySelect.value,
      interval: document.getElementById('interval').value,
      selectedDays: Array.from(state.selectedDays),
      monthlyType: document.querySelector('input[name="monthlyType"]:checked')?.value || 'date',
      endType: document.querySelector('input[name="endType"]:checked')?.value || 'date',
      recurrenceEndDate: recurrenceEndDateInput.value,
      occurrenceCount: occurrenceCountInput.value,
      hasReminder: hasReminderCheckbox.checked,
      reminders: state.reminders,
      exceptions: Array.from(state.exceptions),
      currentEventId: state.currentEventId
    };
    localStorage.setItem(STORAGE_KEYS.FORM_STATE, JSON.stringify(formState));
  } catch (_e) {
    console.warn('Could not save form state to localStorage');
  }
}

function restoreFormState() {
  const formState = getFormState();
  if (!formState) return;

  // Restore basic fields
  document.getElementById('title').value = formState.title || '';
  allDayCheckbox.checked = formState.allDay || false;
  if (formState.startDate) document.getElementById('startDate').value = formState.startDate;
  document.getElementById('startTime').value = formState.startTime || '';
  document.getElementById('endDate').value = formState.endDate || '';
  document.getElementById('endTime').value = formState.endTime || '';
  document.getElementById('location').value = formState.location || '';
  document.getElementById('description').value = formState.description || '';
  document.getElementById('url').value = formState.url || '';

  // Restore timezone only if it exists in the dropdown
  // Otherwise keep the auto-detected timezone
  if (formState.timezone) {
    const tzOption = timezoneSelect.querySelector(`option[value="${formState.timezone}"]`);
    if (tzOption) {
      timezoneSelect.value = formState.timezone;
    }
    // If saved timezone not in list, don't override detected timezone
  }

  // Restore recurrence
  isRecurringCheckbox.checked = formState.isRecurring || false;
  frequencySelect.value = formState.frequency || 'DAILY';
  document.getElementById('interval').value = formState.interval || '1';

  // Restore selected days
  state.selectedDays = new Set(formState.selectedDays || []);
  updateDayPickerUI();

  // Restore monthly type
  const monthlyTypeRadio = document.querySelector(`input[name="monthlyType"][value="${formState.monthlyType || 'date'}"]`);
  if (monthlyTypeRadio) monthlyTypeRadio.checked = true;

  // Restore end type
  const endTypeRadio = document.querySelector(`input[name="endType"][value="${formState.endType || 'date'}"]`);
  if (endTypeRadio) {
    endTypeRadio.checked = true;
    handleEndTypeChange({ target: endTypeRadio });
  }

  if (formState.recurrenceEndDate) recurrenceEndDateInput.value = formState.recurrenceEndDate;
  occurrenceCountInput.value = formState.occurrenceCount || '10';

  // Restore reminders
  hasReminderCheckbox.checked = formState.hasReminder || false;
  // Support both old format (single reminderTime) and new format (reminders array)
  if (formState.reminders && Array.isArray(formState.reminders)) {
    state.reminders = formState.reminders;
  } else if (formState.reminderTime) {
    // Migrate from old format
    state.reminders = [formState.reminderTime];
  } else {
    state.reminders = [];
  }
  renderReminders();
  updateAddButtonState();

  // Restore exceptions
  state.exceptions = new Set(formState.exceptions || []);

  // Restore current event ID
  state.currentEventId = formState.currentEventId || null;

  // Update UI to reflect restored state
  handleAllDayToggle();
  handleRecurringToggle();
  handleReminderToggle();
}

function getSavedEvents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_EVENTS);
    return saved ? JSON.parse(saved) : [];
  } catch (_e) {
    console.warn('Could not read saved events from localStorage');
    return [];
  }
}

function getDemoEvents() {
  return [
    {
      id: 'ical-creator-demo-senioren-kaffee@ical-creator',
      sequence: 0,
      title: 'Letzter Freitag im Monat - Senioren Kaffee',
      allDay: false,
      startDate: '2026-01-30',
      startTime: '09:00',
      endDate: '2026-01-30',
      endTime: '11:00',
      timezone: 'Europe/Zurich',
      location: 'Restaurant Lokal, Embrach',
      description: 'Gemütliches beisammen sein und quatschen. Von Zeit zu Zeit spielen wir auch folgende Spiele:\n\n- Schach\n- Ligretto\n- Hau den Lukas\n- Vergiss mein nicht\n\nEs wird definitiv nicht langweilig 😜',
      url: 'https://www.restaurantlokal.ch',
      isRecurring: true,
      frequency: 'MONTHLY',
      interval: '1',
      selectedDays: ['FR'],
      monthlyType: 'day',
      endType: 'count',
      recurrenceEndDate: '',
      occurrenceCount: '12',
      hasReminder: true,
      reminders: ['60'],
      exceptions: [],
      savedAt: new Date().toISOString()
    },
    {
      id: 'ical-creator-demo-senioren-treff@ical-creator',
      sequence: 5,
      title: 'Am 30. Tag jeden Monat - Senioren Treff',
      allDay: false,
      startDate: '2026-01-30',
      startTime: '09:00',
      endDate: '2026-01-30',
      endTime: '11:00',
      timezone: 'Europe/Zurich',
      location: 'Restaurant Lokal, Embrach',
      description: 'Wir treffen uns immer am 30. Tag des Monats.\n\nGemütliches beisammen sein und quatschen ist das Hauptmotto, von Zeit zu Zeit spielen wir auch folgende Spiele:\n\n- Schach\n- Ligretto\n- Hau den Lukas\n- Vergiss mein nicht\n\nEs wird definitiv nicht langweilig 😜',
      url: 'https://www.restaurantlokal.ch',
      isRecurring: true,
      frequency: 'MONTHLY',
      interval: '1',
      selectedDays: [],
      monthlyType: 'date',
      endType: 'count',
      recurrenceEndDate: '',
      occurrenceCount: '12',
      hasReminder: true,
      reminders: ['60'],
      exceptions: [],
      savedAt: new Date().toISOString()
    }
  ];
}

function loadDemoEventsIfEmpty() {
  const savedEvents = getSavedEvents();
  if (savedEvents.length === 0) {
    const demoEvents = getDemoEvents();
    localStorage.setItem(STORAGE_KEYS.SAVED_EVENTS, JSON.stringify(demoEvents));
  }
}

function saveEventToHistory(eventData) {
  try {
    const events = getSavedEvents();
    const existingIndex = events.findIndex(e => e.id === eventData.id);

    if (existingIndex >= 0) {
      // Update existing event
      events[existingIndex] = eventData;
    } else {
      // Add new event
      events.unshift(eventData);
    }

    localStorage.setItem(STORAGE_KEYS.SAVED_EVENTS, JSON.stringify(events));
    renderSavedEvents();
  } catch (_e) {
    console.warn('Could not save event to localStorage');
  }
}

// Used in onclick handler (see renderSavedEvents)
// eslint-disable-next-line no-unused-vars
function deleteEventFromHistory(eventId) {
  try {
    const events = getSavedEvents();
    const filtered = events.filter(e => e.id !== eventId);
    localStorage.setItem(STORAGE_KEYS.SAVED_EVENTS, JSON.stringify(filtered));

    // If we're editing this event, clear the current ID
    if (state.currentEventId === eventId) {
      state.currentEventId = null;
      saveFormState();
    }

    renderSavedEvents();
  } catch (_e) {
    console.warn('Could not delete event from localStorage');
  }
}

function clearAllSavedEvents() {
  if (confirm('Are you sure you want to delete all saved events?')) {
    localStorage.removeItem(STORAGE_KEYS.SAVED_EVENTS);
    state.currentEventId = null;
    saveFormState();
    renderSavedEvents();
  }
}

function renderSavedEvents() {
  const events = getSavedEvents();

  if (events.length === 0) {
    savedEventsSection.style.display = 'none';
    return;
  }

  savedEventsSection.style.display = 'block';
  savedEventsList.innerHTML = '';

  events.forEach(event => {
    const card = document.createElement('div');
    card.className = 'saved-event-card';

    // Format date/time
    let dateTimeStr = event.startDate || '';
    if (event.startTime && !event.allDay) {
      dateTimeStr += ` at ${event.startTime}`;
    }
    if (event.allDay) {
      dateTimeStr += ' (All day)';
    }

    // Build recurrence summary
    let recurrenceStr = '';
    if (event.isRecurring) {
      const freqMap = { 'DAILY': 'Daily', 'WEEKLY': 'Weekly', 'MONTHLY': 'Monthly' };
      recurrenceStr = freqMap[event.frequency] || event.frequency;
      if (event.interval && event.interval !== '1') {
        recurrenceStr = `Every ${event.interval} ${event.frequency.toLowerCase().replace('ly', '')}s`;
      }
    }

    // Build details HTML
    let detailsHtml = `<span class="saved-event-detail">📅 ${dateTimeStr}</span>`;

    if (event.location) {
      detailsHtml += `<span class="saved-event-detail">📍 ${escapeHtml(event.location)}</span>`;
    }

    if (event.timezone) {
      detailsHtml += `<span class="saved-event-detail">🌍 ${event.timezone.replace(/_/g, ' ')}</span>`;
    }

    card.innerHTML = `
          <div class="saved-event-title">${escapeHtml(event.title || 'Untitled Event')}</div>
          <div class="saved-event-details">
            ${detailsHtml}
          </div>
          ${recurrenceStr ? `<span class="saved-event-badge">${recurrenceStr}</span>` : ''}
          ${event.hasReminder ? '<span class="saved-event-badge">⏰ Reminder</span>' : ''}
          <div class="saved-event-actions">
            <button type="button" class="btn btn-primary btn-sm" onclick="loadEvent('${event.id}')">Load</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteEventFromHistory('${event.id}')">Delete</button>
          </div>
        `;

    savedEventsList.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Used in onclick handler (see renderSavedEvents)
// eslint-disable-next-line no-unused-vars
function loadEvent(eventId) {
  const events = getSavedEvents();
  const event = events.find(e => e.id === eventId);

  if (!event) return;

  // Set current event ID for future updates
  state.currentEventId = event.id;

  // Load all fields
  document.getElementById('title').value = event.title || '';
  allDayCheckbox.checked = event.allDay || false;
  document.getElementById('startDate').value = event.startDate || '';
  document.getElementById('startTime').value = event.startTime || '';
  document.getElementById('endDate').value = event.endDate || '';
  document.getElementById('endTime').value = event.endTime || '';
  timezoneSelect.value = event.timezone || 'UTC';
  document.getElementById('location').value = event.location || '';
  document.getElementById('description').value = event.description || '';
  document.getElementById('url').value = event.url || '';

  // Recurrence
  isRecurringCheckbox.checked = event.isRecurring || false;
  frequencySelect.value = event.frequency || 'DAILY';
  document.getElementById('interval').value = event.interval || '1';

  // Selected days
  state.selectedDays = new Set(event.selectedDays || []);
  updateDayPickerUI();

  // Monthly type
  const monthlyTypeRadio = document.querySelector(`input[name="monthlyType"][value="${event.monthlyType || 'date'}"]`);
  if (monthlyTypeRadio) monthlyTypeRadio.checked = true;

  // End type
  const endTypeRadio = document.querySelector(`input[name="endType"][value="${event.endType || 'date'}"]`);
  if (endTypeRadio) {
    endTypeRadio.checked = true;
    handleEndTypeChange({ target: endTypeRadio });
  }

  recurrenceEndDateInput.value = event.recurrenceEndDate || '';
  occurrenceCountInput.value = event.occurrenceCount || '10';

  // Reminders - handle both old and new format
  hasReminderCheckbox.checked = event.hasReminder || false;
  if (event.reminders && Array.isArray(event.reminders)) {
    state.reminders = event.reminders;
  } else if (event.reminderTime) {
    // Migrate from old format
    state.reminders = [event.reminderTime];
  } else if (event.hasReminder) {
    state.reminders = ['15'];
  } else {
    state.reminders = [];
  }
  renderReminders();
  updateAddButtonState();

  // Exceptions
  state.exceptions = new Set(event.exceptions || []);

  // Update UI
  handleAllDayToggle();
  handleRecurringToggle();
  handleReminderToggle();
  updateFrequencyOptions();
  updateMonthlyHints();

  if (isRecurringCheckbox.checked) {
    calculateOccurrences();
    renderCalendar(true);
  }

  // Save restored state
  saveFormState();
  state.formTouched = true;
  updateDownloadButtonState();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Show feedback
  showValidationStatus(true, 'Loaded', `Event "${event.title}" loaded into form`);
}

function createEventDataForSave() {
  // Generate or reuse event ID
  const eventId = state.currentEventId || generateUID();
  state.currentEventId = eventId;

  // Get existing event to check for sequence number
  const existingEvents = getSavedEvents();
  const existingEvent = existingEvents.find(e => e.id === eventId);
  // Increment sequence if event exists, otherwise start at 0
  const sequence = existingEvent ? (existingEvent.sequence || 0) + 1 : 0;

  return {
    id: eventId,
    sequence: sequence,
    title: document.getElementById('title').value,
    allDay: allDayCheckbox.checked,
    startDate: document.getElementById('startDate').value,
    startTime: document.getElementById('startTime').value,
    endDate: document.getElementById('endDate').value,
    endTime: document.getElementById('endTime').value,
    timezone: timezoneSelect.value,
    location: document.getElementById('location').value,
    description: document.getElementById('description').value,
    url: document.getElementById('url').value,
    isRecurring: isRecurringCheckbox.checked,
    frequency: frequencySelect.value,
    interval: document.getElementById('interval').value,
    selectedDays: Array.from(state.selectedDays),
    monthlyType: document.querySelector('input[name="monthlyType"]:checked')?.value || 'date',
    endType: document.querySelector('input[name="endType"]:checked')?.value || 'date',
    recurrenceEndDate: recurrenceEndDateInput.value,
    occurrenceCount: occurrenceCountInput.value,
    hasReminder: hasReminderCheckbox.checked,
    reminders: [...state.reminders],
    exceptions: Array.from(state.exceptions),
    savedAt: new Date().toISOString()
  };
}

// ==================== Confetti Celebration ====================
const CONFETTI_COLORS = ['#14b8a6', '#f97316', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

function triggerConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  // Create confetti pieces
  const pieceCount = 500;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    container.appendChild(piece);
  }

  // Remove container after animation completes
  setTimeout(() => {
    container.remove();
  }, 4500);
}

// ==================== Start ====================
init();
