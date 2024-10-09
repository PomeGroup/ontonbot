// PrintTicket.js
import React from 'react';

const PrintTicket = React.forwardRef(({ ticketData, userInfo }, ref) => {
  if (!ticketData || !userInfo) return null;

  return (
    <div ref={ref}>
      <h4>Event Ticket</h4>
      <p>Username: {userInfo.username}</p>
      <p>First Name: {userInfo.first_name}</p>
      <p>Wallet Address: {userInfo.wallet_address}</p>
      <p>Ticket Status: {ticketData.ticket_status}</p>
      <p>Order UUID: {ticketData.order_uuid}</p>
      <p>Thank you for attending!</p>
    </div>
  );
});

export default PrintTicket;
