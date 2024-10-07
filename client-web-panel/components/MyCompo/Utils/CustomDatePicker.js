import React, { useEffect, useState, useCallback, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import DatePicker from 'react-multi-date-picker';
import TimePicker from 'react-multi-date-picker/plugins/time_picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import { DateObject } from 'react-multi-date-picker';

const CustomDatePicker = ({ value, onChange, name, hasTimePicker = true }) => {
    const [gregorianDate, setGregorianDate] = useState("");

    const stableValue = useMemo(() => value, [value]);
    const stableOnChange = useCallback(onChange, []);

    useEffect(() => {
        if (stableValue) {
            const date = new DateObject({ date: stableValue, calendar: gregorian });
            setGregorianDate(date.toDate().toISOString());
        }
    }, [stableValue]);

    const handleDateChange = useCallback((date) => {
        const gregorianDate = date.convert(gregorian).toDate().toISOString();
        setGregorianDate(gregorianDate);
        onChange(date);
    }, [onChange]);

    return (
        <>
            <DatePicker
                value={stableValue}
                onChange={handleDateChange}
                format={hasTimePicker ? "YYYY/MM/DD -- HH:mm:ss" : "YYYY/MM/DD"}
                calendar={persian}
                locale={persian_fa}
                plugins={hasTimePicker ? [<TimePicker position="bottom" />] : []}
                render={<TextField fullWidth margin="dense" sx={{ width: '100%' }} inputProps={{ readOnly: true }} />}
            />
            <input type="hidden" name={`hide_${name}`} value={gregorianDate} />
        </>
    );
};

export default CustomDatePicker;
