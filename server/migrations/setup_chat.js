// One-time (idempotent) migration: creates the internal chat schema
// (conversations, participants, messages, reactions, thread replies, saved messages).
// Run with: node server/migrations/setup_chat.js
const db = require('../db');

const TABLES = [
  {
    name: 'chat_conversations',
    sql: `CREATE TABLE IF NOT EXISTS chat_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      kind ENUM('dm','group') NOT NULL DEFAULT 'dm',
      name VARCHAR(150) NULL,
      created_by_role ENUM('admin','staff') NOT NULL,
      created_by_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  },
  {
    name: 'chat_participants',
    sql: `CREATE TABLE IF NOT EXISTS chat_participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      user_role ENUM('admin','staff') NOT NULL,
      user_id INT NOT NULL,
      pinned TINYINT(1) NOT NULL DEFAULT 0,
      last_read_message_id INT NOT NULL DEFAULT 0,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_conv_user (conversation_id, user_role, user_id),
      CONSTRAINT fk_chat_participants_conv FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'chat_messages',
    sql: `CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_role ENUM('admin','staff') NOT NULL,
      sender_id INT NOT NULL,
      text TEXT NULL,
      reply_to_id INT NULL,
      image_path VARCHAR(255) NULL,
      file_path VARCHAR(255) NULL,
      file_name VARCHAR(255) NULL,
      file_size INT NULL,
      voice_path VARCHAR(255) NULL,
      voice_duration INT NULL,
      edited TINYINT(1) NOT NULL DEFAULT 0,
      deleted TINYINT(1) NOT NULL DEFAULT 0,
      pinned TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_chat_messages_conv FOREIGN KEY (conversation_id)
        REFERENCES chat_conversations(id) ON DELETE CASCADE,
      INDEX idx_chat_messages_conv (conversation_id, id)
    )`
  },
  {
    name: 'chat_reactions',
    sql: `CREATE TABLE IF NOT EXISTS chat_reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id INT NOT NULL,
      user_role ENUM('admin','staff') NOT NULL,
      user_id INT NOT NULL,
      emoji VARCHAR(16) NOT NULL,
      UNIQUE KEY uniq_msg_user_emoji (message_id, user_role, user_id, emoji),
      CONSTRAINT fk_chat_reactions_msg FOREIGN KEY (message_id)
        REFERENCES chat_messages(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'chat_thread_replies',
    sql: `CREATE TABLE IF NOT EXISTS chat_thread_replies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      parent_message_id INT NOT NULL,
      sender_role ENUM('admin','staff') NOT NULL,
      sender_id INT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_chat_thread_replies_msg FOREIGN KEY (parent_message_id)
        REFERENCES chat_messages(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'chat_saved_messages',
    sql: `CREATE TABLE IF NOT EXISTS chat_saved_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_role ENUM('admin','staff') NOT NULL,
      user_id INT NOT NULL,
      message_id INT NOT NULL,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_msg (user_role, user_id, message_id),
      CONSTRAINT fk_chat_saved_msg FOREIGN KEY (message_id)
        REFERENCES chat_messages(id) ON DELETE CASCADE
    )`
  }
];

(async () => {
  for (const t of TABLES) {
    await db.query(t.sql);
    console.log(`Ensured table ${t.name}`);
  }
  console.log('Chat migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
