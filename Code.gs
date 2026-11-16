/**
 * Calinan National High School - Teacher Substitution Plan backend
 * 1. Create a Google Sheet.
 * 2. Extensions > Apps Script; paste this entire file.
 * 3. Run setupSheet() once and authorize.
 * 4. Deploy > New deployment > Web app; Execute as: Me.
 *    Access: Anyone with the link (or your school's approved setting).
 * 5. Copy the Web App URL into config.js in the GitHub repository.
 *
 * Keep the Sheet private. The Web App deployment URL grants access to this
 * app's operations; share it only with authorized personnel.
 */
const SHEET_ID = ""; // Optional: paste spreadsheet ID. Blank uses the bound spreadsheet.
const TAB_TEACHERS = "Teachers";
const TAB_ASSIGNMENTS = "Substitutions";

function spreadsheet_() {
  if (SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("No active spreadsheet. Bind this script to a Google Sheet or set SHEET_ID.");
  return ss;
}
function setupSheet() {
  const ss = spreadsheet_();
  let t = ss.getSheetByName(TAB_TEACHERS) || ss.insertSheet(TAB_TEACHERS);
  let a = ss.getSheetByName(TAB_ASSIGNMENTS) || ss.insertSheet(TAB_ASSIGNMENTS);
  if (t.getLastRow() === 0) t.appendRow(["id","name","department","createdAt"]);
  if (a.getLastRow() === 0) a.appendRow(["id","date","absentTeacher","substituteTeacher","section","subject","period","room","status","notes","createdAt"]);
  [t,a].forEach(s=>{s.setFrozenRows(1);s.getRange(1,1,1,s.getLastColumn()).setFontWeight("bold").setBackground("#dcebdc");s.autoResizeColumns(1,s.getLastColumn());});
  return "CNHS substitution sheets are ready.";
}
function doGet(e) {
  const action = (e.parameter.action || "bootstrap").toLowerCase();
  let result;
  if (action === "bootstrap") result = bootstrap_();
  else result = {ok:false,error:"Unknown action"};
  const callback = e.parameter.callback;
  const body = JSON.stringify(result);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback))
    return ContentService.createTextOutput(callback+"("+body+");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    const action = data.action;
    let result;
    if (action === "addTeacher") result = addTeacher_(data);
    else if (action === "deleteTeacher") result = deleteTeacher_(data);
    else if (action === "addAssignment") result = addAssignment_(data);
    else if (action === "deleteAssignment") result = deleteAssignment_(data);
    else throw new Error("Unknown action");
    return ContentService.createTextOutput(JSON.stringify({ok:true,result:result})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message||err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
function bootstrap_() {
  const ss = spreadsheet_();
  const teacherRows = rows_(ss.getSheetByName(TAB_TEACHERS));
  const assignmentRows = rows_(ss.getSheetByName(TAB_ASSIGNMENTS));
  return {
    teachers: teacherRows.map(r=>({id:String(r[0]),name:String(r[1]),department:String(r[2]||"")})),
    assignments: assignmentRows.map(r=>({id:String(r[0]),date:dateString_(r[1]),absentTeacher:String(r[2]),substituteTeacher:String(r[3]),section:String(r[4]),subject:String(r[5]),period:String(r[6]),room:String(r[7]),status:String(r[8]),notes:String(r[9]||""),createdAt:String(r[10]||"")})).reverse()
  };
}
function rows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();
}
function dateString_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(v||"").slice(0,10);
}
function addTeacher_(d) {
  if (!d.name || !String(d.name).trim()) throw new Error("Teacher name is required.");
  const s=spreadsheet_().getSheetByName(TAB_TEACHERS);
  const id=Utilities.getUuid();
  s.appendRow([id,String(d.name).trim(),String(d.department||"").trim(),new Date()]);
  return id;
}
function deleteTeacher_(d) { return deleteById_(TAB_TEACHERS,d.id); }
function addAssignment_(d) {
  ["date","absentTeacher","substituteTeacher","section","subject","period"].forEach(k=>{if(!d[k])throw new Error(k+" is required.");});
  if(d.absentTeacher===d.substituteTeacher) throw new Error("Substitute must differ from absent teacher.");
  const s=spreadsheet_().getSheetByName(TAB_ASSIGNMENTS), id=Utilities.getUuid();
  s.appendRow([id,d.date,d.absentTeacher,d.substituteTeacher,d.section,d.subject,d.period,d.room||"",d.status||"Assigned",d.notes||"",new Date()]);
  return id;
}
function deleteAssignment_(d) { return deleteById_(TAB_ASSIGNMENTS,d.id); }
function deleteById_(tab,id) {
  if(!id) throw new Error("Record ID is required.");
  const s=spreadsheet_().getSheetByName(tab), values=rows_(s);
  const index=values.findIndex(r=>String(r[0])===String(id));
  if(index<0) throw new Error("Record not found.");
  s.deleteRow(index+2);return true;
}
