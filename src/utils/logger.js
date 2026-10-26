/**
 * Structured Console Logger
 */
const logger = {
  info: (msg, meta) => console.log(`[INFO]  [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : ''),
  warn: (msg, meta) => console.warn(`[WARN]  [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : ''),
  error: (msg, error) => console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, error || ''),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${msg}`, meta || '');
    }
  }
};

module.exports = logger;
