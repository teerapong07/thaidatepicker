/*!
 * ThaiDatePicker v1.1
 * Buddhist Era (พ.ศ.) & Common Era (ค.ศ.) date picker
 * Usage: new ThaiDatePicker(inputElement, options)
 */
(function (global) {
  'use strict';

  const _instances = [];

  const I18N = {
    th: {
      months: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
      monthsShort: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
      weekdays: ['อา','จ','อ','พ','พฤ','ศ','ส'],
      timeLabel: 'เวลา',
      todayBtn: 'วันนี้',
      nowBtn: 'ตอนนี้',
      clearBtn: 'ล้างค่า'
    },
    en: {
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
      monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      weekdays: ['Su','Mo','Tu','We','Th','Fr','Sa'],
      timeLabel: 'Time',
      todayBtn: 'Today',
      nowBtn: 'Now',
      clearBtn: 'Clear'
    }
  };

  const CE_OFFSET = 543;

  const CAL_ICON = `<svg class="tdp-icon" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="3"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`;

  function pad2(n) { return String(n).padStart(2, '0'); }

  function _parseAnyDate(str, era) {
    if (!str) return null;
    if (str instanceof Date) return { year: str.getFullYear(), month: str.getMonth(), day: str.getDate(), hour: str.getHours(), minute: str.getMinutes() };
    if (str === 'today') {
      const n = new Date();
      return { year: n.getFullYear(), month: n.getMonth(), day: n.getDate(), hour: n.getHours(), minute: n.getMinutes() };
    }
    str = str.trim();

    // HH:mm (Time only)
    var timeOnly = str.match(/^(\d{2}):(\d{2})$/);
    if (timeOnly) {
      return { year: 0, month: 0, day: 0, hour: parseInt(timeOnly[1]), minute: parseInt(timeOnly[2]), onlyTime: true };
    }

    // YYYY-MM-DD (ISO)
    var iso = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (iso) {
      var y = parseInt(iso[1]), m = parseInt(iso[2]), d = parseInt(iso[3]);
      var hh = iso[4] ? parseInt(iso[4]) : 0;
      var mm = iso[5] ? parseInt(iso[5]) : 0;
      if (y > 2400) y -= CE_OFFSET;
      if (y >= 100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)
        return { year: y, month: m - 1, day: d, hour: hh, minute: mm };
    }

    // DD/MM/YYYY
    var dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ](\d{2}):(\d{2}))?/);
    if (dmy) {
      var d2 = parseInt(dmy[1]), m2 = parseInt(dmy[2]), y2 = parseInt(dmy[3]);
      var hh2 = dmy[4] ? parseInt(dmy[4]) : 0;
      var mm2 = dmy[5] ? parseInt(dmy[5]) : 0;
      if (y2 > 2400) y2 -= CE_OFFSET;
      if (m2 >= 1 && m2 <= 12 && d2 >= 1 && d2 <= 31)
        return { year: y2, month: m2 - 1, day: d2, hour: hh2, minute: mm2 };
    }

    return null;
  }

  function ThaiDatePicker(input, options) {
    this.input    = input;
    this.opts     = Object.assign({
      format: 'DD/MM/YYYY',
      onChange: null,
      submitFormat: null,
      enableTime: false,
      onlyTime: false,
      lang: 'th',
      era: 'be',
      showTodayButton: true,
      showClearButton: true,
      minDate: null,
      maxDate: null,
      linkedTo: null
    }, options || {});
    this.selected = null;
    this.selectedTime = { hour: 0, minute: 0 };

    const now = new Date();
    this.viewYear  = now.getFullYear();
    this.viewMonth = now.getMonth();
    this.viewMode  = 'day';
    
    const displayYear = this.viewYear + (this.opts.era === 'be' ? CE_OFFSET : 0);
    this.yearRangeStart = Math.floor(displayYear / 16) * 16 - 16;

    this._init();
  }

  ThaiDatePicker.prototype._init = function () {
    const wrapper = document.createElement('div');
    wrapper.className = 'tdp-wrapper';
    this.input.parentNode.insertBefore(wrapper, this.input);
    wrapper.appendChild(this.input);
    this.wrapper = wrapper;

    wrapper.insertAdjacentHTML('beforeend', CAL_ICON);
    this.input.readOnly = true;

    // Attributes
    if (this.input.dataset.enableTime !== undefined) this.opts.enableTime = this.input.dataset.enableTime !== 'false';
    if (this.input.dataset.onlyTime !== undefined) this.opts.onlyTime = this.input.dataset.onlyTime !== 'false';
    if (this.input.dataset.lang) this.opts.lang = this.input.dataset.lang;
    if (this.input.dataset.era) this.opts.era = this.input.dataset.era;
    if (this.input.dataset.showToday !== undefined) this.opts.showTodayButton = this.input.dataset.showToday !== 'false';
    if (this.input.dataset.showClear !== undefined) this.opts.showClearButton = this.input.dataset.showClear !== 'false';
    if (this.input.dataset.minDate) this.opts.minDate = this.input.dataset.minDate;
    if (this.input.dataset.maxDate) this.opts.maxDate = this.input.dataset.maxDate;
    if (this.input.dataset.linkedTo) this.opts.linkedTo = this.input.dataset.linkedTo;

    // Parse Constraints
    if (this.opts.minDate) this.opts.minDate = _parseAnyDate(this.opts.minDate, 'ce');
    if (this.opts.maxDate) this.opts.maxDate = _parseAnyDate(this.opts.maxDate, 'ce');

    if (this.opts.onlyTime) {
      this.opts.enableTime = true;
      if (this.opts.format === 'DD/MM/YYYY') this.opts.format = 'HH:mm';
    } else if (this.opts.enableTime && this.opts.format === 'DD/MM/YYYY') {
      this.opts.format = 'DD/MM/YYYY HH:mm';
    }

    if (!this.input.placeholder) {
      if (this.opts.onlyTime) this.input.placeholder = '--:--';
      else {
        const fmt = this.opts.lang === 'th' ? 'วว/ดด/ปปปป' : 'DD/MM/YYYY';
        this.input.placeholder = this.opts.enableTime ? fmt + ' --:--' : fmt;
      }
    }

    if (this.opts.submitFormat && this.input.name) {
      this._hiddenInput = document.createElement('input');
      this._hiddenInput.type = 'hidden';
      this._hiddenInput.name = this.input.name;
      this.input.removeAttribute('name');
      this.input.parentNode.insertBefore(this._hiddenInput, this.input.nextSibling);
    }

    var initVal = this.input.getAttribute('value') || this.input.value;
    if (initVal && initVal !== '0000-00-00' && initVal !== '') {
      var parsed = _parseAnyDate(initVal, this.opts.era);
      if (parsed) {
        if (!parsed.onlyTime) this.selected = { year: parsed.year, month: parsed.month, day: parsed.day };
        this.selectedTime = { hour: parsed.hour, minute: parsed.minute };
        this.viewYear  = parsed.year || this.viewYear;
        this.viewMonth = parsed.month || this.viewMonth;
        this._updateInput();
      }
    }

    this.popup = this._buildPopup();
    document.body.appendChild(this.popup);

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target) && !this.popup.contains(e.target)) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    window.addEventListener('scroll', () => { if (this._isOpen()) this._position(); }, true);
    window.addEventListener('resize', () => { if (this._isOpen()) this._position(); });

    this._render();
    _instances.push(this);
    this.input.setAttribute('data-tdp-idx', _instances.length - 1);
  };

  ThaiDatePicker.prototype._buildPopup = function () {
    const popup = document.createElement('div');
    popup.className = 'tdp-popup';
    const i18n = I18N[this.opts.lang];
    
    let html = `
      <div class="tdp-header ${this.opts.onlyTime ? 'tdp-hidden' : ''}">
        <button class="tdp-nav tdp-prev">&#8249;</button>
        <span class="tdp-title"></span>
        <button class="tdp-nav tdp-next">&#8250;</button>
      </div>
      <div class="tdp-day-view ${this.opts.onlyTime ? 'tdp-hidden' : ''}">
        <div class="tdp-weekdays">${i18n.weekdays.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="tdp-days"></div>
      </div>
      <div class="tdp-month-view"><div class="tdp-months"></div></div>
      <div class="tdp-year-view"><div class="tdp-years"></div></div>
      <div class="tdp-time-view ${this.opts.enableTime ? '' : 'tdp-hidden'} ${this.opts.onlyTime ? 'tdp-only' : ''}">
        <div class="tdp-time-label">${i18n.timeLabel}</div>
        <div class="tdp-time-scroller">
          <div class="tdp-time-highlight"></div>
          <div class="tdp-time-col tdp-col-h"></div>
          <span class="tdp-time-sep">:</span>
          <div class="tdp-time-col tdp-col-m"></div>
        </div>
      </div>
      <div class="tdp-footer ${(!this.opts.showTodayButton && !this.opts.showClearButton) ? 'tdp-hidden' : ''}">
        <button class="tdp-btn tdp-btn-today ${!this.opts.showTodayButton ? 'tdp-hidden' : ''}">${this.opts.onlyTime ? i18n.nowBtn : i18n.todayBtn}</button>
        <button class="tdp-btn tdp-btn-clear ${!this.opts.showClearButton ? 'tdp-hidden' : ''}">${i18n.clearBtn}</button>
      </div>`;
    
    popup.innerHTML = html;

    const hCol = popup.querySelector('.tdp-col-h');
    const mCol = popup.querySelector('.tdp-col-m');

    for (let i = 0; i < 24; i++) {
      const item = document.createElement('div');
      item.className = 'tdp-time-item';
      item.textContent = pad2(i);
      item.addEventListener('click', () => this._scrollTime(hCol, i));
      hCol.appendChild(item);
    }
    for (let i = 0; i < 60; i++) {
      const item = document.createElement('div');
      item.className = 'tdp-time-item';
      item.textContent = pad2(i);
      item.addEventListener('click', () => this._scrollTime(mCol, i));
      mCol.appendChild(item);
    }

    // Scroll listeners
    let scrollTimer;
    const onScroll = (col, unit) => {
      const itemHeight = 36;
      const index = Math.round(col.scrollTop / itemHeight);
      const items = col.querySelectorAll('.tdp-time-item');
      const finalIndex = Math.max(0, Math.min(items.length - 1, index));
      const closest = items[finalIndex];

      if (closest && !closest.classList.contains('tdp-selected')) {
        items.forEach(i => i.classList.remove('tdp-selected'));
        closest.classList.add('tdp-selected');
        
        const val = parseInt(closest.textContent);
        if (unit === 'h') this.selectedTime.hour = val;
        else this.selectedTime.minute = val;
      }

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (this.selected || this.opts.onlyTime) this._updateInput();
      }, 100);
    };

    hCol.addEventListener('scroll', () => onScroll(hCol, 'h'), { passive: true });
    mCol.addEventListener('scroll', () => onScroll(mCol, 'm'), { passive: true });

    const onWheel = (e, col, unit) => {
      e.preventDefault();
      const isUp = e.deltaY < 0;
      let val = (unit === 'h' ? this.selectedTime.hour : this.selectedTime.minute) + (isUp ? -1 : 1);
      if (unit === 'h') {
        if (val < 0) val = 23; if (val > 23) val = 0;
        this.selectedTime.hour = val;
      } else {
        if (val < 0) val = 59; if (val > 59) val = 0;
        this.selectedTime.minute = val;
      }
      this._scrollTime(col, val);
    };

    hCol.addEventListener('wheel', (e) => onWheel(e, hCol, 'h'), { passive: false });
    mCol.addEventListener('wheel', (e) => onWheel(e, mCol, 'm'), { passive: false });

    // Nav and Footer Events
    if (!this.opts.onlyTime) {
      popup.querySelector('.tdp-title').addEventListener('click', () => {
        if (this.viewMode === 'day') this.viewMode = 'month';
        else if (this.viewMode === 'month') {
          this.viewMode = 'year';
          const displayYear = this.viewYear + (this.opts.era === 'be' ? CE_OFFSET : 0);
          this.yearRangeStart = Math.floor(displayYear / 16) * 16;
        } else this.viewMode = 'day';
        this._render();
      });

      popup.querySelector('.tdp-prev').addEventListener('click', () => {
        if (this.viewMode === 'day') {
          this.viewMonth--;
          if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
        } else if (this.viewMode === 'month') this.viewYear--;
        else this.yearRangeStart -= 16;
        this._render();
      });

      popup.querySelector('.tdp-next').addEventListener('click', () => {
        if (this.viewMode === 'day') {
          this.viewMonth++;
          if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
        } else if (this.viewMode === 'month') this.viewYear++;
        else this.yearRangeStart += 16;
        this._render();
      });
    }

    const btnToday = popup.querySelector('.tdp-btn-today');
    const btnClear = popup.querySelector('.tdp-btn-clear');

    btnToday.addEventListener('click', () => {
      const now = new Date();
      if (!this.opts.onlyTime) this.selected = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
      this.selectedTime = { hour: now.getHours(), minute: now.getMinutes() };
      this.viewYear = now.getFullYear();
      this.viewMonth = now.getMonth();
      this._updateInput();
      this._render();
      this._syncTimeScroll();
      if (!this.opts.enableTime) this.close();
    });

    btnClear.addEventListener('click', () => {
      this.clear();
      this.close();
    });

    return popup;
  };

  ThaiDatePicker.prototype._scrollTime = function (col, val) {
    const itemHeight = 36;
    col.scrollTo({ top: val * itemHeight, behavior: 'smooth' });
  };

  ThaiDatePicker.prototype._syncTimeScroll = function () {
    const hCol = this.popup.querySelector('.tdp-col-h');
    const mCol = this.popup.querySelector('.tdp-col-m');
    const itemHeight = 36;
    hCol.scrollTop = this.selectedTime.hour * itemHeight;
    mCol.scrollTop = this.selectedTime.minute * itemHeight;
    hCol.querySelectorAll('.tdp-time-item').forEach((i, idx) => {
      idx === this.selectedTime.hour ? i.classList.add('tdp-selected') : i.classList.remove('tdp-selected');
    });
    mCol.querySelectorAll('.tdp-time-item').forEach((i, idx) => {
      idx === this.selectedTime.minute ? i.classList.add('tdp-selected') : i.classList.remove('tdp-selected');
    });
  };

  ThaiDatePicker.prototype._checkDisabled = function (y, m, d) {
    const target = new Date(y, m, d);
    if (this.opts.minDate) {
      const min = new Date(this.opts.minDate.year, this.opts.minDate.month, this.opts.minDate.day);
      if (target < min) return true;
    }
    if (this.opts.maxDate) {
      const max = new Date(this.opts.maxDate.year, this.opts.maxDate.month, this.opts.maxDate.day);
      if (target > max) return true;
    }
    return false;
  };

  ThaiDatePicker.prototype._render = function () {
    if (this.opts.onlyTime) {
      this._syncTimeScroll();
      return;
    }
    this._renderTitle();
    const dayView   = this.popup.querySelector('.tdp-day-view');
    const monthView = this.popup.querySelector('.tdp-month-view');
    const yearView  = this.popup.querySelector('.tdp-year-view');

    if (this.viewMode === 'day') {
      dayView.classList.remove('tdp-hidden');
      monthView.classList.remove('tdp-active');
      yearView.classList.remove('tdp-active');
      this._renderDays();
    } else if (this.viewMode === 'month') {
      dayView.classList.add('tdp-hidden');
      monthView.classList.add('tdp-active');
      yearView.classList.remove('tdp-active');
      this._renderMonths();
    } else {
      dayView.classList.add('tdp-hidden');
      monthView.classList.remove('tdp-active');
      yearView.classList.add('tdp-active');
      this._renderYears();
    }
  };

  ThaiDatePicker.prototype._renderTitle = function () {
    const t = this.popup.querySelector('.tdp-title');
    if (!t) return;
    const i18n = I18N[this.opts.lang];
    const displayYear = this.viewYear + (this.opts.era === 'be' ? CE_OFFSET : 0);
    const eraLabel = this.opts.lang === 'th' ? (this.opts.era === 'be' ? 'พ.ศ. ' : 'ค.ศ. ') : (this.opts.era === 'be' ? 'BE ' : 'CE ');

    if (this.viewMode === 'day') t.textContent = `${i18n.months[this.viewMonth]} ${displayYear}`;
    else if (this.viewMode === 'month') t.textContent = `${eraLabel}${displayYear}`;
    else t.textContent = `${this.yearRangeStart} – ${this.yearRangeStart + 15}`;
  };

  ThaiDatePicker.prototype._renderDays = function () {
    const grid = this.popup.querySelector('.tdp-days');
    grid.innerHTML = '';
    const today     = new Date();
    const firstDay  = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMon = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrev= new Date(this.viewYear, this.viewMonth, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) this._dayCell(grid, daysInPrev - i, true, false, false, null);
    for (let d = 1; d <= daysInMon; d++) {
      const isToday = d === today.getDate() && this.viewMonth === today.getMonth() && this.viewYear === today.getFullYear();
      const isSel   = this.selected && this.selected.year === this.viewYear && this.selected.month === this.viewMonth && this.selected.day === d;
      const isDisabled = this._checkDisabled(this.viewYear, this.viewMonth, d);

      this._dayCell(grid, d, false, isToday, isSel, isDisabled ? null : () => {
        this.selected = { year: this.viewYear, month: this.viewMonth, day: d };
        this._updateInput();
        if (!this.opts.enableTime) this.close();
      }, isDisabled);
    }
    const total = firstDay + daysInMon;
    const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= rem; d++) this._dayCell(grid, d, true, false, false, null);
  };

  ThaiDatePicker.prototype._dayCell = function (grid, text, other, today, selected, onClick, isDisabled) {
    const el = document.createElement('div');
    el.className = 'tdp-day';
    el.textContent = text;
    if (other) el.classList.add('tdp-other');
    if (today) el.classList.add('tdp-today');
    if (selected) el.classList.add('tdp-selected');
    if (isDisabled) el.classList.add('tdp-disabled');
    if (onClick) el.addEventListener('click', onClick);
    grid.appendChild(el);
  };

  ThaiDatePicker.prototype._renderMonths = function () {
    const grid = this.popup.querySelector('.tdp-months');
    grid.innerHTML = '';
    const i18n = I18N[this.opts.lang];
    i18n.months.forEach((m, i) => {
      const el = document.createElement('div');
      el.className = 'tdp-month';
      el.textContent = i18n.monthsShort[i];
      if (this.selected && this.selected.year === this.viewYear && this.selected.month === i) el.classList.add('tdp-selected');
      el.addEventListener('click', () => { this.viewMonth = i; this.viewMode = 'day'; this._render(); });
      grid.appendChild(el);
    });
  };

  ThaiDatePicker.prototype._renderYears = function () {
    const grid = this.popup.querySelector('.tdp-years');
    grid.innerHTML = '';
    for (let y = this.yearRangeStart; y < this.yearRangeStart + 16; y++) {
      const ceYear = y - (this.opts.era === 'be' ? CE_OFFSET : 0);
      const el = document.createElement('div');
      el.className = 'tdp-year';
      el.textContent = y;
      if (this.selected && this.selected.year === ceYear) el.classList.add('tdp-selected');
      el.addEventListener('click', () => { this.viewYear = ceYear; this.viewMode = 'month'; this._render(); });
      grid.appendChild(el);
    }
  };

  ThaiDatePicker.prototype._updateInput = function () {
    let val = '';
    const i18n = I18N[this.opts.lang];
    if (this.opts.onlyTime) {
      val = this.opts.format
        .replace('HH', pad2(this.selectedTime.hour))
        .replace('mm', pad2(this.selectedTime.minute));
    } else if (this.selected) {
      const { year, month, day } = this.selected;
      const displayYear = year + (this.opts.era === 'be' ? CE_OFFSET : 0);
      val = this.opts.format
        .replace('DD', pad2(day))
        .replace('MM', pad2(month + 1))
        .replace('YYYY', displayYear)
        .replace('D', day)
        .replace('M', month + 1)
        .replace('HH', pad2(this.selectedTime.hour))
        .replace('mm', pad2(this.selectedTime.minute));
    }

    this.input.value = val;

    if (this._hiddenInput && this.opts.submitFormat) {
      let sf = this.opts.submitFormat;
      let hiddenVal = '';
      if (this.opts.onlyTime) {
        hiddenVal = pad2(this.selectedTime.hour) + ':' + pad2(this.selectedTime.minute);
      } else if (this.selected) {
        const { year, month, day } = this.selected;
        if (sf === 'CE') hiddenVal = year + '-' + pad2(month + 1) + '-' + pad2(day);
        else if (sf === 'BE') hiddenVal = (year + CE_OFFSET) + '-' + pad2(month + 1) + '-' + pad2(day);
        else hiddenVal = sf.replace('DD', pad2(day)).replace('MM', pad2(month + 1)).replace('YYYY', year + CE_OFFSET).replace('YYYY-CE', year).replace('D', day).replace('M', month + 1).replace('HH', pad2(this.selectedTime.hour)).replace('mm', pad2(this.selectedTime.minute));
      }
      this._hiddenInput.value = hiddenVal;
    }

    // Linked Instances Logic
    if (this.opts.linkedTo && this.selected) {
      const target = _getInstance(this.opts.linkedTo);
      if (target) {
        target.opts.minDate = { year: this.selected.year, month: this.selected.month, day: this.selected.day };
        if (target._isOpen()) target._render();
      }
    }

    if (typeof this.opts.onChange === 'function') {
      const res = {
        hour: this.selectedTime.hour, minute: this.selectedTime.minute,
        formatted: val
      };
      if (this.selected) {
        res.day = this.selected.day;
        res.month = this.selected.month + 1;
        res.yearBE = this.selected.year + CE_OFFSET;
        res.yearCE = this.selected.year;
        const eraText = this.opts.lang === 'th' ? (this.opts.era === 'be' ? 'พ.ศ.' : 'ค.ศ.') : (this.opts.era === 'be' ? 'BE' : 'CE');
        res.longFormat = `${res.day} ${i18n.months[this.selected.month]} ${eraText} ${this.opts.era === 'be' ? res.yearBE : res.yearCE}` + (this.opts.enableTime ? ` ${i18n.timeLabel} ${pad2(res.hour)}:${pad2(res.minute)}` : '');
      }
      this.opts.onChange(res);
    }
  };

  ThaiDatePicker.prototype._isOpen = function () { return this.popup.classList.contains('tdp-active'); };

  ThaiDatePicker.prototype._position = function () {
    const rect = this.input.getBoundingClientRect();
    const popW = 300;
    const popH = this.popup.offsetHeight || (this.opts.onlyTime ? 200 : 380);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = (spaceBelow >= popH || spaceBelow >= spaceAbove) ? rect.bottom + 6 : rect.top - popH - 6;
    let left = rect.left;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (left < 8) left = 8;

    this.popup.style.top = top + 'px';
    this.popup.style.left = left + 'px';
  };

  ThaiDatePicker.prototype.open = function () {
    if (this.opts.readonly) return;
    _instances.forEach(inst => inst.close());
    this.viewMode = 'day';
    if (this.selected) {
      this.viewYear  = this.selected.year;
      this.viewMonth = this.selected.month;
    }
    this._render();
    this.popup.classList.add('tdp-active');
    this._position();
    setTimeout(() => this._syncTimeScroll(), 10);
  };

  ThaiDatePicker.prototype.close = function () { this.popup.classList.remove('tdp-active'); };
  ThaiDatePicker.prototype.toggle = function () { this._isOpen() ? this.close() : this.open(); };

  ThaiDatePicker.prototype.getValue = function () {
    const res = { hour: this.selectedTime.hour, minute: this.selectedTime.minute, formatted: this.input.value };
    if (this.selected) {
      res.day = this.selected.day;
      res.month = this.selected.month + 1;
      res.yearBE = this.selected.year + CE_OFFSET;
      res.yearCE = this.selected.year;
    }
    return (this.selected || this.opts.onlyTime) ? res : null;
  };

  ThaiDatePicker.prototype.setValue = function (day, month, yearBE, hour, minute) {
    if (day !== undefined && month !== undefined && yearBE !== undefined) {
      this.selected = { day, month: month - 1, year: yearBE - CE_OFFSET };
      this.viewYear = this.selected.year;
      this.viewMonth = this.selected.month;
    }
    this.selectedTime = { hour: hour || 0, minute: minute || 0 };
    this._updateInput();
  };

  ThaiDatePicker.prototype.clear = function () {
    this.selected = null;
    this.input.value = '';
    if (this._hiddenInput) this._hiddenInput.value = '';
  };

  ThaiDatePicker.prototype.setReadonly = function (bool) {
    this.opts.readonly = bool;
    if (bool) {
      this.input.setAttribute('data-tdp-disabled', '1');
      this.input.style.pointerEvents = 'none';
      this.input.style.backgroundColor = 'rgba(0,0,0,0.05)';
      this.close();
    } else {
      this.input.removeAttribute('data-tdp-disabled');
      this.input.style.pointerEvents = '';
      this.input.style.backgroundColor = '';
    }
  };

  function _initEl(el) {
    if (el.getAttribute('data-thaidatepicker') === null) return;
    if (el.hasAttribute('data-tdp-ready')) return;
    el.setAttribute('data-tdp-ready', '1');
    var opts = {};
    if (el.dataset.format) opts.format = el.dataset.format;
    if (el.dataset.enableTime !== undefined) opts.enableTime = el.dataset.enableTime !== 'false';
    if (el.dataset.onlyTime !== undefined) opts.onlyTime = el.dataset.onlyTime !== 'false';
    if (el.dataset.lang) opts.lang = el.dataset.lang;
    if (el.dataset.era) opts.era = el.dataset.era;
    if (el.dataset.showToday !== undefined) opts.showTodayButton = el.dataset.showToday !== 'false';
    if (el.dataset.showClear !== undefined) opts.showClearButton = el.dataset.showClear !== 'false';
    if (el.dataset.minDate) opts.minDate = el.dataset.minDate;
    if (el.dataset.maxDate) opts.maxDate = el.dataset.maxDate;
    if (el.dataset.linkedTo) opts.linkedTo = el.dataset.linkedTo;
    new ThaiDatePicker(el, opts);
  }

  function _initAll(root) { (root || document).querySelectorAll('[data-thaidatepicker]:not([data-tdp-ready])').forEach(_initEl); }
  document.addEventListener('DOMContentLoaded', () => _initAll());

  var _observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        _initEl(node);
        _initAll(node);
      });
    });
  });
  _observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', e => {
    var el = e.target;
    if (!el) return;
    var idx = el.getAttribute('data-tdp-idx');
    var hasAttr = el.getAttribute('data-thaidatepicker') !== null;
    if (idx === null && !hasAttr) return;
    if (hasAttr && !el.hasAttribute('data-tdp-ready')) { _initEl(el); idx = el.getAttribute('data-tdp-idx'); }
    var inst = idx !== null ? _instances[parseInt(idx)] : _instances.find(i => i.input === el);
    if (inst) { e.stopPropagation(); inst.toggle(); }
  }, true);

  function _applyISO(inst, isoDate) {
    if (!isoDate || isoDate === '0000-00-00' || isoDate === '') inst.clear();
    else {
      var parts = isoDate.split(/[- T:]/).map(Number);
      if (parts.length >= 3) inst.setValue(parts[2], parts[1], parts[0] + CE_OFFSET, parts[3] || 0, parts[4] || 0);
      else if (parts.length === 2) inst.setValue(undefined, undefined, undefined, parts[0], parts[1]);
    }
  }

  function _getInstance(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return null;
    var idx = el.getAttribute('data-tdp-idx');
    var inst = idx !== null ? _instances[parseInt(idx)] : _instances.find(i => i.input === el);
    return inst;
  }

  ThaiDatePicker.setValueFromISO = function (el, isoDate) {
    var inst = _getInstance(el);
    if (inst) _applyISO(inst, isoDate);
  };

  ThaiDatePicker.getInstances = function () { return _instances; };
  global.ThaiDatePicker = ThaiDatePicker;
})(window);