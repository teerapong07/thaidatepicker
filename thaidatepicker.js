/*!
 * ThaiDatePicker v1.0
 * Buddhist Era (พ.ศ.) date picker
 * Usage: new ThaiDatePicker(inputElement, options)
 */
(function (global) {
  'use strict';

  const _instances = [];

  const THAI_MONTHS = [
    'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน',
    'พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม',
    'กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'
  ];
  const THAI_MONTHS_SHORT = [
    'ม.ค.','ก.พ.','มี.ค.','เม.ย.',
    'พ.ค.','มิ.ย.','ก.ค.','ส.ค.',
    'ก.ย.','ต.ค.','พ.ย.','ธ.ค.'
  ];
  const WEEKDAYS = ['อา','จ','อ','พ','พฤ','ศ','ส'];
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

  function ThaiDatePicker(input, options) {
    this.input    = input;
    this.opts     = Object.assign({ format: 'DD/MM/YYYY', onChange: null }, options || {});
    this.selected = null;

    const now = new Date();
    this.viewYear  = now.getFullYear();
    this.viewMonth = now.getMonth();
    this.viewMode  = 'day';
    this.yearRangeStart = Math.floor((this.viewYear + CE_OFFSET) / 16) * 16 - 16;

    this._init();
  }

  ThaiDatePicker.prototype._init = function () {
    // wrap input
    const wrapper = document.createElement('div');
    wrapper.className = 'tdp-wrapper';
    this.input.parentNode.insertBefore(wrapper, this.input);
    wrapper.appendChild(this.input);
    this.wrapper = wrapper;

    // icon
    wrapper.insertAdjacentHTML('beforeend', CAL_ICON);

    // make input readonly & set placeholder
    this.input.readOnly = true;
    if (!this.input.placeholder) this.input.placeholder = 'วว/ดด/ปปปป';

    // build popup — append to body to escape modal overflow/z-index
    this.popup = this._buildPopup();
    document.body.appendChild(this.popup);

    // events — click เปิด/ปิด popup จัดการผ่าน event delegation ด้านล่างแทน
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target) && !this.popup.contains(e.target)) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    // reposition on scroll/resize
    window.addEventListener('scroll', () => { if (this._isOpen()) this._position(); }, true);
    window.addEventListener('resize', () => { if (this._isOpen()) this._position(); });

    this._render();
    _instances.push(this);
    this.input.setAttribute('data-tdp-idx', _instances.length - 1);
  };

  ThaiDatePicker.prototype._buildPopup = function () {
    const popup = document.createElement('div');
    popup.className = 'tdp-popup';
    popup.innerHTML = `
      <div class="tdp-header">
        <button class="tdp-nav tdp-prev">&#8249;</button>
        <span class="tdp-title"></span>
        <button class="tdp-nav tdp-next">&#8250;</button>
      </div>
      <div class="tdp-day-view">
        <div class="tdp-weekdays">${WEEKDAYS.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="tdp-days"></div>
      </div>
      <div class="tdp-month-view"><div class="tdp-months"></div></div>
      <div class="tdp-year-view"><div class="tdp-years"></div></div>`;

    popup.querySelector('.tdp-title').addEventListener('click', () => {
      if (this.viewMode === 'day')   this.viewMode = 'month';
      else if (this.viewMode === 'month') {
        this.viewMode = 'year';
        // คำนวณ range จาก viewYear ปัจจุบันให้ปีที่กำลังดูอยู่ตกใน range เสมอ
        var be = this.viewYear + CE_OFFSET;
        this.yearRangeStart = Math.floor(be / 16) * 16;
      }
      else this.viewMode = 'day';
      this._render();
    });

    popup.querySelector('.tdp-prev').addEventListener('click', () => {
      if (this.viewMode === 'day') {
        this.viewMonth--;
        if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
      } else if (this.viewMode === 'month') {
        this.viewYear--;
      } else {
        this.yearRangeStart -= 16;
      }
      this._render();
    });

    popup.querySelector('.tdp-next').addEventListener('click', () => {
      if (this.viewMode === 'day') {
        this.viewMonth++;
        if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
      } else if (this.viewMode === 'month') {
        this.viewYear++;
      } else {
        this.yearRangeStart += 16;
      }
      this._render();
    });

    return popup;
  };

  ThaiDatePicker.prototype._render = function () {
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
    if (this.viewMode === 'day') {
      t.textContent = `${THAI_MONTHS[this.viewMonth]} ${this.viewYear + CE_OFFSET}`;
    } else if (this.viewMode === 'month') {
      t.textContent = `พ.ศ. ${this.viewYear + CE_OFFSET}`;
    } else {
      t.textContent = `${this.yearRangeStart} – ${this.yearRangeStart + 15}`;
    }
  };

  ThaiDatePicker.prototype._renderDays = function () {
    const grid = this.popup.querySelector('.tdp-days');
    grid.innerHTML = '';
    const today     = new Date();
    const firstDay  = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMon = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const daysInPrev= new Date(this.viewYear, this.viewMonth, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      this._dayCell(grid, daysInPrev - i, true, false, false, null);
    }
    for (let d = 1; d <= daysInMon; d++) {
      const isToday = d === today.getDate() && this.viewMonth === today.getMonth() && this.viewYear === today.getFullYear();
      const isSel   = this.selected && this.selected.year === this.viewYear && this.selected.month === this.viewMonth && this.selected.day === d;
      this._dayCell(grid, d, false, isToday, isSel, () => {
        this.selected = { year: this.viewYear, month: this.viewMonth, day: d };
        this._updateInput();
        this.close();
      });
    }
    const total = firstDay + daysInMon;
    const rem   = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= rem; d++) {
      this._dayCell(grid, d, true, false, false, null);
    }
  };

  ThaiDatePicker.prototype._dayCell = function (grid, text, other, today, selected, onClick) {
    const el = document.createElement('div');
    el.className = 'tdp-day';
    el.textContent = text;
    if (other)    el.classList.add('tdp-other');
    if (today)    el.classList.add('tdp-today');
    if (selected) el.classList.add('tdp-selected');
    if (onClick)  el.addEventListener('click', onClick);
    grid.appendChild(el);
  };

  ThaiDatePicker.prototype._renderMonths = function () {
    const grid = this.popup.querySelector('.tdp-months');
    grid.innerHTML = '';
    THAI_MONTHS.forEach((m, i) => {
      const el = document.createElement('div');
      el.className = 'tdp-month';
      el.textContent = THAI_MONTHS_SHORT[i];
      if (this.selected && this.selected.year === this.viewYear && this.selected.month === i)
        el.classList.add('tdp-selected');
      el.addEventListener('click', () => {
        this.viewMonth = i;
        this.viewMode  = 'day';
        this._render();
      });
      grid.appendChild(el);
    });
  };

  ThaiDatePicker.prototype._renderYears = function () {
    const grid = this.popup.querySelector('.tdp-years');
    grid.innerHTML = '';
    for (let be = this.yearRangeStart; be < this.yearRangeStart + 16; be++) {
      const ce = be - CE_OFFSET;
      const el = document.createElement('div');
      el.className = 'tdp-year';
      el.textContent = be;
      if (this.selected && this.selected.year === ce) el.classList.add('tdp-selected');
      el.addEventListener('click', () => {
        this.viewYear = ce;
        this.viewMode = 'month';
        this._render();
      });
      grid.appendChild(el);
    }
  };

  ThaiDatePicker.prototype._updateInput = function () {
    if (!this.selected) return;
    const { year, month, day } = this.selected;
    const be = year + CE_OFFSET;

    let val = this.opts.format
      .replace('DD',   pad2(day))
      .replace('MM',   pad2(month + 1))
      .replace('YYYY', be)
      .replace('D',    day)
      .replace('M',    month + 1);

    this.input.value = val;

    if (typeof this.opts.onChange === 'function') {
      this.opts.onChange({
        day, month: month + 1, yearBE: be, yearCE: year,
        formatted: val,
        longFormat: `${day} ${THAI_MONTHS[month]} พ.ศ. ${be}`
      });
    }
  };

  ThaiDatePicker.prototype._isOpen = function () {
    return this.popup.classList.contains('tdp-active');
  };

  ThaiDatePicker.prototype._position = function () {
    const rect = this.input.getBoundingClientRect();

    // rect เป็น viewport-relative เสมอ ใช้กับ position:fixed ได้โดยตรง
    const popW = 300;
    const popH = this.popup.offsetHeight || 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // เปิดขึ้นบนถ้าพื้นที่ด้านล่างไม่พอ
    let top;
    if (spaceBelow >= popH || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6;
    } else {
      top = rect.top - popH - 6;
    }

    // คำนวณ left จาก viewport โดยตรง (ไม่บวก scrollX เพราะ fixed)
    let left = rect.left;
    if (left + popW > window.innerWidth - 8) {
      left = window.innerWidth - popW - 8;
    }
    if (left < 8) left = 8;

    this.popup.style.top  = top + 'px';
    this.popup.style.left = left + 'px';
  };

  ThaiDatePicker.prototype.open = function () {
    if (this.opts.readonly) return;
    _instances.forEach(function(inst) { inst.close(); });
    this.viewMode = 'day';
    if (this.selected) {
      this.viewYear  = this.selected.year;
      this.viewMonth = this.selected.month;
    }
    this._render();
    this.popup.classList.add('tdp-active');
    this._position();
  };

  ThaiDatePicker.prototype.close = function () {
    this.popup.classList.remove('tdp-active');
  };

  ThaiDatePicker.prototype.toggle = function () {
    this.popup.classList.contains('tdp-active') ? this.close() : this.open();
  };

  ThaiDatePicker.prototype.getValue = function () {
    return this.selected ? {
      day:      this.selected.day,
      month:    this.selected.month + 1,
      yearBE:   this.selected.year + CE_OFFSET,
      yearCE:   this.selected.year,
      formatted: this.input.value
    } : null;
  };

  ThaiDatePicker.prototype.setValue = function (day, month, yearBE) {
    this.selected  = { day, month: month - 1, year: yearBE - CE_OFFSET };
    this.viewYear  = this.selected.year;
    this.viewMonth = this.selected.month;
    this._updateInput();
  };

  ThaiDatePicker.prototype.clear = function () {
    this.selected  = null;
    this.input.value = '';
  };

  ThaiDatePicker.prototype.setReadonly = function (bool) {
    this.opts.readonly = bool;
    if (bool) {
      this.input.setAttribute('data-tdp-disabled', '1');
      this.input.style.pointerEvents = 'none';
      this.input.style.backgroundColor = '#f5f5f5';
      this.input.style.cursor = 'default';
      this.close();
    } else {
      this.input.removeAttribute('data-tdp-disabled');
      this.input.style.pointerEvents = '';
      this.input.style.backgroundColor = '';
      this.input.style.cursor = '';
    }
  };

  // ── auto-init ──────────────────────────────────────────────────────────────
  function _initEl(el) {
    if (el.getAttribute('data-thaidatepicker') === null) return;
    if (el.hasAttribute('data-tdp-ready')) return;
    el.setAttribute('data-tdp-ready', '1');
    var opts = {};
    if (el.dataset.format) opts.format = el.dataset.format;
    new ThaiDatePicker(el, opts);
  }

  function _initAll(root) {
    (root || document).querySelectorAll('[data-thaidatepicker]:not([data-tdp-ready])').forEach(_initEl);
  }

  // 1) init ตอน DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () { _initAll(); });

  // 2) MutationObserver — จับเฉพาะ node ที่ถูก add เข้า DOM ใหม่จริงๆ (ajax/dynamic)
  //    ไม่ใช้ attributes:true เพื่อไม่ให้ trigger ซ้ำตอน Bootstrap modal toggle class
  var _observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        _initEl(node);
        _initAll(node);
      });
    });
  });
  _observer.observe(document.body, { childList: true, subtree: true });

  // 3) Event delegation — จับ click บน document แทน
  //    แก้ปัญหา Bootstrap modal ที่ input อาจถูก re-render หรือ event หาย
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || el.getAttribute('data-thaidatepicker') === null) return;
    // ถ้ายังไม่ได้ init ให้ init ก่อน
    if (!el.hasAttribute('data-tdp-ready')) {
      _initEl(el);
    }
    // หา instance แล้ว toggle
    var idx = el.getAttribute('data-tdp-idx');
    var inst = idx !== null ? _instances[parseInt(idx)] : _instances.find(function(i){ return i.input === el; });
    if (inst) {
      e.stopPropagation();
      inst.toggle();
    }
  }, true); // useCapture: true เพื่อให้รับ event ก่อน Bootstrap

  // 3) setValueFromISO — helper สำหรับ YYYY-MM-DD (ค.ศ.) → setValue พ.ศ.
  //    ใช้งาน: ThaiDatePicker.setValueFromISO(inputEl, '2024-03-15')
  // ── helper: set ค่าให้ instance ──
  function _applyISO(inst, isoDate) {
    if (!isoDate || isoDate === '0000-00-00' || isoDate === '') {
      inst.clear();
    } else {
      var parts = isoDate.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && parts[0] >= 100) {
        inst.setValue(parts[2], parts[1], parts[0] + CE_OFFSET);
      }
    }
  }

  // ── helper: หา instance จาก element ──
  function _getInstance(el) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return null;
    var idx = el.getAttribute('data-tdp-idx');
    var inst = idx !== null ? _instances[parseInt(idx)] : null;
    if (!inst) inst = _instances.find(function(i) { return i.input === el; });
    if (!inst && el.hasAttribute('data-thaidatepicker')) inst = new ThaiDatePicker(el, {});
    return inst;
  }

  // ── helper: หา Bootstrap modal ที่ element อยู่ข้างใน ──
  function _getParentModal(el) {
    var node = el.parentElement;
    while (node) {
      if (node.classList && node.classList.contains('modal')) return node;
      node = node.parentElement;
    }
    return null;
  }

  ThaiDatePicker.setValueFromISO = function (el, isoDate) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return;

    var inst = _getInstance(el);
    if (!inst) return;

    // ตรวจว่า element อยู่ใน modal ที่ยังไม่ fully visible (กำลัง animate)
    var modal = _getParentModal(el);
    if (modal && !modal.classList.contains('show')) {
      // รอ shown.bs.modal แล้วค่อย set — ใช้ one-time listener
      var handler = function() {
        _applyISO(inst, isoDate);
        modal.removeEventListener('shown.bs.modal', handler);
      };
      modal.addEventListener('shown.bs.modal', handler);
    } else {
      // modal เปิดอยู่แล้ว หรือไม่ได้อยู่ใน modal → set ได้เลย
      _applyISO(inst, isoDate);
    }
  };

  // expose instances สำหรับ debug
  ThaiDatePicker.getInstances = function () { return _instances; };

  global.ThaiDatePicker = ThaiDatePicker;

})(window);