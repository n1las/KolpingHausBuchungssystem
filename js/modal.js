/**
 * Modal module for KolpingHaus application.
 * Handles the event detail/create modal dialog, form validation, and user interactions.
 */
window.Modal = (function() {
  let onSaveCallback = null;
  let onDeleteCallback = null;
  let currentUserRole = null;
  let currentEventId = null;   // null = creating, string = editing/viewing
  let isEditMode = false;

  // DOM references (cached on init)
  let modalEl, formEl, closeBtn;
  let titleInput, anfangInput, endeInput;
  let ansprechpartnerInput, emailInput, telefonInput;
  let bestuhlungSelect, personenanzahlInput;
  let vertragCheckbox, vertragStatusSelect;
  let notizenTextarea, serienterminCheckbox;
  let erstelltVonEl, erstelltAmEl, metaInfoSection;
  let btnBearbeiten, btnSpeichern, btnLoeschen;

  /** Cache all DOM references */
  function cacheDom() {
    modalEl = document.getElementById('termin-modal');
    formEl = document.getElementById('termin-form');
    closeBtn = modalEl.querySelector('.close-btn');

    titleInput = document.getElementById('termin-title');
    anfangInput = document.getElementById('termin-anfang');
    endeInput = document.getElementById('termin-ende');
    ansprechpartnerInput = document.getElementById('termin-ansprechpartner');
    emailInput = document.getElementById('termin-email');
    telefonInput = document.getElementById('termin-telefon');
    bestuhlungSelect = document.getElementById('termin-bestuhlung');
    personenanzahlInput = document.getElementById('termin-personenanzahl');
    vertragCheckbox = document.getElementById('termin-vertrag-checkbox');
    vertragStatusSelect = document.getElementById('termin-vertrag-status');
    notizenTextarea = document.getElementById('termin-notizen');
    serienterminCheckbox = document.getElementById('termin-serientermin');
    erstelltVonEl = document.getElementById('termin-erstellt-von');
    erstelltAmEl = document.getElementById('termin-erstellt-am');
    metaInfoSection = document.getElementById('meta-info-section');

    btnBearbeiten = document.getElementById('btn-bearbeiten');
    btnSpeichern = document.getElementById('btn-speichern');
    btnLoeschen = document.getElementById('btn-loeschen');
  }

  /** Get all form input/select/textarea elements */
  function getAllFormFields() {
    return formEl.querySelectorAll('input, select, textarea');
  }

  /** Enable or disable all form fields */
  function setFieldsEnabled(enabled) {
    getAllFormFields().forEach(el => {
      el.disabled = !enabled;
    });
    // Vertrag status is controlled by the checkbox state
    if (enabled && !vertragCheckbox.checked) {
      vertragStatusSelect.disabled = true;
    }
  }

  /** Clear all validation error styling */
  function clearValidationErrors() {
    formEl.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    formEl.querySelectorAll('.validation-msg').forEach(el => el.remove());
  }

  /** Show a validation error on a specific element */
  function showFieldError(element, message) {
    element.classList.add('invalid');
    // Optionally add error message below the element
    if (message) {
      const msg = document.createElement('span');
      msg.className = 'validation-msg';
      msg.style.cssText = 'color: #e74c3c; font-size: 0.78em; margin-top: 2px; display: block;';
      msg.textContent = message;
      element.parentNode.appendChild(msg);
    }
  }

  /** Convert a Date or ISO string to datetime-local input format */
  function toDatetimeLocalString(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const pad = n => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** Format an ISO string to a human-readable German date/time */
  function formatGermanDateTime(isoString) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('de-DE') + ' um ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
  }

  /** Get selected rooms from checkboxes */
  function getSelectedRooms() {
    const checkboxes = formEl.querySelectorAll('input[name="rooms"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  /** Set room checkboxes based on an array of room names */
  function setSelectedRooms(rooms) {
    const allCheckboxes = formEl.querySelectorAll('input[name="rooms"]');
    allCheckboxes.forEach(cb => {
      cb.checked = rooms.includes(cb.value);
    });
  }

  /** Validate the form and return errors */
  function validateForm() {
    clearValidationErrors();
    let valid = true;

    // 1. Title required
    if (!titleInput.value.trim()) {
      showFieldError(titleInput, 'Titel ist erforderlich');
      valid = false;
    }

    // 2. At least one room
    const rooms = getSelectedRooms();
    if (rooms.length === 0) {
      const roomFieldset = formEl.querySelector('.room-fieldset');
      if (roomFieldset) {
        roomFieldset.classList.add('invalid');
        showFieldError(roomFieldset, 'Mindestens ein Raum muss ausgewählt werden');
      }
      valid = false;
    }

    // 3. Start datetime required
    if (!anfangInput.value) {
      showFieldError(anfangInput, 'Anfang ist erforderlich');
      valid = false;
    }

    // 4. End must be after start (if provided)
    if (anfangInput.value && endeInput.value) {
      if (new Date(endeInput.value) <= new Date(anfangInput.value)) {
        showFieldError(endeInput, 'Ende muss nach dem Anfang liegen');
        valid = false;
      }
    }

    // 5. Ansprechpartner required
    if (!ansprechpartnerInput.value.trim()) {
      showFieldError(ansprechpartnerInput, 'Ansprechpartner ist erforderlich');
      valid = false;
    }

    // 6. At least email or telefon
    if (!emailInput.value.trim() && !telefonInput.value.trim()) {
      showFieldError(emailInput, 'E-Mail oder Telefon erforderlich');
      showFieldError(telefonInput);
      valid = false;
    }

    // 7. Vertrag status required if checkbox checked
    if (vertragCheckbox.checked && !vertragStatusSelect.value) {
      showFieldError(vertragStatusSelect, 'Status auswählen');
      valid = false;
    }

    return valid;
  }

  /** Collect form data into an object */
  function collectFormData() {
    let endValue = endeInput.value;
    // Default end to start + 1 hour if empty
    if (!endValue && anfangInput.value) {
      const startDate = new Date(anfangInput.value);
      startDate.setHours(startDate.getHours() + 1);
      endValue = toDatetimeLocalString(startDate);
    }

    return {
      eventId: currentEventId,
      title: titleInput.value.trim(),
      rooms: getSelectedRooms(),
      start: anfangInput.value,
      end: endValue,
      ansprechpartner: ansprechpartnerInput.value.trim(),
      email: emailInput.value.trim(),
      telefon: telefonInput.value.trim(),
      bestuhlung: bestuhlungSelect.value,
      personenanzahl: parseInt(personenanzahlInput.value) || 0,
      vertrag: {
        vorhanden: vertragCheckbox.checked,
        status: vertragCheckbox.checked ? vertragStatusSelect.value : ''
      },
      notizen: notizenTextarea.value.trim(),
      serientermin: serienterminCheckbox.checked
    };
  }

  /** Reset the form to its default state */
  function resetForm() {
    formEl.reset();
    clearValidationErrors();
    currentEventId = null;
    isEditMode = false;

    // Uncheck all room checkboxes
    formEl.querySelectorAll('input[name="rooms"]').forEach(cb => { cb.checked = false; });
    vertragStatusSelect.disabled = true;
  }

  return {
    /**
     * Initialize the modal module.
     * @param {Object} config - { onSave, onDelete, currentUserRole }
     */
    init: function(config) {
      onSaveCallback = config.onSave;
      onDeleteCallback = config.onDelete;
      currentUserRole = config.currentUserRole;

      cacheDom();

      // Close button
      closeBtn.addEventListener('click', () => this.close());

      // Backdrop click to close
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) this.close();
      });

      // Edit button
      btnBearbeiten.addEventListener('click', () => {
        isEditMode = true;
        setFieldsEnabled(true);
        btnBearbeiten.style.display = 'none';
        btnSpeichern.style.display = 'inline-block';
      });

      // Save button
      btnSpeichern.addEventListener('click', () => {
        if (!validateForm()) return;
        const formData = collectFormData();
        if (typeof onSaveCallback === 'function') {
          onSaveCallback(formData);
        }
      });

      // Delete button
      btnLoeschen.addEventListener('click', () => {
        if (!currentEventId) return;
        if (confirm('Möchten Sie diesen Termin wirklich löschen?')) {
          if (typeof onDeleteCallback === 'function') {
            onDeleteCallback(currentEventId);
          }
        }
      });

      // Vertrag checkbox toggles status select
      vertragCheckbox.addEventListener('change', () => {
        vertragStatusSelect.disabled = !vertragCheckbox.checked;
        if (!vertragCheckbox.checked) {
          vertragStatusSelect.value = '';
        }
      });
    },

    /**
     * Open the modal for creating a new event.
     */
    openForCreate: function() {
      resetForm();
      setFieldsEnabled(true);
      vertragStatusSelect.disabled = true;

      btnBearbeiten.style.display = 'none';
      btnSpeichern.style.display = 'inline-block';
      btnLoeschen.style.display = 'none';
      metaInfoSection.style.display = 'none';

      modalEl.style.display = 'block';
    },

    /**
     * Open the modal to view/edit an existing event.
     * @param {Object} eventObj - Store-format event object
     */
    openForView: function(eventObj) {
      resetForm();
      currentEventId = eventObj.id;

      // Populate fields
      titleInput.value = eventObj.title || '';
      setSelectedRooms(eventObj.rooms || []);
      anfangInput.value = toDatetimeLocalString(eventObj.start);
      endeInput.value = toDatetimeLocalString(eventObj.end);
      ansprechpartnerInput.value = eventObj.ansprechpartner || '';
      emailInput.value = eventObj.email || '';
      telefonInput.value = eventObj.telefon || '';
      bestuhlungSelect.value = eventObj.bestuhlung || 'Standard';
      personenanzahlInput.value = eventObj.personenanzahl || '';
      notizenTextarea.value = eventObj.notizen || '';
      serienterminCheckbox.checked = eventObj.serientermin || false;

      // Vertrag
      if (eventObj.vertrag && eventObj.vertrag.vorhanden) {
        vertragCheckbox.checked = true;
        vertragStatusSelect.value = eventObj.vertrag.status || '';
        vertragStatusSelect.disabled = false;
      } else {
        vertragCheckbox.checked = false;
        vertragStatusSelect.value = '';
        vertragStatusSelect.disabled = true;
      }

      // Meta info
      if (eventObj.erstelltVon || eventObj.erstelltAm) {
        metaInfoSection.style.display = 'block';
        // Look up display name
        const accounts = window.Store.getAccounts();
        const creator = accounts.find(a => a.username === eventObj.erstelltVon);
        erstelltVonEl.textContent = creator ? creator.name : eventObj.erstelltVon || '—';
        erstelltAmEl.textContent = eventObj.erstelltAm ? formatGermanDateTime(eventObj.erstelltAm) : '—';
      } else {
        metaInfoSection.style.display = 'none';
      }

      // Disable all fields (view mode)
      setFieldsEnabled(false);

      // Determine button visibility based on role and event ownership
      const currentUser = window.Auth.getCurrentUser();

      // Edit button: Stadt can edit all, Gastro can only edit own
      if (currentUserRole === 'stadt') {
        btnBearbeiten.style.display = 'inline-block';
      } else if (currentUserRole === 'gastro' && currentUser && eventObj.erstelltVon === currentUser.username) {
        btnBearbeiten.style.display = 'inline-block';
      } else {
        btnBearbeiten.style.display = 'none';
      }

      btnSpeichern.style.display = 'none';

      // Delete button: Only Stadt can delete
      btnLoeschen.style.display = (currentUserRole === 'stadt') ? 'inline-block' : 'none';

      modalEl.style.display = 'block';
    },

    /**
     * Close the modal.
     */
    close: function() {
      modalEl.style.display = 'none';
      resetForm();
    }
  };
})();
