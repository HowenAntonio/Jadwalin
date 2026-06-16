import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaChartBar,
  FaCheckCircle,
  FaInfoCircle,
  FaPaperPlane,
} from "react-icons/fa";
import generateSlots from "../utils/generateSlots";

export default function EventPage() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [name, setName] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'success', message }

  const navigate = useNavigate();

  const toggleSlot = (slotId) => {
    setFeedback(null);
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  useEffect(() => {
    axios.get(`http://localhost:3000/api/events/${id}`).then((response) => {
      setEvent(response.data);
    });
  }, [id]);

  if (!event) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Memuat event...</p>
        </div>
      </div>
    );
  }

  const slots = generateSlots(event.start_date, event.end_date);

  const submitData = async () => {
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Nama wajib diisi dulu ya." });
      return;
    }

    if (selectedSlots.length === 0) {
      setFeedback({
        type: "error",
        message: "Pilih dulu minimal 1 jam yang kamu bisa.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        `http://localhost:3000/api/events/${id}/availability`,
        { name, slots: selectedSlots },
      );

      setFeedback({
        type: "success",
        message: `Tersimpan sebagai "${response.data.finalName}". Mengarahkan ke summary...`,
      });

      setTimeout(() => navigate(`/event/${id}/summary`), 900);
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: "Gagal menyimpan. Coba lagi ya.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFullDay = (day) => {
    const daySlots = day.hours.map((hour) => hour.id);
    const allSelected = daySlots.every((slot) => selectedSlots.includes(slot));

    if (allSelected) {
      setSelectedSlots(
        selectedSlots.filter((slot) => !daySlots.includes(slot)),
      );
    } else {
      setSelectedSlots([...new Set([...selectedSlots, ...daySlots])]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">🗓️ Jadwalin</h1>
        <p className="page-subtitle">Pilih jam yang kamu bisa</p>
      </div>

      <div className="card">
        <div className="event-toolbar">
          <div>
            <div className="event-title">{event.title}</div>
            <div className="event-meta">
              {formatDate(event.start_date)} – {formatDate(event.end_date)}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/event/${id}/summary`)}
          >
            <FaChartBar /> Lihat Summary
          </button>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Nama Kamu
          </label>
          <input
            id="name"
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Budi"
            maxLength={50}
            autoComplete="off"
          />
          <span className="form-hint">
            Pakai nama panggilan biar gampang dikenali teman-temanmu.
          </span>
        </div>

        <div
          className="alert alert-info"
          style={{ marginBottom: 18 }}
        >
          <FaInfoCircle className="alert-icon" />
          <span>
            Klik jam-jam yang kamu <strong>bisa</strong> hadir. Klik lagi untuk
            membatalkan. Tekan tombol <em>Seharian</em> kalau kamu free
            seharian penuh.
          </span>
        </div>

        <hr className="divider" />

        {slots.map((day) => {
          const allSelected = day.hours.every((hour) =>
            selectedSlots.includes(hour.id),
          );

          return (
            <div key={day.date} className="day-section">
              <div className="day-header">
                <span className="day-title">{formatDate(day.date)}</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => toggleFullDay(day)}
                >
                  {allSelected ? "✕ Batalkan Seharian" : "✓ Pilih Seharian"}
                </button>
              </div>

              <div className="slot-grid">
                {day.hours.map((hour) => (
                  <button
                    key={hour.id}
                    type="button"
                    className={
                      selectedSlots.includes(hour.id)
                        ? "slot-button selected"
                        : "slot-button"
                    }
                    onClick={() => toggleSlot(hour.id)}
                    aria-pressed={selectedSlots.includes(hour.id)}
                  >
                    {hour.hour}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {feedback && (
          <div
            className={
              feedback.type === "error"
                ? "alert alert-error"
                : "alert alert-success"
            }
            style={{ marginTop: 20 }}
          >
            {feedback.type === "error" ? (
              <FaInfoCircle className="alert-icon" />
            ) : (
              <FaCheckCircle className="alert-icon" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="submit-bar">
          <span className="submit-bar-info">
            <span className="selected-count">
              {selectedSlots.length} jam dipilih
            </span>
          </span>
          <button
            type="button"
            className="btn btn-success btn-lg"
            onClick={submitData}
            disabled={submitting}
          >
            <FaPaperPlane />
            {submitting ? "Menyimpan..." : "Kirim Jadwalku"}
          </button>
        </div>
      </div>
    </div>
  );
}
