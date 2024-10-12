import React from 'react';

const FormatPhoneNumber = ({ phoneNumber }) => {
    if (!phoneNumber) return 'N/A';
    return phoneNumber.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
};

export default FormatPhoneNumber;
