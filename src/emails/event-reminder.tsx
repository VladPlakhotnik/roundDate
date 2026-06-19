type EventReminderEmailProps = {
  eventDate: string;
  eventTitle: string;
  venueName: string;
};

export default function EventReminderEmail({
  eventDate,
  eventTitle,
  venueName,
}: EventReminderEmailProps) {
  return (
    <html lang="pl">
      <body>
        <h1>Przypomnienie o wydarzeniu</h1>
        <p>{eventTitle}</p>
        <p>
          {eventDate} · {venueName}
        </p>
        <p>Daj nam znac, jezeli Twoje plany sie zmienily.</p>
      </body>
    </html>
  );
}
