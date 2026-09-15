import { sqlite } from "@flue/runtime/node";

// 单机 SQLite 不够用时，换其他适配器（Postgres、libSQL 等）：
// https://flueframework.com/docs/guide/database/
export default sqlite("./data/flue.db");
