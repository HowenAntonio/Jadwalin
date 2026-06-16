export default function generateSlots(startDate, endDate) {
  const result = [];

  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const date = current.toISOString().split("T")[0];

    const hours = [];

    for (let h = 0; h <= 23; h++) {
      hours.push({
        id: `${date}-${h}`,
        hour: `${String(h).padStart(2, "0")}:00`,
      });
    }

    result.push({
      date,
      hours,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}
