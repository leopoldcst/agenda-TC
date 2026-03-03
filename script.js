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
      const location = info.event.extendedProps.location;
      if (location) {
        info.el.setAttribute('title', `${info.event.title} · ${location}`);
      }
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
      return {
        title: vevent.summary || 'Cours',
        start: vevent.startDate.toJSDate(),
        end: vevent.endDate.toJSDate(),
        extendedProps: {
          location: vevent.location || ''
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
