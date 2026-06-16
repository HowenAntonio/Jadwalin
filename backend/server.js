import express from "express";
import cors from "cors";
import crypto from "crypto";
import pool from "./db/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const API_URL = "/api/events";
const PORT = process.env.PORT || 8080;

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/
app.use(cors({
  origin: "*",
}));

app.use(express.json());

/*
|--------------------------------------------------------------------------
| ROOT (FIX "Cannot GET /")
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Jadwalin API running 🚀"
  });
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "server running" });
});

/*
|--------------------------------------------------------------------------
| DB TEST
|--------------------------------------------------------------------------
*/
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");
    res.json({ db: "connected", result: rows[0].result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ db: "failed", error: err.message });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE EVENT
|--------------------------------------------------------------------------
*/
app.post(API_URL, async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const eventId = crypto.randomUUID();

    await pool.query(
      `
      INSERT INTO events (id, title, start_date, end_date)
      VALUES (?, ?, ?, ?)
      `,
      [eventId, title, startDate, endDate]
    );

    res.json({ eventId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuat event" });
  }
});

/*
|--------------------------------------------------------------------------
| GET ALL EVENTS
|--------------------------------------------------------------------------
*/
app.get(API_URL, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM events
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil event" });
  }
});

/*
|--------------------------------------------------------------------------
| GET EVENT BY ID
|--------------------------------------------------------------------------
*/
app.get(`${API_URL}/:id`, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM events WHERE id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Event tidak ditemukan" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil event" });
  }
});

/*
|--------------------------------------------------------------------------
| SUBMIT AVAILABILITY
|--------------------------------------------------------------------------
*/
app.post(`${API_URL}/:id/availability`, async (req, res) => {
  try {
    const { name, slots } = req.body;

    if (!name || !Array.isArray(slots)) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const [existingParticipants] = await pool.query(
      `SELECT name FROM participants WHERE event_id = ?`,
      [req.params.id]
    );

    let finalName = name;

    const sameNames = existingParticipants.filter(
      (p) => p.name === name || p.name.startsWith(`${name} `)
    );

    if (sameNames.length > 0) {
      finalName = `${name} ${sameNames.length + 1}`;
    }

    const participantId = crypto.randomUUID();

    await pool.query(
      `
      INSERT INTO participants (id, event_id, name)
      VALUES (?, ?, ?)
      `,
      [participantId, req.params.id, finalName]
    );

    for (const slot of slots) {
      await pool.query(
        `
        INSERT INTO availability (participant_id, slot)
        VALUES (?, ?)
        `,
        [participantId, slot]
      );
    }

    res.json({ success: true, finalName });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menyimpan availability" });
  }
});

/*
|--------------------------------------------------------------------------
| GET PARTICIPANTS
|--------------------------------------------------------------------------
*/
app.get(`${API_URL}/:id/participants`, async (req, res) => {
  try {
    const [participants] = await pool.query(
      `SELECT * FROM participants WHERE event_id = ?`,
      [req.params.id]
    );

    for (const p of participants) {
      const [slots] = await pool.query(
        `SELECT slot FROM availability WHERE participant_id = ?`,
        [p.id]
      );

      p.slots = slots.map(s => s.slot);
    }

    res.json(participants);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil participants" });
  }
});

/*
|--------------------------------------------------------------------------
| START DB CHECK (ON BOOT)
|--------------------------------------------------------------------------
*/
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Database connected!");
    conn.release();
  } catch (err) {
    console.error("Database failed!");
    console.error(err.message);
  }
})();

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});