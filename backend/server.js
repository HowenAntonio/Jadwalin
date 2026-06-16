import express from "express";
import cors from "cors";
import crypto from "crypto";
import pool from "./db/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| CREATE EVENT
|--------------------------------------------------------------------------
*/
app.post("/api/events", async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;

    const eventId = crypto.randomUUID();

    await pool.query(
      `
      INSERT INTO events
      (id, title, start_date, end_date)
      VALUES (?, ?, ?, ?)
      `,
      [eventId, title, startDate, endDate],
    );

    res.json({
      eventId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal membuat event",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET ALL EVENTS
|--------------------------------------------------------------------------
*/
app.get("/api/events", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM events
      ORDER BY created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil event",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET EVENT BY ID
|--------------------------------------------------------------------------
*/
app.get("/api/events/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM events
      WHERE id = ?
      `,
      [req.params.id],
    );

    const event = rows[0];

    if (!event) {
      return res.status(404).json({
        message: "Event tidak ditemukan",
      });
    }

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil event",
    });
  }
});

/*
|--------------------------------------------------------------------------
| SUBMIT AVAILABILITY
|--------------------------------------------------------------------------
*/
app.post("/api/events/:id/availability", async (req, res) => {
  try {
    const { name, slots } = req.body;

    const [existingParticipants] = await pool.query(
      `
      SELECT name
      FROM participants
      WHERE event_id = ?
      `,
      [req.params.id]
    );

    let finalName = name;

    const sameNames = existingParticipants.filter(
      (p) =>
        p.name === name ||
        p.name.startsWith(`${name} `)
    );

    if (sameNames.length > 0) {
      finalName = `${name} ${sameNames.length + 1}`;
    }

    const participantId = crypto.randomUUID();

    await pool.query(
      `
      INSERT INTO participants
      (id, event_id, name)
      VALUES (?, ?, ?)
      `,
      [
        participantId,
        req.params.id,
        finalName,
      ]
    );

    for (const slot of slots) {
      await pool.query(
        `
        INSERT INTO availability
        (participant_id, slot)
        VALUES (?, ?)
        `,
        [
          participantId,
          slot,
        ]
      );
    }

    res.json({
      success: true,
      finalName,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Gagal menyimpan availability",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET PARTICIPANTS
|--------------------------------------------------------------------------
*/
app.get("/api/events/:id/participants", async (req, res) => {
  try {
    const [participants] = await pool.query(
      `
      SELECT *
      FROM participants
      WHERE event_id = ?
      `,
      [req.params.id],
    );

    for (const participant of participants) {
      const [slots] = await pool.query(
        `
        SELECT slot
        FROM availability
        WHERE participant_id = ?
        `,
        [participant.id],
      );

      participant.slots = slots.map((s) => s.slot);
    }

    res.json(participants);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil participants",
    });
  }
});

try {
  const connection = await pool.getConnection();

  console.log("Database connected!");

  connection.release();
} catch (err) {
  console.error("Database failed!");
  console.error(err);
}

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
