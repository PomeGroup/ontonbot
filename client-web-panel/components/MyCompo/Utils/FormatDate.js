import React from 'react';
import moment from 'moment-timezone';
import 'moment/locale/fa'; // Ensure Persian locale is loaded
import jMoment from 'jalali-moment'; // Import Jalali moment
const FormatDate = ({ date ,t ,showTime=true}) => {
    if (!date) return '--';
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Check for Persian locale and use Jalali moment if true
    if(showTime)
    {
        if (t('locale') === 'fa' || t('locale') === 'fa-IR') {
            return jMoment(date).tz(userTimezone).locale('fa').format('DD MMMM YYYY, HH:mm');
        } else {
            return moment(date).tz(userTimezone).locale(t('locale')).format('YYYY MMMM DD, HH:mm');
        }
    }
    else
    {
        if (t('locale') === 'fa' || t('locale') === 'fa-IR') {
            return jMoment(date).tz(userTimezone).locale('fa').format('DD MMMM YYYY');
        } else {
            return moment(date).tz(userTimezone).locale(t('locale')).format('YYYY MMMM DD');
        }
    }

};

export default FormatDate;
