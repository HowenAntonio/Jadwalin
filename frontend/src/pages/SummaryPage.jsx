import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaUserFriends } from "react-icons/fa";

export default function SummaryPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/events/${id}/participants`,
        );

        setParticipants(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, [id]);

  const formatDate = (dateKey) => {
    const [year, month, day] = dateKey.split("-");

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    ).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const buildTableData = () => {
    const grouped = {};

    participants.forEach((participant) => {
      participant.slots.forEach((slot) => {
        const [year, month, day, hour] = slot.split("-");

        const dateKey = `${year}-${month}-${day}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            hours: new Set(),
          };
        }

        grouped[dateKey].hours.add(hour);
      });
    });

    return grouped;
  };

  const getSlotCount = (slot) => {
    return participants.filter((participant) =>
      participant.slots.includes(slot),
    ).length;
  };

  const getMaxCount = () => {
    let max = 0;

    participants.forEach((participant) => {
      participant.slots.forEach((slot) => {
        const count = getSlotCount(slot);

        max = Math.max(max, count);
      });
    });

    return max;
  };

  const maxCount = getMaxCount();

  const getColor = (count) => {
    if (count === 0) return "#ffffff";

    if (count === maxCount) return "#22c55e";

    const ratio = count / maxCount;

    if (ratio >= 0.75) return "#4ade80";

    if (ratio >= 0.5) return "#86efac";

    return "#dcfce7";
  };

  const tableData = buildTableData();

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">📊 Summary Event</h1>
        <p className="page-subtitle">
          Kotak hijau makin tua = makin banyak yang bisa di jam itu
        </p>
      </div>

      <div className="card summary-header">
        <div className="event-toolbar">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/event/${id}`)}
          >
            <FaArrowLeft /> Kembali ke Event
          </button>

          <span className="stat-pill">
            <FaUserFriends />
            {participants.length} orang sudah mengisi
          </span>
        </div>

        <div className="legend">
          <span>Legenda:</span>
          <span className="legend-item">
            <span
              className="legend-swatch"
              style={{ background: "#dcfce7" }}
            />
            Sedikit
          </span>
          <span className="legend-item">
            <span
              className="legend-swatch"
              style={{ background: "#4ade80" }}
            />
            Banyak
          </span>
          <span className="legend-item">
            <span
              className="legend-swatch"
              style={{ background: "#22c55e" }}
            />
            Terbaik
          </span>
        </div>
      </div>

      {participants.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <span className="emoji">🙌</span>
            <div className="empty-title">Belum ada yang mengisi</div>
            <div>
              Bagikan link event ke teman-temanmu supaya mereka bisa ikut
              mengisi jam yang mereka bisa.
            </div>
          </div>
        </div>
      )}

      {Object.entries(tableData).map(([dateKey, data]) => {
        const hours = [...data.hours].sort((a, b) => Number(a) - Number(b));

        return (
          <div key={dateKey} className="card" style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 14, fontSize: 18, fontWeight: 700 }}>
              {formatDate(dateKey)}
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Nama</th>

                    {hours.map((hour) => (
                      <th key={hour}>
                        {hour.padStart(2, "0")}
                        :00
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className="participant-name">{participant.name}</td>

                      {hours.map((hour) => {
                        const slot = `${dateKey}-${hour}`;

                        const available = participant.slots.includes(slot);

                        const count = getSlotCount(slot);

                        return (
                          <td
                            key={`${participant.id}-${slot}`}
                            style={{
                              backgroundColor: getColor(count),
                              fontWeight:
                                count === maxCount ? "bold" : "normal",
                            }}
                          >
                            {available ? "✓" : "✗"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
