const SHEET_NAME = "Lesson Plan Submissions";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    const headers = [
      "Timestamp", "Teacher Name", "Email", "Grade", "Section", "Subject",
      "Quarter", "Week/Module", "Lesson Date", "Topic", "Competencies",
      "Objectives", "Content", "Resources", "Procedures", "Assessment",
      "Assignment/Remediation/Enrichment", "Remarks"
    ];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }

    const p = (e && e.parameter) ? e.parameter : {};
    sheet.appendRow([
      new Date(),
      p.teacher || "", p.email || "", p.grade || "", p.section || "",
      p.subject || "", p.quarter || "", p.week || "", p.lessonDate || "",
      p.topic || "", p.competencies || "", p.objectives || "", p.content || "",
      p.resources || "", p.procedure || "", p.assessment || "",
      p.assignment || "", p.remarks || ""
    ]);

    return ContentService.createTextOutput("OK");
  } finally {
    lock.releaseLock();
  }
}
