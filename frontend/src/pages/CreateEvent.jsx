import { useState } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaCopy,
  FaCheck,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";

export default function CreateEvent() {
  const API_BASE = import.meta.env.VITE_API_URL;

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const isValid =
    title.trim().length > 0 &&
    startDate !== "" &&
    endDate !== "" &&
    startDate <= endDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isValid) return;

    try {
      setSubmitting(true);

      const response = await axios.post(`${API_BASE}/api/events`, {
        title,
        startDate,
        endDate,
      });

      const id = response.data.eventId;
      setGeneratedLink(`${API_BASE}/event/${id}`);
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal membuat event. Coba lagi ya.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">🗓️ Jadwalin</h1>
        <p className="page-subtitle">Cari waktu yang pas buat semua orang</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Judul Event
            </label>
            <input
              id="title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Tim Marketing"
              maxLength={100}
              autoComplete="off"
            />
            <span className="form-hint">
              Beri nama yang jelas biar teman-temanmu tahu acaranya apa.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="start-date">
              Tanggal Awal
            </label>
            <input
              id="start-date"
              type="date"
              className="input"
              value={startDate}
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="end-date">
              Tanggal Akhir
            </label>
            <input
              id="end-date"
              type="date"
              className="input"
              value={endDate}
              min={startDate || today}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {startDate && endDate && startDate > endDate && (
              <span className="form-error">
                <FaInfoCircle /> Tanggal akhir tidak boleh sebelum tanggal awal.
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              <FaInfoCircle className="alert-icon" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={!isValid || submitting}
          >
            {submitting ? "Membuat event..." : "Buat Event"}
          </button>
        </form>

        {generatedLink && (
          <>
            <hr className="divider" />
            <div className="alert alert-success" style={{ marginBottom: 14 }}>
              <FaCheckCircle className="alert-icon" />
              <div>
                <strong>Event berhasil dibuat!</strong>
                <div style={{ marginTop: 4 }}>
                  Bagikan link di bawah ini ke teman-temanmu. Mereka tinggal
                  klik dan pilih jam yang pas — tidak perlu daftar atau login.
                </div>
              </div>
            </div>
            <label className="form-label">Link Event</label>
            <div className="share-box">
              <a
                href={generatedLink}
                className="share-link"
                title={generatedLink}
              >
                {generatedLink}
              </a>
              <button
                type="button"
                className={copied ? "btn btn-success" : "btn btn-primary"}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <FaCheck /> Tersalin
                  </>
                ) : (
                  <>
                    <FaCopy /> Salin
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
