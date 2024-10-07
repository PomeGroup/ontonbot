import React from 'react';
import {Box, Typography} from '@mui/material';

const PrintTicket = React.forwardRef(({ticketData}, ref) => {
  if (!ticketData) return null;

  return (
    <Box ref={ref} sx={{display: 'none', padding: '20px', fontSize: '18px', textAlign: 'center'}} id="print-ticket">
      <Typography variant="h4" sx={{marginBottom: '20px'}}>Event Ticket</Typography>
      <Typography variant="body1">Username: {ticketData.username || 'N/A'}</Typography>
      <Typography variant="body1">First Name: {ticketData.first_name || 'N/A'}</Typography>
      <Typography variant="body1">Wallet Address: {ticketData.wallet_address || 'N/A'}</Typography>
      <Typography variant="body1">Ticket Status: {ticketData.ticket_status || 'N/A'}</Typography>
      <Typography variant="body1">Order UUID: {ticketData.order_uuid || 'N/A'}</Typography>
      <Typography variant="body1" sx={{marginTop: '20px'}}>Thank you for attending!</Typography>
    </Box>
  );
});

export default PrintTicket;
