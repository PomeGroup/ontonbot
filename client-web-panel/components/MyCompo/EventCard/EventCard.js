import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import Link from 'next/link';

const EventCard = ({ event }) => {
  return (
    <Link href={`/event-management/${event.event_uuid}`} passHref>
      <Card
        sx={{
          boxShadow: 'none',
          borderRadius: '10px',
          mb: '15px',
          backgroundColor: '#f5f5f5',
          color: 'black',

          cursor: 'pointer',
          width: '100%',
          height: '100%',
          textAlign: 'left', // Align text to the right
          padding: '0px',
          transition: 'transform 0.1s ease',
          '&:hover': {
            transform: 'scale(1.01)', // Scale the card on hover
          },
        }}
      >
        <CardContent sx={{padding:0}}>
          <Box >
            {/* Event Image */}
            <img
              src={event.image_url}
              alt={event.title}
              style={{
                width: '100%',
                borderRadius: '0px',
                marginBottom: '5px',
              }}
            />
            <Box sx={{padding:'10px'}}>
              {/* Event Title */}
              <Typography variant="h6" gutterBottom  sx={{textDecoration: 'none',}}>
                {event.title}
              </Typography>
              {/* Event Start Date */}
              <Typography variant="body2" color="textSecondary"  sx={{textDecoration: 'none',}}>
                {new Date(event.start_date * 1000).toLocaleString()} {/* Format UNIX timestamp */}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Link>
  );
};

export default EventCard;
