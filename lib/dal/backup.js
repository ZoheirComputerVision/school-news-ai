const fs = require('fs');
const path = require('path');
const config = require('../../config');

const BACKUP_DIR = path.join(config.DATA_DIR, 'backups');
const MAX_BACKUP_AGE_DAYS = 7;

function ensureBackupDir() {
  const date = new Date().toISOString().split('T')[0];
  const dir = path.join(BACKUP_DIR, date);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function backupTable(table) {
  const filePath = path.join(config.DATA_DIR, `${table}.json`);
  if (!fs.existsSync(filePath)) return null;
  const dir = ensureBackupDir();
  const timestamp = Date.now();
  const backupPath = path.join(dir, `${table}_${timestamp}.json`);
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function backupAll() {
  const tables = [
    'sources', 'raw_data', 'processed_content', 'media',
    'archive', 'ai_decision_log', 'admin_actions', 'settings', 'views'
  ];
  const results = {};
  for (const table of tables) {
    const p = backupTable(table);
    if (p) results[table] = p;
  }
  return results;
}

function restoreBackup(table, backupFilePath) {
  const targetPath = path.join(config.DATA_DIR, `${table}.json`);
  if (!fs.existsSync(backupFilePath)) throw new Error(`النسخة الاحتياطية غير موجودة: ${backupFilePath}`);
  fs.copyFileSync(backupFilePath, targetPath);
  return true;
}

function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return 0;
  const cutoff = Date.now() - MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const dateDir of fs.readdirSync(BACKUP_DIR)) {
    const dirPath = path.join(BACKUP_DIR, dateDir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    const dirTime = new Date(dateDir).getTime();
    if (isNaN(dirTime) || dirTime < cutoff) {
      for (const file of fs.readdirSync(dirPath)) {
        fs.unlinkSync(path.join(dirPath, file));
      }
      fs.rmdirSync(dirPath);
      removed++;
    }
  }
  return removed;
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return {};
  const backups = {};
  for (const dateDir of fs.readdirSync(BACKUP_DIR).sort()) {
    const dirPath = path.join(BACKUP_DIR, dateDir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    backups[dateDir] = fs.readdirSync(dirPath);
  }
  return backups;
}

module.exports = { backupTable, backupAll, restoreBackup, cleanOldBackups, listBackups };
