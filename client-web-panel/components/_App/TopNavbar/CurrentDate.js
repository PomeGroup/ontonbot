import React, { useState, useEffect } from 'react';
import styles from "@/components/_App/TopNavbar/CurrentDate.module.css";
import moment from 'jalali-moment';
import { useRouter } from 'next/router';

function CurrentDate() {
  const [currentDate, setCurrentDate] = useState('');
  const router = useRouter();
  const { locale } = router;

  useEffect(() => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const date = new Date();


      const formatter = new Intl.DateTimeFormat(locale, options);
      setCurrentDate(formatter.format(date));

  }, [locale]);

  return (
      <>
        <div className={styles.currentDate}>
          <i className="ri-calendar-2-line"></i>
          {currentDate}
        </div>
      </>
  );
}

export default CurrentDate;
