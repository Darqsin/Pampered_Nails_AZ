document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const siteNav = document.getElementById("siteNav");

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      siteNav.classList.toggle("open");
    });
  }

  const calendarEl = document.getElementById("calendar");
  const calendarTitle = document.getElementById("calendarTitle");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const bookingForm = document.getElementById("bookingForm");
  const selectedDateText = document.getElementById("selectedDateText");
  const formMessage = document.getElementById("formMessage");
  const appointmentsList = document.getElementById("appointmentsList");

  if (!calendarEl || !calendarTitle || !prevMonthBtn || !nextMonthBtn || !bookingForm || !selectedDateText || !formMessage || !appointmentsList) {
    return;
  }

  const STORAGE_KEY = "pampered_nails_elena_bookings";
  const today = new Date();
  let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function prettyDate(dateKey) {
    const date = new Date(dateKey + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function getBookings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }

  function isBooked(dateKey) {
    return getBookings().some(item => item.date === dateKey);
  }

  function within60Days(date) {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 59);
    const test = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return test >= start && test <= end;
  }

  function renderCalendar() {
    calendarEl.innerHTML = "";
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    calendarTitle.textContent = currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });

    const firstDay = new Date(year, month, 1);
    const firstWeekDay = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstWeekDay; i++) {
      const empty = document.createElement("div");
      empty.className = "calendar-empty";
      calendarEl.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const booked = isBooked(dateKey);
      const valid = within60Days(date);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calendar-day";

      if (!valid) {
        btn.classList.add("disabled");
        btn.disabled = true;
      } else if (booked) {
        btn.classList.add("booked");
      }

      if (selectedDate === dateKey) {
        btn.classList.add("selected");
      }

      btn.innerHTML = `
        <span class="day-number">${day}</span>
        <span class="day-status">${!valid ? "Unavailable" : booked ? "Booked" : "Open"}</span>
      `;

      btn.addEventListener("click", () => {
        if (!valid || booked) return;
        selectedDate = dateKey;
        selectedDateText.textContent = prettyDate(dateKey);
        renderCalendar();
      });

      calendarEl.appendChild(btn);
    }
  }

  function renderBookings() {
    const bookings = getBookings().sort((a, b) => new Date(a.date) - new Date(b.date));
    appointmentsList.innerHTML = "";

    if (!bookings.length) {
      appointmentsList.innerHTML = "<p>No appointments saved yet.</p>";
      return;
    }

    bookings.forEach((booking, index) => {
      const item = document.createElement("div");
      item.className = "appointment-item";

      item.innerHTML = `
        <div>
          <h4>${booking.name} — ${booking.service}</h4>
          <p><strong>Date:</strong> ${prettyDate(booking.date)}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ""}
        </div>
        <div>
          <button class="delete-btn" data-index="${index}">Delete</button>
        </div>
      `;

      appointmentsList.appendChild(item);
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", (e) => {
        const idx = Number(e.target.dataset.index);
        const bookings = getBookings().sort((a, b) => new Date(a.date) - new Date(b.date));
        bookings.splice(idx, 1);
        saveBookings(bookings);
        renderBookings();
        renderCalendar();
      });
    });
  }

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    formMessage.textContent = "";
    formMessage.className = "form-message";

    if (!selectedDate) {
      formMessage.textContent = "Please select an available date first.";
      formMessage.classList.add("error");
      return;
    }

    if (isBooked(selectedDate)) {
      formMessage.textContent = "That date is already booked.";
      formMessage.classList.add("error");
      renderCalendar();
      return;
    }

    const data = new FormData(bookingForm);
    const booking = {
      name: data.get("name").trim(),
      email: data.get("email").trim(),
      phone: data.get("phone").trim(),
      service: data.get("service").trim(),
      notes: data.get("notes").trim(),
      date: selectedDate
    };

    const bookings = getBookings();
    bookings.push(booking);
    saveBookings(bookings);

    formMessage.textContent = `Appointment saved for ${prettyDate(selectedDate)}.`;
    formMessage.classList.add("success");

    bookingForm.reset();
    selectedDate = null;
    selectedDateText.textContent = "None selected";
    renderBookings();
    renderCalendar();
  });

  prevMonthBtn.addEventListener("click", () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  renderCalendar();
  renderBookings();
});
