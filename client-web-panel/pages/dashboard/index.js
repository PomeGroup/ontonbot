import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useGetEventsQuery } from "/redux/slices/eventsApiSlice";
import EventCard from  "/components/MyCompo/EventCard/EventCard";

const EventDashboard = () => {
  // Use the getEvents query hook to fetch events
  const { data: events, error, isLoading } = useGetEventsQuery({ limit: 10, offset: 0 });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading events</p>;

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          {/* Map through the events array and display each event */}
          {events?.map((event) => (
            <Grid item xs={12} sm={3} md={2} key={event.event_uuid}>
              <EventCard event={event} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EventDashboard;
