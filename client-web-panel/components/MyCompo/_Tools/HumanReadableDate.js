import React from 'react';

const toHumanReadableDate = (dateString) => {
    const dateObject = new Date(dateString);
    return dateObject.toLocaleString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });
};

const HumanReadableDate = ({ dateString }) => (
    <>
         {toHumanReadableDate(dateString)}
    </>
);

export default HumanReadableDate;

// Usage:
// <HumanReadableDateComponent dateString="2023-11-14T21:00:00.000Z" />
