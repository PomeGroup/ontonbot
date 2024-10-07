import React from 'react';
import ListUsers from "@/components/MyCompo/Guests/GuestList"; // Adjust the import path as necessary
import Link from 'next/link';
import styles from '@/styles/PageTitle.module.css';
import useTranslation from "next-translate/useTranslation";

const EventManagement = () => {
    const { t, lang } = useTranslation('common');
    return (
        <>
            {/* Page title */}
            <div className={styles.pageTitle}>
                <h1>{t('left_side_menu.guests')}</h1>
                <ul>
                    <li>
                        <Link href="/">{t('left_side_menu.home')}</Link>
                    </li>
                    <li>{t('left_side_menu.guests')}</li>
                </ul>
            </div>

            {/* ListUsers */}
            <ListUsers />
        </>
    );
}

export default EventManagement;
