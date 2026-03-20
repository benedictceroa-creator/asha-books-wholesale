// Asha Books — Save Order to Google Sheets
// ──────────────────────────────────────────
// SETUP:
//   1. Create a new Google Sheet at sheets.google.com
//   2. Name the first sheet tab "Orders"
//   3. Copy the Sheet ID from the URL:
//      https://docs.google.com/spreadsheets/d/  ← THIS PART  /edit
//   4. Paste it below as SHEET_ID
//   5. Deploy → Manage Deployments → edit → New Version → Deploy

var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss     = SpreadsheetApp.openById(SHEET_ID);
    var sheet  = ss.getSheetByName('Orders') || ss.getSheets()[0];

    // Add header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Date', 'Customer Name', 'Phone', 'Email', 'Address', 'Items', 'Total']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }

    sheet.appendRow([
      data.order_date        || '',
      data.customer_name     || '',
      data.customer_phone    || '',
      data.customer_email    || '',
      data.customer_address  || '',
      data.order_items       || '',
      data.order_total       || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testSheet() {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('Orders') || ss.getSheets()[0];
    Logger.log('Sheet found: ' + sheet.getName());
    sheet.appendRow(['TEST', 'Test Customer', '1234567890', 'test@test.com', 'Test Address', 'Test Item x1', 'Rs. 999']);
    Logger.log('Test row added successfully');
  } catch(err) {
    Logger.log('ERROR: ' + err.message);
  }
}
