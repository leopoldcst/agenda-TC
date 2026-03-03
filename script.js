document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');

  const isNarrowScreen = () => window.matchMedia('(max-width: 720px)').matches;

  const buildHeaderToolbar = (isNarrow) => ({
    left: 'prev,next today',
    center: 'title',
    right: isNarrow ? 'timeGridDay,listWeek' : 'timeGridWeek,timeGridDay,listWeek'
  });

  const getInitialView = (isNarrow) => (isNarrow ? 'timeGridDay' : 'timeGridWeek');

  let lastIsNarrow = isNarrowScreen();

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: getInitialView(lastIsNarrow),
    locale: 'fr',
    firstDay: 1,
    nowIndicator: true,
    height: 'auto',
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    hiddenDays: [0, 6],
    headerToolbar: buildHeaderToolbar(lastIsNarrow),
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventDidMount: (info) => {
      const { course, intitule, professor, location } = info.event.extendedProps;
      const titleParts = [course, intitule, professor, location].filter(Boolean);
      if (titleParts.length > 0) {
        info.el.setAttribute('title', titleParts.join(' - '));
      }
    },
    eventContent: (arg) => {
      const { course, intitule, professor, location } = arg.event.extendedProps;
      const container = document.createElement('div');
      container.className = 'event-content';

      const courseEl = document.createElement('div');
      courseEl.className = 'event-course';
      courseEl.textContent = course || arg.event.title;
      container.appendChild(courseEl);

      if (intitule) {
        const intituleEl = document.createElement('div');
        intituleEl.className = 'event-intitule';
        intituleEl.textContent = intitule;
        container.appendChild(intituleEl);
      }

      if (professor) {
        const profEl = document.createElement('div');
        profEl.className = 'event-prof';
        profEl.textContent = professor;
        container.appendChild(profEl);
      }

      if (location) {
        const roomEl = document.createElement('div');
        roomEl.className = 'event-room';
        roomEl.textContent = location;
        container.appendChild(roomEl);
      }

      return { domNodes: [container] };
    }
  });

  const syncResponsiveLayout = () => {
    const isNarrow = isNarrowScreen();
    if (isNarrow === lastIsNarrow) {
      return;
    }

    lastIsNarrow = isNarrow;
    calendar.setOption('headerToolbar', buildHeaderToolbar(isNarrow));
    calendar.changeView(getInitialView(isNarrow));
  };

  const parseIcal = (data) => {
    const jcalData = ICAL.parse(data);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents('vevent');

    return events.map((event) => {
      const vevent = new ICAL.Event(event);
      const summary = vevent.summary || 'Cours';
      const parts = summary.split('/');
      const course = (parts[0] || summary).trim();
      const rawIntitule = (parts[3] || '').trim();
      const fallbackIntitule = (parts[1] || '').replace(/_/g, ' ').trim();
      const intitule = rawIntitule || fallbackIntitule;

      const professor = (vevent.description || '').trim();
      const rawLocation = (vevent.location || '').trim();
      const location = rawLocation === '000000000' ? '' : rawLocation;

      const displayTitle = intitule ? `${course} - ${intitule}` : course;

      return {
        title: displayTitle,
        start: vevent.startDate.toJSDate(),
        end: vevent.endDate.toJSDate(),
        extendedProps: {
          course,
          intitule,
          professor,
          location
        }
      };
    });
  };

  const loadCalendar = async () => {
    try {
      const response = await fetch('Calendar-TC-Groupe.ical', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Calendrier introuvable');
      }

      const data = await response.text();
      const parsedEvents = parseIcal(data);

      calendar.addEventSource(parsedEvents);
      calendar.render();
      syncResponsiveLayout();
    } catch (error) {
      console.error(error);
      calendar.render();
    }
  };

  loadCalendar();

  window.addEventListener('resize', syncResponsiveLayout);
});
