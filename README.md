# Thai Date Picker v1.0

ปลั๊กอินเลือกวันที่ (Date Picker) รูปแบบปีพุทธศักราช (พ.ศ.) พัฒนาด้วย Vanilla JavaScript และ CSS ไม่ต้องพึ่งพาไลบรารีอย่าง jQuery และออกแบบมาให้รองรับการทำงานร่วมกับ Bootstrap Modal ได้อย่างสมบูรณ์

## ✨ คุณสมบัติเด่น

* **ปีพุทธศักราช (พ.ศ.):** แสดงผลและคำนวณปีเป็น พ.ศ. โดยอัตโนมัติ (+543 จาก ค.ศ.)
* **Vanilla JS:** น้ำหนักเบา ไม่ต้องใช้ Dependencies เพิ่มเติม
* **Auto-Initialization:** เริ่มต้นใช้งานง่ายๆ เพียงเพิ่ม Attribute `data-thaidatepicker`
* **Bootstrap Compatible:** แก้ปัญหา Z-index และ Event หายเมื่อใช้งานซ้อนใน Bootstrap Modal
* **ISO Date Helper:** มีฟังก์ชันช่วยแปลงวันที่จากฐานข้อมูล (YYYY-MM-DD) มาแสดงเป็น พ.ศ. ใน Input ได้ทันที

## 📦 การติดตั้ง

นำไฟล์ CSS และ JavaScript ไปวางไว้ในโปรเจกต์ของคุณ:

```html
<link href="[https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap](https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap)" rel="stylesheet">

<link rel="stylesheet" href="path/to/thaidatepicker.css">

<script src="path/to/thaidatepicker.js"></script>
```

## 🚀 วิธีใช้งาน

### 1. ใช้งานผ่าน HTML Data Attribute (แนะนำ)
เพียงแค่เพิ่ม `data-thaidatepicker` ลงใน tag `<input>` สคริปต์จะทำการสร้าง Date Picker ให้โดยอัตโนมัติ

```html
<input type="text" id="myDate" data-thaidatepicker data-format="DD/MM/YYYY">
```
*หมายเหตุ: ค่าเริ่มต้นของรูปแบบวันที่คือ `DD/MM/YYYY`*

### 2. ใช้งานผ่าน JavaScript
หากต้องการตั้งค่าผ่าน JavaScript โดยตรง:

```javascript
const inputEl = document.getElementById('myDate');
const picker = new ThaiDatePicker(inputEl, {
    format: 'DD/MM/YYYY',
    onChange: function(data) {
        console.log("เลือกวันที่:", data.formatted);
        console.log("วันที่แบบเต็ม:", data.longFormat); // เช่น 15 มีนาคม พ.ศ. 2567
    }
});
```

## 🛠 API & Methods

### Methods สำหรับ Instance
คุณสามารถดึง Instance ของปฏิทินและเรียกใช้คำสั่งเหล่านี้ได้:

| Method | รูปแบบการใช้งาน | คำอธิบาย |
| :--- | :--- | :--- |
| `getValue()` | `picker.getValue()` | คืนค่า Object คืนค่า Object ของวันที่ที่เลือก (day, month, yearBE, yearCE, formatted) หรือ `null` หากยังไม่ได้เลือก |
| `setValue(d, m, y)` | `picker.setValue(15, 3, 2567)` | กำหนดวันที่ให้กับ Input (m = เดือน 1-12, y = ปี พ.ศ.) |
| `clear()` | `picker.clear()` | ล้างค่าใน Input |
| `open()` | `picker.open()` | เปิดหน้าต่างปฏิทิน |
| `close()` | `picker.close()` | ปิดหน้าต่างปฏิทิน |
| `toggle()` | `picker.toggle()` | สลับสถานะเปิด/ปิดหน้าต่างปฏิทิน |
| `setReadonly(bool)` | `picker.setReadonly(true)` | ล็อค/ปลดล็อค การแก้ไขและการคลิกเปิดปฏิทิน |

### Global Helper Functions
ฟังก์ชันระดับ Global ที่สามารถเรียกใช้งานได้ทันทีโดยไม่ต้องอ้างอิง Instance:

**`ThaiDatePicker.setValueFromISO(element, isoString)`**
ใช้สำหรับนำค่า ค.ศ. (เช่น จาก Database) มาตั้งค่าให้แสดงใน Input เป็น พ.ศ. ทันที (รองรับการทำงานตอนโหลด Bootstrap Modal)

```javascript
// ตัวอย่างการตั้งค่าวันที่จาก ISO 8601
ThaiDatePicker.setValueFromISO('#myDate', '2024-03-15');
```
